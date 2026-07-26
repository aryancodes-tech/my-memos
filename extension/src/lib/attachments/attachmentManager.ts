import {
  ATTACHMENT_DIR_AUDIO,
  ATTACHMENT_DIR_IMAGES,
  ATTACHMENT_IMAGE_FILE_PREFIX,
  ATTACHMENT_PATH_EMPTY_MESSAGE,
  ATTACHMENT_STORAGE_UNAVAILABLE_MESSAGE,
  AUDIO_DURATION_READ_ERROR,
  VOICE_NOTE_DEFAULT_TITLE,
  VOICE_NOTE_FILE_EXTENSION,
  VOICE_NOTE_FILE_PREFIX,
  VOICE_NOTE_MIME_TYPE,
} from "@/lib/constants";
import { len } from "@/lib/text";
import type { AttachmentRef } from "@/storage/types";
import {
  buildAttachmentFileName,
  resolveUniqueFileName,
  splitAttachmentPath,
} from "@/lib/attachments/fileName";
import {
  getSubdirectoryHandle,
  getWritableAttachmentRoot,
  verifyAttachmentRootAccess,
} from "@/lib/attachments/fileSystemManager";
import { AttachmentIoError, AttachmentStorageUnavailableError } from "@/lib/attachments/errors";

/** Lazily created object URLs keyed by relative attachment path. */
const objectUrlCache = new Map<string, string>();

/** Revokes and clears cached object URLs (call on page unload if needed). */
export function revokeAllAttachmentObjectUrls(): void {
  for (const url of objectUrlCache.values()) {
    URL.revokeObjectURL(url);
  }
  objectUrlCache.clear();
}

/**
 * Saves an image blob to `images/` and returns its relative path.
 * @param file - Source image file from a file picker or clipboard.
 */
export async function saveImageAttachment(file: File | Blob, mimeType?: string): Promise<string> {
  const root = await getWritableAttachmentRoot();
  if (!(await verifyAttachmentRootAccess(root))) {
    throw new AttachmentStorageUnavailableError(ATTACHMENT_STORAGE_UNAVAILABLE_MESSAGE);
  }

  const imagesDir = await getSubdirectoryHandle(root, ATTACHMENT_DIR_IMAGES);
  const extension = inferImageExtension(file, mimeType);
  const baseName = buildAttachmentFileName(ATTACHMENT_IMAGE_FILE_PREFIX, extension);
  const fileName = await resolveUniqueFileName(imagesDir, baseName);
  const fileHandle = await imagesDir.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(file);
  await writable.close();
  return `${ATTACHMENT_DIR_IMAGES}/${fileName}`;
}

/**
 * Saves an audio recording to `audio/` and returns attachment metadata.
 * @param blob - Recorded audio blob.
 * @param durationSeconds - Recording duration in seconds.
 */
export async function saveAudioAttachment(
  blob: Blob,
  durationSeconds: number,
): Promise<AttachmentRef> {
  const root = await getWritableAttachmentRoot();
  if (!(await verifyAttachmentRootAccess(root))) {
    throw new AttachmentStorageUnavailableError(ATTACHMENT_STORAGE_UNAVAILABLE_MESSAGE);
  }

  const audioDir = await getSubdirectoryHandle(root, ATTACHMENT_DIR_AUDIO);
  const baseName = buildAttachmentFileName(VOICE_NOTE_FILE_PREFIX, VOICE_NOTE_FILE_EXTENSION);
  const fileName = await resolveUniqueFileName(audioDir, baseName);
  const fileHandle = await audioDir.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();

  const path = `${ATTACHMENT_DIR_AUDIO}/${fileName}`;
  return {
    type: "audio",
    path,
    duration: Math.max(0, Math.round(durationSeconds)),
    size: blob.size,
    createdAt: new Date().toISOString(),
    title: VOICE_NOTE_DEFAULT_TITLE,
  };
}

/**
 * Copies an uploaded audio file into `audio/` and returns attachment metadata.
 * @param file - Local audio file chosen by the user.
 */
