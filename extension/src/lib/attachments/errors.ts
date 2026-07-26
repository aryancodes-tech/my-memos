/** Thrown when the File System Access API is unavailable in the current browser. */
export class AttachmentFsUnsupportedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AttachmentFsUnsupportedError";
  }
}

/** Thrown when the persisted attachment folder handle cannot be used. */
export class AttachmentStorageUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AttachmentStorageUnavailableError";
  }
}

/** Thrown when saving or reading an attachment file fails. */
export class AttachmentIoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AttachmentIoError";
  }
}
