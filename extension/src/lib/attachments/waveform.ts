import { VOICE_NOTE_WAVEFORM_MIN_BAR } from "@/lib/constants";

/** Shared AudioContext for decoding waveform peaks (created lazily). */
let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!sharedAudioContext) {
    const Ctor =
      window.AudioContext ??
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;
    if (!Ctor) {
      throw new Error("Web Audio API is not supported in this browser.");
    }
    sharedAudioContext = new Ctor();
  }
  return sharedAudioContext;
}

/**
 * Decodes an audio blob into normalized waveform peaks (0-1).
 * Falls back to a deterministic synthetic waveform when decoding is unavailable.
 * @param blob - Source audio blob.
 * @param barCount - Number of peaks (bars) to return.
 */
export async function computeWaveformPeaks(blob: Blob, barCount: number): Promise<number[]> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await getAudioContext().decodeAudioData(arrayBuffer.slice(0));
    return extractPeaks(audioBuffer, barCount);
  } catch (err) {
    console.warn("[MyMemos] Falling back to synthetic waveform:", err);
    return syntheticPeaks(barCount, blob.size);
  }
}

/** Downsamples decoded audio channel data into normalized peaks. */
function extractPeaks(audioBuffer: AudioBuffer, barCount: number): number[] {
  const channel = audioBuffer.getChannelData(0);
  const blockSize = Math.floor(channel.length / barCount) || 1;
  const peaks: number[] = [];
  let max = 0;

  for (let i = 0; i < barCount; i += 1) {
    const start = i * blockSize;
    let sum = 0;
    for (let j = 0; j < blockSize; j += 1) {
      const sample = channel[start + j] ?? 0;
      sum += sample * sample;
    }
    const rms = Math.sqrt(sum / blockSize);
    peaks.push(rms);
    if (rms > max) max = rms;
  }

  return normalizePeaks(peaks, max);
}

/** Normalizes raw peaks to 0-1 with a visible minimum floor. */
export function normalizePeaks(peaks: number[], max: number): number[] {
  if (max <= 0) {
    return peaks.map(() => VOICE_NOTE_WAVEFORM_MIN_BAR);
  }
  return peaks.map((value) => {
    const normalized = value / max;
    return Math.max(VOICE_NOTE_WAVEFORM_MIN_BAR, Math.min(1, normalized));
  });
}

/**
 * Builds a deterministic placeholder waveform when real decoding fails,
 * seeded by the file size so the same note always looks identical.
 */
export function syntheticPeaks(barCount: number, seed: number): number[] {
  const peaks: number[] = [];
  let state = seed % 2147483647 || 1;
  for (let i = 0; i < barCount; i += 1) {
    state = (state * 16807) % 2147483647;
    const pseudo = state / 2147483647;
    const wave = 0.5 + 0.5 * Math.sin(i / 2.5);
    peaks.push(Math.max(VOICE_NOTE_WAVEFORM_MIN_BAR, pseudo * 0.6 + wave * 0.4));
  }
  return peaks;
}
