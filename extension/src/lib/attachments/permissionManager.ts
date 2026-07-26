import { MICROPHONE_DENIED_MESSAGE, MICROPHONE_UNSUPPORTED_MESSAGE } from "@/lib/constants";

/**
 * Requests microphone access lazily when the user starts a voice note.
 * @returns The active `MediaStream` on success.
 */
export async function requestMicrophoneAccess(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error(MICROPHONE_UNSUPPORTED_MESSAGE);
  }

  try {
    return await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    throw new Error(MICROPHONE_DENIED_MESSAGE);
  }
}
