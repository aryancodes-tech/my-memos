import { len } from "@/lib/text";

/** True when a File/Blob looks like an image (MIME or common extension). */
export function isImageFile(file: File | Blob): boolean {
  if (len(file.type) > 0 && file.type.startsWith("image/")) return true;
  if (file instanceof File && len(file.name) > 0) {
    return /\.(png|jpe?g|gif|webp|svg|bmp|heic|heif|avif)$/i.test(file.name);
  }
  return false;
}

/** Filters a file list down to image files. */
export function filterImageFiles(files: ArrayLike<File>): File[] {
  return Array.from(files).filter(isImageFile);
}
