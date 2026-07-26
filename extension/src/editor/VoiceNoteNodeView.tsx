import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { AlertCircle, Check, Download, Loader2, Pause, Play, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  deleteAttachment,
  getAttachmentObjectUrl,
  saveAudioAttachment,
} from "@/lib/attachments/attachmentManager";
import { formatDurationSeconds } from "@/lib/attachments/format";
import { splitAttachmentPath } from "@/lib/attachments/fileName";
import { requestMicrophoneAccess } from "@/lib/attachments/permissionManager";
import { VoiceRecorder, type VoiceRecorderState } from "@/lib/attachments/voiceRecorder";
import { computeWaveformPeaks, syntheticPeaks } from "@/lib/attachments/waveform";
import Waveform from "@/components/Waveform";
import {
  VOICE_NOTE_LIVE_WAVEFORM_BARS,
  VOICE_NOTE_PLAYBACK_SPEEDS,
  VOICE_NOTE_WAVEFORM_BARS,
  VOICE_NOTE_WAVEFORM_MIN_BAR,
} from "@/lib/constants";
import { useStore } from "@/store/useStore";
import { len } from "@/lib/text";
import type { VoiceNoteStatus } from "@/editor/voiceNote";

function createIdleLevels(): number[] {
  return new Array(VOICE_NOTE_LIVE_WAVEFORM_BARS).fill(VOICE_NOTE_WAVEFORM_MIN_BAR);
}

