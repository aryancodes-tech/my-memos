import { useCallback, useEffect, useRef, useState } from "react";
import { saveAudioAttachment } from "@/lib/attachments/attachmentManager";
import { requestMicrophoneAccess } from "@/lib/attachments/permissionManager";
import { VoiceRecorder, type VoiceRecorderState } from "@/lib/attachments/voiceRecorder";
import { computeWaveformPeaks } from "@/lib/attachments/waveform";
import {
  VOICE_NOTE_LIVE_WAVEFORM_BARS,
  VOICE_NOTE_WAVEFORM_BARS,
  VOICE_NOTE_WAVEFORM_MIN_BAR,
} from "@/lib/constants";
import type { VoiceNoteStatus } from "@/editor/voiceNote";

function createIdleLevels(): number[] {
  return new Array(VOICE_NOTE_LIVE_WAVEFORM_BARS).fill(VOICE_NOTE_WAVEFORM_MIN_BAR);
}

export interface UseVoiceNoteRecordingArgs {
  status: VoiceNoteStatus;
  autoStart: boolean;
  updateAttributes: (attrs: Record<string, unknown>) => void;
  deleteNode: () => void;
}

/** Inline recording lifecycle for a `voiceNote` node with `status: "recording"`. */
export function useVoiceNoteRecording({
  status,
  autoStart,
  updateAttributes,
  deleteNode,
}: UseVoiceNoteRecordingArgs) {
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
  const [peaks, setPeaks] = useState<number[] | null>(null);
  const [savedDuration, setSavedDuration] = useState(0);

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
      setSavedDuration(ref.duration ?? durationSeconds);
      setPendingBlob(null);
      setPendingDuration(0);
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

  const isRecActive = recorderState === "recording" || recorderState === "paused";
  const canSaveRecording = pendingBlob !== null || isRecActive;

  return {
    recorderRef,
    recorderState,
    recordDuration,
    liveLevels,
    recordError,
    saving,
    peaks,
    savedDuration,
    canSaveRecording,
    handleCancelRecording,
    handleFinishRecording,
  };
}
