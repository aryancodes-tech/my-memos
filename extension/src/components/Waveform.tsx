import { useCallback, useRef, type CSSProperties } from "react";

interface WaveformProps {
  /** Normalized bar heights (0-1). */
  peaks: number[];
  /** Playback progress (0-1) used to color the played portion. */
  progress?: number;
  /** When provided, the bar is interactive and reports seek position (0-1). */
  onSeek?: (ratio: number) => void;
  /** Disables the played/unplayed split (used for live recording). */
  live?: boolean;
  className?: string;
}

/**
 * Messaging-style audio waveform. Renders normalized peaks as vertical bars,
 * splitting played vs unplayed segments and supporting click/drag seeking.
 */
export default function Waveform({
  peaks,
  progress = 0,
  onSeek,
  live = false,
  className,
}: WaveformProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const seekFromEvent = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el || !onSeek) return;
      const rect = el.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      onSeek(ratio);
    },
    [onSeek],
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!onSeek) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      seekFromEvent(event.clientX);
    },
    [onSeek, seekFromEvent],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!onSeek || event.buttons === 0) return;
      seekFromEvent(event.clientX);
    },
    [onSeek, seekFromEvent],
  );

  const playhead = progress * peaks.length;

  return (
    <div
      ref={trackRef}
      className={`ko-waveform ${onSeek ? "is-interactive" : ""} ${className ?? ""}`}
      role={onSeek ? "slider" : "img"}
      aria-label="Audio waveform"
      aria-valuemin={onSeek ? 0 : undefined}
      aria-valuemax={onSeek ? 100 : undefined}
      aria-valuenow={onSeek ? Math.round(progress * 100) : undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
    >
      {peaks.map((peak, index) => {
        // Fractional fill (0-1) of this bar, giving a smooth sub-bar playhead
        // instead of snapping one whole bar at a time.
        const fill = live ? 0 : Math.max(0, Math.min(1, playhead - index));
        const style: CSSProperties = { height: `${Math.max(6, peak * 100)}%` };
        return (
          <span key={index} className="ko-waveform-bar" style={style}>
            {!live && fill > 0 && (
              <span className="ko-waveform-bar-fill" style={{ width: `${fill * 100}%` }} />
            )}
          </span>
        );
      })}
    </div>
  );
}
