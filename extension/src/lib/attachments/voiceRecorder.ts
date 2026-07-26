import { getPreferredVoiceNoteMimeType } from "@/lib/attachments/attachmentManager";

/** Milliseconds between live waveform bars (controls scroll speed). */
const VOICE_LEVEL_EMIT_INTERVAL_MS = 130;

/** Voice recorder lifecycle states. */
export type VoiceRecorderState = "idle" | "recording" | "paused" | "stopped";

/** Callbacks for voice recorder UI updates. */
export interface VoiceRecorderCallbacks {
  onStateChange?: (state: VoiceRecorderState) => void;
  onDurationTick?: (seconds: number) => void;
  /** Live microphone amplitude (0-1) for the recording waveform. */
  onLevel?: (level: number) => void;
  onError?: (message: string) => void;
}

/**
 * Wraps `MediaRecorder` with pause/resume/stop helpers for the voice note modal.
 * Audio is collected as WebM/Opus when supported by the browser.
 */
export class VoiceRecorder {
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: BlobPart[] = [];
  private state: VoiceRecorderState = "idle";
  private startedAtMs = 0;
  private accumulatedMs = 0;
  private tickTimer: number | null = null;
  private callbacks: VoiceRecorderCallbacks;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private levelFrame: number | null = null;
  private levelBuffer: Uint8Array<ArrayBuffer> | null = null;

  constructor(callbacks: VoiceRecorderCallbacks = {}) {
    this.callbacks = callbacks;
  }

  /** Current recorder state. */
  get currentState(): VoiceRecorderState {
    return this.state;
  }

  /** Elapsed recording duration in seconds (excludes paused time). */
  get durationSeconds(): number {
    if (this.state === "recording") {
      return (this.accumulatedMs + (performance.now() - this.startedAtMs)) / 1000;
    }
    return this.accumulatedMs / 1000;
  }

  /** Starts recording using the provided microphone stream. */
  start(stream: MediaStream): void {
    this.resetInternal();
    this.mediaStream = stream;
    const mimeType = getPreferredVoiceNoteMimeType();
    this.mediaRecorder = new MediaRecorder(stream, { mimeType });
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.chunks.push(event.data);
    };
    this.mediaRecorder.onerror = () => {
      this.callbacks.onError?.("Recording was interrupted.");
      void this.cancel();
    };
    this.mediaRecorder.start(250);
    this.setState("recording");
    this.startedAtMs = performance.now();
    this.startTicking();
    this.startLevelMetering(stream);
  }

  /** Pauses an active recording. */
  pause(): void {
    if (!this.mediaRecorder || this.state !== "recording") return;
    this.mediaRecorder.pause();
    this.accumulatedMs += performance.now() - this.startedAtMs;
    this.stopTicking();
    this.stopLevelMetering();
    this.callbacks.onLevel?.(0);
    this.setState("paused");
  }

  /** Resumes a paused recording. */
  resume(): void {
    if (!this.mediaRecorder || this.state !== "paused") return;
    this.mediaRecorder.resume();
    this.startedAtMs = performance.now();
    this.startTicking();
    if (this.mediaStream) this.startLevelMetering(this.mediaStream);
    this.setState("recording");
  }

  /**
   * Stops recording and returns the captured audio blob.
   * Leaves the microphone stream open until `cancel()` is called.
   */
  async stop(): Promise<Blob> {
    if (!this.mediaRecorder) {
      throw new Error("VoiceRecorder.stop called before start");
    }

    if (this.state === "recording") {
      this.accumulatedMs += performance.now() - this.startedAtMs;
    }
    this.stopTicking();
    this.stopLevelMetering();

    await new Promise<void>((resolve) => {
      if (!this.mediaRecorder) {
        resolve();
        return;
      }
      this.mediaRecorder.onstop = () => resolve();
      this.mediaRecorder.stop();
    });

    this.setState("stopped");
    const mimeType = this.mediaRecorder.mimeType || getPreferredVoiceNoteMimeType();
    return new Blob(this.chunks, { type: mimeType });
  }

  /** Cancels recording and releases the microphone stream. */
  async cancel(): Promise<void> {
    this.stopTicking();
    this.stopLevelMetering();
    if (this.mediaRecorder && this.state !== "stopped" && this.state !== "idle") {
      try {
        this.mediaRecorder.stop();
      } catch {
        // Recorder may already be stopped.
      }
    }
    this.releaseStream();
    this.resetInternal();
    this.setState("idle");
  }

  private resetInternal(): void {
    this.mediaRecorder = null;
    this.chunks = [];
    this.startedAtMs = 0;
    this.accumulatedMs = 0;
  }

  private releaseStream(): void {
    this.mediaStream?.getTracks().forEach((track) => track.stop());
    this.mediaStream = null;
  }

  private setState(next: VoiceRecorderState): void {
    this.state = next;
    this.callbacks.onStateChange?.(next);
  }

  private startTicking(): void {
    this.stopTicking();
    this.tickTimer = window.setInterval(() => {
      this.callbacks.onDurationTick?.(this.durationSeconds);
    }, 200);
  }

  private stopTicking(): void {
    if (this.tickTimer !== null) {
      window.clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
  }

  /** Starts a Web Audio analyser loop that reports live amplitude (0-1). */
  private startLevelMetering(stream: MediaStream): void {
    if (!this.callbacks.onLevel) return;
    try {
      const Ctor =
        window.AudioContext ??
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;

      this.audioContext = new Ctor();
      const source = this.audioContext.createMediaStreamSource(stream);
      const analyser = this.audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      this.analyser = analyser;
      this.levelBuffer = new Uint8Array(new ArrayBuffer(analyser.fftSize));

      let lastEmitMs = 0;
      let peakSinceEmit = 0;
      const tick = (now: number) => {
        if (!this.analyser || !this.levelBuffer) return;
        this.analyser.getByteTimeDomainData(this.levelBuffer);
        let sumSquares = 0;
        for (let i = 0; i < this.levelBuffer.length; i += 1) {
          const centered = (this.levelBuffer[i] - 128) / 128;
          sumSquares += centered * centered;
        }
        const rms = Math.min(1, Math.sqrt(sumSquares / this.levelBuffer.length) * 2.4);
        if (rms > peakSinceEmit) peakSinceEmit = rms;

        // Emit one bar per interval so the waveform scrolls at a readable pace,
        // using the peak amplitude observed since the last emit.
        if (now - lastEmitMs >= VOICE_LEVEL_EMIT_INTERVAL_MS) {
          lastEmitMs = now;
          this.callbacks.onLevel?.(peakSinceEmit);
          peakSinceEmit = 0;
        }
        this.levelFrame = window.requestAnimationFrame(tick);
      };
      this.levelFrame = window.requestAnimationFrame(tick);
    } catch (err) {
      console.warn("[MyMemos] Live waveform metering unavailable:", err);
    }
  }

  /** Stops the analyser loop and releases its audio graph. */
  private stopLevelMetering(): void {
    if (this.levelFrame !== null) {
      window.cancelAnimationFrame(this.levelFrame);
      this.levelFrame = null;
    }
    this.analyser?.disconnect();
    this.analyser = null;
    this.levelBuffer = null;
    if (this.audioContext) {
      void this.audioContext.close().catch(() => undefined);
      this.audioContext = null;
    }
  }
}
