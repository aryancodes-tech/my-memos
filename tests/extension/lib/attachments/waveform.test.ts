import { describe, expect, it } from "vitest";
import { VOICE_NOTE_WAVEFORM_MIN_BAR } from "@/lib/constants";
import { computeWaveformPeaks, syntheticPeaks } from "@/lib/attachments/waveform";

describe("syntheticPeaks", () => {
  it("returns the requested bar count with values in [min, 1]", () => {
    const peaks = syntheticPeaks(12, 1024);
    expect(peaks).toHaveLength(12);
    for (const peak of peaks) {
      expect(peak).toBeGreaterThanOrEqual(VOICE_NOTE_WAVEFORM_MIN_BAR);
      expect(peak).toBeLessThanOrEqual(1);
    }
  });

  it("is deterministic for the same seed", () => {
    expect(syntheticPeaks(8, 42)).toEqual(syntheticPeaks(8, 42));
  });

  it("varies with different seeds", () => {
    expect(syntheticPeaks(8, 1)).not.toEqual(syntheticPeaks(8, 2));
  });

  it("handles zero seed without producing NaN", () => {
    const peaks = syntheticPeaks(4, 0);
    expect(peaks).toHaveLength(4);
    expect(peaks.every((value) => Number.isFinite(value))).toBe(true);
  });
});

describe("computeWaveformPeaks", () => {
  it("falls back to synthetic peaks when decoding fails", async () => {
    const blob = {
      size: 99,
      arrayBuffer: async () => {
        throw new Error("decode unavailable");
      },
    } as unknown as Blob;

    const peaks = await computeWaveformPeaks(blob, 6);
    expect(peaks).toEqual(syntheticPeaks(6, 99));
  });
});
