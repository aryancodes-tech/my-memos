import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { AlertCircle, Check, Download, Loader2, Pause, Play, Trash2 } from "lucide-react";
import { formatDurationSeconds } from "@/lib/attachments/format";
import Waveform from "@/components/Waveform";
import { VOICE_NOTE_DEFAULT_TITLE, VOICE_NOTE_PLAYBACK_SPEEDS } from "@/lib/constants";
import { useVoiceNotePlayback } from "@/editor/hooks/useVoiceNotePlayback";
import { useVoiceNoteRecording } from "@/editor/hooks/useVoiceNoteRecording";
import { len } from "@/lib/text";
import type { VoiceNoteStatus } from "@/editor/voiceNote";

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
  const title = (node.attrs.title as string | undefined) ?? VOICE_NOTE_DEFAULT_TITLE;

  const recording = useVoiceNoteRecording({
    status,
    autoStart,
    updateAttributes,
    deleteNode,
  });

  const playback = useVoiceNotePlayback({
    status,
    attachmentPath,
    durationAttr,
    sizeAttr,
    title,
    initialPeaks: recording.peaks,
    initialDuration: recording.savedDuration,
    updateAttributes,
    deleteNode,
  });

  const isRecording = status === "recording";

  return (
    <NodeViewWrapper
      className={`ko-voice-note-block ${selected ? "is-selected" : ""}`}
      data-drag-handle={status === "saved" ? true : undefined}
    >
      {isRecording && (
        <div className="ko-voice-note-recbar">
          <button
            type="button"
            className="ko-voice-note-icon-btn ko-voice-note-btn-danger"
            title="Cancel"
            aria-label="Cancel recording"
            disabled={recording.saving}
            onClick={() => void recording.handleCancelRecording()}
          >
            <Trash2 size={16} strokeWidth={1.75} />
          </button>

          <span className="ko-voice-note-rec-status">
            <span
              className={`ko-voice-note-rec-dot ${recording.recorderState === "paused" ? "is-paused" : ""}`}
              aria-hidden
            />
            <span className="ko-voice-note-rec-timer">
              {formatDurationSeconds(recording.recordDuration)}
            </span>
          </span>

          <Waveform peaks={recording.liveLevels} live className="ko-voice-note-live-wave" />

          {recording.recorderState === "recording" ? (
            <button
              type="button"
              className="ko-voice-note-icon-btn"
              title="Pause"
              aria-label="Pause recording"
              onClick={() => recording.recorderRef.current?.pause()}
            >
              <Pause size={16} strokeWidth={1.75} />
            </button>
          ) : (
            <button
              type="button"
              className="ko-voice-note-icon-btn"
              title="Resume"
              aria-label="Resume recording"
              onClick={() => recording.recorderRef.current?.resume()}
            >
              <Play size={16} strokeWidth={1.75} />
            </button>
          )}

          <button
            type="button"
            className="ko-voice-note-send-btn"
            title="Save recording"
            aria-label="Save recording"
            disabled={recording.saving || !recording.canSaveRecording}
            onClick={() => void recording.handleFinishRecording()}
          >
            {recording.saving ? (
              <Loader2 size={16} className="ko-attachment-spinner" strokeWidth={1.75} />
            ) : (
              <Check size={18} strokeWidth={2.25} />
            )}
          </button>
        </div>
      )}

      {isRecording && recording.recordError && (
        <p className="ko-voice-note-inline-error" role="alert">
          {recording.recordError}
        </p>
      )}

      {status === "saved" && playback.loading && (
        <div className="ko-voice-note-player ko-voice-note-loading">
          <Loader2 size={16} className="ko-attachment-spinner" strokeWidth={1.75} />
          <span className="ko-voice-note-status">Loading recording…</span>
        </div>
      )}

      {status === "saved" && !playback.loading && len(attachmentPath ?? "") === 0 && (
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
            onClick={playback.handleDelete}
          >
            <Trash2 size={14} strokeWidth={1.75} />
          </button>
        </div>
      )}

      {status === "saved" && playback.playError && (
        <div className="ko-voice-note-player ko-voice-note-error" role="alert">
          <span className="ko-voice-note-error-msg">
            <AlertCircle size={16} strokeWidth={1.75} />
            <span>{playback.playError}</span>
          </span>
          <button
            type="button"
            className="ko-voice-note-icon-btn ko-voice-note-btn-danger"
            title="Remove voice note"
            aria-label="Remove voice note"
            onClick={playback.handleDelete}
          >
            <Trash2 size={14} strokeWidth={1.75} />
          </button>
        </div>
      )}

      {status === "saved" && !playback.loading && !playback.playError && playback.objectUrl && (
        <div className="ko-voice-note-player">
          <audio
            ref={playback.audioRef}
            src={playback.objectUrl}
            preload="metadata"
            onLoadedMetadata={(event) => {
              const next = event.currentTarget.duration;
              if (Number.isFinite(next) && next > 0) playback.setDuration(next);
              event.currentTarget.playbackRate = VOICE_NOTE_PLAYBACK_SPEEDS[playback.speedIndex];
            }}
            onTimeUpdate={(event) => playback.setCurrentTime(event.currentTarget.currentTime)}
            onEnded={(event) => {
              playback.setPlaying(false);
              playback.setCurrentTime(0);
              event.currentTarget.currentTime = 0;
            }}
            onPause={() => playback.setPlaying(false)}
            onPlay={() => playback.setPlaying(true)}
          />

          <div className="ko-voice-note-row">
            <button
              type="button"
              className="ko-voice-note-play"
              title={playback.playing ? "Pause" : "Play"}
              aria-label={playback.playing ? "Pause" : "Play"}
              onClick={playback.togglePlayback}
            >
              {playback.playing ? (
                <Pause size={16} strokeWidth={2} fill="currentColor" />
              ) : (
                <Play size={16} strokeWidth={2} fill="currentColor" />
              )}
            </button>

            <div className="ko-voice-note-main">
              <Waveform
                peaks={playback.peaks}
                progress={playback.progress}
                onSeek={playback.handleSeek}
              />
            </div>

            <span className="ko-voice-note-time">{playback.timeLabel}</span>

            <div className="ko-voice-note-side">
              <button
                type="button"
                className="ko-voice-note-speed-btn"
                title="Change playback speed"
                aria-label={`Playback speed ${playback.speedLabel}`}
                onClick={playback.cycleSpeed}
              >
                {playback.speedLabel}
              </button>
              <button
                type="button"
                className="ko-voice-note-icon-btn"
                title="Download"
                aria-label="Download voice note"
                onClick={playback.handleDownload}
              >
                <Download size={14} strokeWidth={1.75} />
              </button>
              <button
                type="button"
                className="ko-voice-note-icon-btn ko-voice-note-btn-danger"
                title="Delete voice note"
                aria-label="Delete voice note"
                onClick={playback.handleDelete}
              >
                <Trash2 size={14} strokeWidth={1.75} />
              </button>
            </div>
          </div>

          <input
            type="text"
            className="ko-voice-note-label"
            value={playback.labelDraft}
            placeholder={VOICE_NOTE_DEFAULT_TITLE}
            aria-label="Voice note label"
            onChange={(event) => playback.setLabelDraft(event.target.value)}
            onBlur={playback.commitLabel}
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
