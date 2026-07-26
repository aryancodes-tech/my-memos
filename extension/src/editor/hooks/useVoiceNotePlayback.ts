import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAttachmentObjectUrl } from "@/lib/attachments/attachmentManager";
import { formatDurationSeconds } from "@/lib/attachments/format";
import { splitAttachmentPath } from "@/lib/attachments/fileName";
import { computeWaveformPeaks, syntheticPeaks } from "@/lib/attachments/waveform";
import {
  VOICE_NOTE_DEFAULT_TITLE,
  VOICE_NOTE_PLAYBACK_SPEEDS,
  VOICE_NOTE_WAVEFORM_BARS,
} from "@/lib/constants";
import { useStore } from "@/store/useStore";
import { len } from "@/lib/text";
import type { VoiceNoteStatus } from "@/editor/voiceNote";

export interface UseVoiceNotePlaybackArgs {
  status: VoiceNoteStatus;
  attachmentPath: string | null;
  durationAttr: number;
  sizeAttr: number;
  title: string;
  initialPeaks?: number[] | null;
  initialDuration?: number;
  updateAttributes: (attrs: Record<string, unknown>) => void;
  deleteNode: () => void;
}

/** Saved voice-note load, waveform, and playback controls. */
export function useVoiceNotePlayback({
  status,
  attachmentPath,
  durationAttr,
  sizeAttr,
  title,
  initialPeaks,
  initialDuration,
  updateAttributes,
  deleteNode,
}: UseVoiceNotePlaybackArgs) {
  const requestAttachmentDelete = useStore((state) => state.requestAttachmentDelete);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(status === "saved" && len(attachmentPath ?? "") > 0);
  const [playError, setPlayError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || durationAttr);
  const [speedIndex, setSpeedIndex] = useState(0);
  const [labelDraft, setLabelDraft] = useState(title);
  const fallbackPeaks = useMemo(
    () => syntheticPeaks(VOICE_NOTE_WAVEFORM_BARS, sizeAttr || durationAttr || 1),
    [sizeAttr, durationAttr],
  );
  const [peaks, setPeaks] = useState<number[]>(initialPeaks ?? fallbackPeaks);

  useEffect(() => {
    if (initialPeaks) setPeaks(initialPeaks);
  }, [initialPeaks]);

  useEffect(() => {
    if (initialDuration && initialDuration > 0) setDuration(initialDuration);
  }, [initialDuration]);

  useEffect(() => {
    setLabelDraft(title);
  }, [title]);

  const commitLabel = useCallback(() => {
    const trimmed = labelDraft.trim();
    const next = len(trimmed) === 0 ? VOICE_NOTE_DEFAULT_TITLE : trimmed;
    if (len(trimmed) === 0) setLabelDraft(next);
    if (next !== title) updateAttributes({ title: next });
  }, [labelDraft, title, updateAttributes]);

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

  return {
    audioRef,
    objectUrl,
    loading,
    playError,
    playing,
    currentTime,
    duration,
    setDuration,
    speedIndex,
    labelDraft,
    setLabelDraft,
    peaks,
    progress,
    timeLabel,
    speedLabel,
    commitLabel,
    togglePlayback,
    handleSeek,
    cycleSpeed,
    handleDownload,
    handleDelete,
    setPlaying,
    setCurrentTime,
  };
}