export async function saveUploadedAudioAttachment(file: File): Promise<AttachmentRef> {
  const durationSeconds = await measureAudioDuration(file);
  const root = await getWritableAttachmentRoot();
  if (!(await verifyAttachmentRootAccess(root))) {
    throw new AttachmentStorageUnavailableError(ATTACHMENT_STORAGE_UNAVAILABLE_MESSAGE);
  }

  const audioDir = await getSubdirectoryHandle(root, ATTACHMENT_DIR_AUDIO);
  const extension = inferAudioExtension(file);
  const baseName = buildAttachmentFileName(VOICE_NOTE_FILE_PREFIX, extension);
  const fileName = await resolveUniqueFileName(audioDir, baseName);
  const fileHandle = await audioDir.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(file);
  await writable.close();

  const path = `${ATTACHMENT_DIR_AUDIO}/${fileName}`;
  const title = len(file.name) > 0 ? file.name.replace(/\.[^.]+$/, "") : VOICE_NOTE_DEFAULT_TITLE;
  return {
    type: "audio",
    path,
    duration: Math.max(0, Math.round(durationSeconds)),
    size: file.size,
    createdAt: new Date().toISOString(),
    title,
  };
}

/**
 * Reads an attachment file as a Blob without creating an object URL.
 * @param relativePath - Path relative to attachment root, e.g. `images/img_x.png`.
 */
export async function readAttachmentBlob(relativePath: string): Promise<Blob> {
  if (len(relativePath) === 0) {
    throw new AttachmentIoError(ATTACHMENT_PATH_EMPTY_MESSAGE);
  }

  const root = await getWritableAttachmentRoot();
  const { dir, fileName } = splitAttachmentPath(relativePath);
  const directory = await getSubdirectoryHandle(root, dir);
  const fileHandle = await directory.getFileHandle(fileName);
  return fileHandle.getFile();
}

/**
 * Returns a cached object URL for lazy attachment rendering/playback.
 * @param relativePath - Path relative to attachment root.
 */
export async function getAttachmentObjectUrl(relativePath: string): Promise<string> {
  const cached = objectUrlCache.get(relativePath);
  if (cached) return cached;

  const blob = await readAttachmentBlob(relativePath);
  const url = URL.createObjectURL(blob);
  objectUrlCache.set(relativePath, url);
  return url;
}

/** Deletes an attachment file from disk. Ignores missing files. */
export async function deleteAttachment(relativePath: string): Promise<void> {
  if (len(relativePath) === 0) return;

  const cachedUrl = objectUrlCache.get(relativePath);
  if (cachedUrl) {
    URL.revokeObjectURL(cachedUrl);
    objectUrlCache.delete(relativePath);
  }

  try {
    const root = await getWritableAttachmentRoot();
    const { dir, fileName } = splitAttachmentPath(relativePath);
    const directory = await getSubdirectoryHandle(root, dir);
    await directory.removeEntry(fileName);
  } catch (err) {
    console.warn("[MyMemos] Failed to delete attachment file:", relativePath, err);
  }
}

/** Infers a file extension from a blob MIME type or filename. */
function inferImageExtension(file: File | Blob, mimeType?: string): string {
  if (file instanceof File && len(file.name) > 0) {
    const dot = file.name.lastIndexOf(".");
    if (dot >= 0) return file.name.slice(dot);
  }

  const mime = mimeType ?? (file instanceof File ? file.type : file.type);
  switch (mime) {
    case "image/jpeg":
      return ".jpg";
    case "image/gif":
      return ".gif";
    case "image/webp":
      return ".webp";
    case "image/svg+xml":
      return ".svg";
    default:
      return ".png";
  }
}

/** Preferred MediaRecorder MIME type for voice notes. */
export function getPreferredVoiceNoteMimeType(): string {
  if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(VOICE_NOTE_MIME_TYPE)) {
    return VOICE_NOTE_MIME_TYPE;
  }
  if (
    typeof MediaRecorder !== "undefined" &&
    MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
  ) {
    return "audio/webm;codecs=opus";
  }
  return VOICE_NOTE_MIME_TYPE;
}

/** Measures audio duration in seconds from a local file. */
export async function measureAudioDuration(file: Blob): Promise<number> {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<number>((resolve, reject) => {
      const audio = new Audio();
      audio.preload = "metadata";
      audio.onloadedmetadata = () => {
        resolve(Number.isFinite(audio.duration) ? audio.duration : 0);
      };
      audio.onerror = () => reject(new Error(AUDIO_DURATION_READ_ERROR));
      audio.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Infers audio file extension from MIME type or filename. */
function inferAudioExtension(file: File): string {
  if (len(file.name) > 0) {
    const dot = file.name.lastIndexOf(".");
    if (dot >= 0) return file.name.slice(dot);
  }

  switch (file.type) {
    case "audio/mpeg":
      return ".mp3";
    case "audio/ogg":
      return ".ogg";
    case "audio/wav":
    case "audio/x-wav":
      return ".wav";
    case "audio/mp4":
    case "audio/aac":
      return ".m4a";
    default:
      return VOICE_NOTE_FILE_EXTENSION;
  }
}
