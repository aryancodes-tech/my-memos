/**
 * Minimal OPFS / File System Access typings for attachment storage.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/File_System_API
 */

interface FileSystemDirectoryHandle {
  getDirectoryHandle(
    name: string,
    options?: { create?: boolean },
  ): Promise<FileSystemDirectoryHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
  removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>;
}

interface FileSystemFileHandle {
  getFile(): Promise<File>;
  createWritable(): Promise<FileSystemWritableFileStream>;
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: Blob | BufferSource | string): Promise<void>;
  close(): Promise<void>;
}

interface StorageManager {
  /** Origin Private File System root (hidden per-origin storage). */
  getDirectory(): Promise<FileSystemDirectoryHandle>;
}
