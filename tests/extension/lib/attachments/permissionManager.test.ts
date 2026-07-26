import { afterEach, describe, expect, it, vi } from "vitest";
import { MICROPHONE_DENIED_MESSAGE, MICROPHONE_UNSUPPORTED_MESSAGE } from "@/lib/constants";
import { requestMicrophoneAccess } from "@/lib/attachments/permissionManager";

describe("requestMicrophoneAccess", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("throws when getUserMedia is unavailable", async () => {
    vi.stubGlobal("navigator", { mediaDevices: undefined });
    await expect(requestMicrophoneAccess()).rejects.toThrow(MICROPHONE_UNSUPPORTED_MESSAGE);
  });

  it("returns the media stream on success", async () => {
    const stream = { id: "mic" } as unknown as MediaStream;
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });

    await expect(requestMicrophoneAccess()).resolves.toBe(stream);
    expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
  });

  it("maps permission failures to the denied message", async () => {
    const getUserMedia = vi.fn().mockRejectedValue(new Error("Permission denied"));
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });

    await expect(requestMicrophoneAccess()).rejects.toThrow(MICROPHONE_DENIED_MESSAGE);
  });
});