/** Embedded voice note: inline recording or saved playback with waveform. */
export default function VoiceNoteNodeView({
  node,
  updateAttributes,
  deleteNode,
  selected,
}: NodeViewProps) {
  const status = (node.attrs.status as VoiceNoteStatus | undefined) ?? "saved";
  const autoStart = node.attrs.autoStart === true;
  const attachmentPath = node.attrs.attachmentPath as string | null;
  const durationAttr = Number(node.attrs.duration ?? 0);
  const sizeAttr = Number(node.attrs.size ?? 0);
  const title = (node.attrs.title as string | undefined) ?? "Voice Note";

  const requestAttachmentDelete = useStore((state) => state.requestAttachmentDelete);

  // --- Recording state ---
  const recorderRef = useRef<VoiceRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startedRef = useRef(false);
  const [recorderState, setRecorderState] = useState<VoiceRecorderState>("idle");
  const [recordDuration, setRecordDuration] = useState(0);
  const [liveLevels, setLiveLevels] = useState<number[]>(createIdleLevels);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [pendingDuration, setPendingDuration] = useState(0);

  // --- Playback state ---
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(status === "saved" && len(attachmentPath ?? "") > 0);
  const [playError, setPlayError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationAttr);
  const [speedIndex, setSpeedIndex] = useState(0);
  const [labelDraft, setLabelDraft] = useState(title);
  const fallbackPeaks = useMemo(
    () => syntheticPeaks(VOICE_NOTE_WAVEFORM_BARS, sizeAttr || durationAttr || 1),
    [sizeAttr, durationAttr],
  );
  const [peaks, setPeaks] = useState<number[]>(fallbackPeaks);

  useEffect(() => {
    setLabelDraft(title);
  }, [title]);

  // Persist the renamed label, falling back to the default when emptied.
  const commitLabel = useCallback(() => {
    const trimmed = labelDraft.trim();
    const next = len(trimmed) === 0 ? "Voice Note" : trimmed;
    if (len(trimmed) === 0) setLabelDraft(next);
    if (next !== title) updateAttributes({ title: next });
  }, [labelDraft, title, updateAttributes]);

  const pushLevel = useCallback((level: number) => {
    setLiveLevels((prev) => {
      const next = prev.slice(1);
      next.push(Math.max(VOICE_NOTE_WAVEFORM_MIN_BAR, level));
      return next;
    });
  }, []);

  const cleanupRecording = useCallback(async () => {
    await recorderRef.current?.cancel();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    startedRef.current = false;
  }, []);

  // Auto-start recording only for freshly inserted blocks (`autoStart: true`).
  // Persisted recording blocks are stripped on save; any survivors show an error.
  useEffect(() => {
    if (status !== "recording" || startedRef.current) return;
    startedRef.current = true;

    if (!autoStart) {
      setRecordError("Recording was interrupted. Remove this block to continue.");
      return;
    }

    updateAttributes({ autoStart: false });

    void (async () => {
      setRecordError(null);
      try {
        const stream = await requestMicrophoneAccess();
        streamRef.current = stream;
        const recorder = new VoiceRecorder({
          onStateChange: setRecorderState,
          onDurationTick: setRecordDuration,
          onLevel: pushLevel,
          onError: (message) => setRecordError(message),
        });
        recorderRef.current = recorder;
        recorder.start(stream);
      } catch (err) {
        setRecordError(
          err instanceof Error ? err.message : "Could not start recording. Check your microphone.",
        );
      }
    })();

    return () => {
      void cleanupRecording();
    };
  }, [status, autoStart, pushLevel, cleanupRecording, updateAttributes]);

  // Load saved attachment for playback
  useEffect(() => {
    if (status !== "saved" || len(attachmentPath ?? "") === 0) return;

    let cancelled = false;
    setLoading(true);
    setPlayError(null);

    void getAttachmentObjectUrl(attachmentPath!)
      .then(async (url) => {
        if (cancelled) return;
        setObjectUrl(url);
        setLoading(false);
        try {
          const blob = await (await fetch(url)).blob();
          const computed = await computeWaveformPeaks(blob, VOICE_NOTE_WAVEFORM_BARS);
          if (!cancelled) setPeaks(computed);
        } catch {
          // Keep fallback peaks.
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoading(false);
        setPlayError("Voice note unavailable.");
        console.warn("[MyMemos] Failed to load voice note:", attachmentPath, err);
      });

    return () => {
      cancelled = true;
    };
  }, [status, attachmentPath]);

  const handleCancelRecording = useCallback(async () => {
    await cleanupRecording();
    deleteNode();
  }, [cleanupRecording, deleteNode]);

  const saveRecordingBlob = useCallback(
    async (blob: Blob, durationSeconds: number) => {
      const ref = await saveAudioAttachment(blob, durationSeconds);
      const computed = await computeWaveformPeaks(blob, VOICE_NOTE_WAVEFORM_BARS);

      updateAttributes({
        status: "saved",
        attachmentPath: ref.path,
        duration: ref.duration ?? durationSeconds,
        size: ref.size ?? blob.size,
        title: ref.title,
        createdAt: ref.createdAt,
      });
      setPeaks(computed);
      setDuration(ref.duration ?? durationSeconds);
      setPendingBlob(null);
      setPendingDuration(0);
      setLoading(false);
    },
    [updateAttributes],
  );

  const handleFinishRecording = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    setRecordError(null);

    try {
      if (pendingBlob) {
        await saveRecordingBlob(pendingBlob, pendingDuration);
        return;
      }

      if (!recorderRef.current) return;

      const recorder = recorderRef.current;
      const blob = await recorder.stop();
      const finalDuration = recorder.durationSeconds;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      recorderRef.current = null;

      setPendingBlob(blob);
      setPendingDuration(finalDuration);
      setRecordDuration(finalDuration);

      await saveRecordingBlob(blob, finalDuration);
    } catch {
      setRecordError("Could not save the voice note. Tap save to try again.");
    } finally {
      setSaving(false);
    }
  }, [pendingBlob, pendingDuration, saveRecordingBlob, saving]);

  // Smoothly track playback position with rAF; the audio `timeupdate` event
  // only fires ~4x/sec, which makes the waveform fill jump bar-by-bar.
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const loop = () => {
      const audio = audioRef.current;
      if (audio) setCurrentTime(audio.currentTime);
      frame = window.requestAnimationFrame(loop);
    };
    frame = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(frame);
  }, [playing]);

  const togglePlayback = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try {
        await audio.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
    } else {
      audio.pause();
      setPlaying(false);
    }
  }, []);

  const handleSeek = useCallback(
    (ratio: number) => {
      const audio = audioRef.current;
      const effectiveDuration = duration || durationAttr;
      if (!audio || effectiveDuration <= 0) return;
      const next = ratio * effectiveDuration;
      audio.currentTime = next;
      setCurrentTime(next);
    },
    [duration, durationAttr],
  );

  const cycleSpeed = useCallback(() => {
    const nextIndex = (speedIndex + 1) % VOICE_NOTE_PLAYBACK_SPEEDS.length;
    setSpeedIndex(nextIndex);
    const rate = VOICE_NOTE_PLAYBACK_SPEEDS[nextIndex];
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, [speedIndex]);

  const handleDownload = useCallback(() => {
    if (len(objectUrl ?? "") === 0 || len(attachmentPath ?? "") === 0) return;
    const { fileName } = splitAttachmentPath(attachmentPath!);
    const anchor = document.createElement("a");
    anchor.href = objectUrl!;
    anchor.download = fileName;
    anchor.click();
  }, [attachmentPath, objectUrl]);

  const handleDelete = useCallback(() => {
    if (len(attachmentPath ?? "") === 0) {
      deleteNode();
      return;
    }
    requestAttachmentDelete({
      attachmentPath: attachmentPath!,
      onConfirm: async () => {
        try {
          await deleteAttachment(attachmentPath!);
        } catch (err) {
          // File may already be missing (unavailable note); remove the block anyway.
          console.warn("[MyMemos] Failed to delete voice note file:", attachmentPath, err);
        }
        deleteNode();
      },
    });
  }, [attachmentPath, deleteNode, requestAttachmentDelete]);

  const effectiveDuration = duration || durationAttr;
  const progress = effectiveDuration > 0 ? currentTime / effectiveDuration : 0;
  const totalLabel = formatDurationSeconds(effectiveDuration);
  const timeLabel =
    playing || currentTime > 0
      ? `${formatDurationSeconds(currentTime)} / ${totalLabel}`
      : totalLabel;
  const speedLabel = `${VOICE_NOTE_PLAYBACK_SPEEDS[speedIndex]}x`;

  const isRecording = status === "recording";
  const isRecActive = recorderState === "recording" || recorderState === "paused";
  const canSaveRecording = pendingBlob !== null || isRecActive;

  return (
    <NodeViewWrapper
      className={`ko-voice-note-block ${selected ? "is-selected" : ""}`}
      data-drag-handle={status === "saved" ? true : undefined}
    >
      {/* Inline recording bar */}
      {isRecording && (
        <div className="ko-voice-note-recbar">
          <button
            type="button"
            className="ko-voice-note-icon-btn ko-voice-note-btn-danger"
            title="Cancel"
            aria-label="Cancel recording"
            disabled={saving}
            onClick={() => void handleCancelRecording()}
          >
            <Trash2 size={16} strokeWidth={1.75} />
          </button>

          <span className="ko-voice-note-rec-status">
            <span
              className={`ko-voice-note-rec-dot ${recorderState === "paused" ? "is-paused" : ""}`}
              aria-hidden
            />
            <span className="ko-voice-note-rec-timer">{formatDurationSeconds(recordDuration)}</span>
          </span>

          <Waveform peaks={liveLevels} live className="ko-voice-note-live-wave" />

          {recorderState === "recording" ? (
            <button
              type="button"
              className="ko-voice-note-icon-btn"
              title="Pause"
              aria-label="Pause recording"
              onClick={() => recorderRef.current?.pause()}
            >
              <Pause size={16} strokeWidth={1.75} />
            </button>
          ) : (
            <button
              type="button"
              className="ko-voice-note-icon-btn"
              title="Resume"
              aria-label="Resume recording"
              onClick={() => recorderRef.current?.resume()}
            >
              <Play size={16} strokeWidth={1.75} />
            </button>
          )}

          <button
            type="button"
            className="ko-voice-note-send-btn"
            title="Save recording"
            aria-label="Save recording"
            disabled={saving || !canSaveRecording}
            onClick={() => void handleFinishRecording()}
          >
            {saving ? (
              <Loader2 size={16} className="ko-attachment-spinner" strokeWidth={1.75} />
            ) : (
              <Check size={18} strokeWidth={2.25} />
            )}
          </button>
        </div>
      )}

      {isRecording && recordError && (
        <p className="ko-voice-note-inline-error" role="alert">
          {recordError}
        </p>
      )}

      {/* Saved playback */}
      {status === "saved" && loading && (
        <div className="ko-voice-note-player ko-voice-note-loading">
          <Loader2 size={16} className="ko-attachment-spinner" strokeWidth={1.75} />
          <span className="ko-voice-note-status">Loading recording…</span>
        </div>
      )}

      {status === "saved" && !loading && len(attachmentPath ?? "") === 0 && (
        <div className="ko-voice-note-player ko-voice-note-error" role="alert">
          <span className="ko-voice-note-error-msg">
            <AlertCircle size={16} strokeWidth={1.75} />
            <span>Voice note unavailable.</span>
          </span>
          <button
            type="button"
            className="ko-voice-note-icon-btn ko-voice-note-btn-danger"
            title="Remove voice note"
            aria-label="Remove voice note"
            onClick={handleDelete}
          >
            <Trash2 size={14} strokeWidth={1.75} />
          </button>
        </div>
      )}

      {status === "saved" && playError && (
        <div className="ko-voice-note-player ko-voice-note-error" role="alert">
          <span className="ko-voice-note-error-msg">
            <AlertCircle size={16} strokeWidth={1.75} />
            <span>{playError}</span>
          </span>
          <button
            type="button"
            className="ko-voice-note-icon-btn ko-voice-note-btn-danger"
            title="Remove voice note"
            aria-label="Remove voice note"
            onClick={handleDelete}
          >
            <Trash2 size={14} strokeWidth={1.75} />
          </button>
        </div>
      )}

      {status === "saved" && !loading && !playError && objectUrl && (
        <div className="ko-voice-note-player">
          <audio
            ref={audioRef}
            src={objectUrl}
            preload="metadata"
            onLoadedMetadata={(event) => {
              const next = event.currentTarget.duration;
              if (Number.isFinite(next) && next > 0) setDuration(next);
              event.currentTarget.playbackRate = VOICE_NOTE_PLAYBACK_SPEEDS[speedIndex];
            }}
            onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
            onEnded={(event) => {
              setPlaying(false);
              setCurrentTime(0);
              event.currentTarget.currentTime = 0;
            }}
            onPause={() => setPlaying(false)}
            onPlay={() => setPlaying(true)}
          />

          <div className="ko-voice-note-row">
            <button
              type="button"
              className="ko-voice-note-play"
              title={playing ? "Pause" : "Play"}
              aria-label={playing ? "Pause" : "Play"}
              onClick={togglePlayback}
            >
              {playing ? (
                <Pause size={16} strokeWidth={2} fill="currentColor" />
              ) : (
                <Play size={16} strokeWidth={2} fill="currentColor" />
              )}
            </button>

            <div className="ko-voice-note-main">
              <Waveform peaks={peaks} progress={progress} onSeek={handleSeek} />
            </div>

            <span className="ko-voice-note-time">{timeLabel}</span>

            <div className="ko-voice-note-side">
              <button
                type="button"
                className="ko-voice-note-speed-btn"
                title="Change playback speed"
                aria-label={`Playback speed ${speedLabel}`}
                onClick={cycleSpeed}
              >
                {speedLabel}
              </button>
              <button
                type="button"
                className="ko-voice-note-icon-btn"
                title="Download"
                aria-label="Download voice note"
                onClick={handleDownload}
              >
                <Download size={14} strokeWidth={1.75} />
              </button>
              <button
                type="button"
                className="ko-voice-note-icon-btn ko-voice-note-btn-danger"
                title="Delete voice note"
                aria-label="Delete voice note"
                onClick={handleDelete}
              >
                <Trash2 size={14} strokeWidth={1.75} />
              </button>
            </div>
          </div>

          <input
            type="text"
            className="ko-voice-note-label"
            value={labelDraft}
            placeholder="Voice Note"
            aria-label="Voice note label"
            onChange={(event) => setLabelDraft(event.target.value)}
            onBlur={commitLabel}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                event.currentTarget.blur();
              }
            }}
          />
        </div>
      )}
    </NodeViewWrapper>
  );
}
