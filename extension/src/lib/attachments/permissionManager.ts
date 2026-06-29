/**
 * Requests microphone access lazily when the user starts a voice note.
 * @returns The active `MediaStream` on success.
 */
export async function requestMicrophoneAccess(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Microphone recording is not supported in this browser.");
  }

  try {
    return await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    throw new Error("Microphone access was denied. Voice notes need microphone permission.");
  }
}
