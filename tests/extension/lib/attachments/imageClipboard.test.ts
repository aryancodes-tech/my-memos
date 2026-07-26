import { describe, expect, it } from "vitest";
import {
  extractImageSrcsFromHtml,
  collectImageFilesFromDataTransfer,
} from "@/lib/attachments/imageClipboard";
import { filterImageFiles, isImageFile } from "@/lib/attachments/imageFiles";

describe("isImageFile / filterImageFiles", () => {
  it("accepts image MIME types", () => {
    const file = new File([new Uint8Array([1, 2, 3])], "shot.png", { type: "image/png" });
    expect(isImageFile(file)).toBe(true);
  });

  it("accepts image extensions when MIME is empty", () => {
    const file = new File([new Uint8Array([1])], "photo.JPEG", { type: "" });
    expect(isImageFile(file)).toBe(true);
  });

  it("rejects non-images", () => {
    const file = new File([new Uint8Array([1])], "notes.txt", { type: "text/plain" });
    expect(isImageFile(file)).toBe(false);
  });

  it("filters mixed file lists", () => {
    const files = [
      new File([new Uint8Array([1])], "a.png", { type: "image/png" }),
      new File([new Uint8Array([1])], "b.txt", { type: "text/plain" }),
      new File([new Uint8Array([1])], "c.webp", { type: "image/webp" }),
    ];
    expect(filterImageFiles(files).map((f) => f.name)).toEqual(["a.png", "c.webp"]);
  });
});

describe("extractImageSrcsFromHtml", () => {
  it("extracts unique img srcs and skips tiny tracking pixels", () => {
    const html = `
      <div>
        <img src="https://cdn.example/a.png" />
        <img src="https://cdn.example/a.png" />
        <img src="https://cdn.example/pixel.gif" width="1" height="1" />
        <img src="data:image/png;base64,abc" alt="inline" />
      </div>
    `;
    expect(extractImageSrcsFromHtml(html)).toEqual([
      "https://cdn.example/a.png",
      "data:image/png;base64,abc",
    ]);
  });

  it("returns empty for HTML without images", () => {
    expect(extractImageSrcsFromHtml("<p>Hello</p>")).toEqual([]);
  });
});

describe("collectImageFilesFromDataTransfer", () => {
  it("returns empty when data is null", () => {
    expect(collectImageFilesFromDataTransfer(null)).toEqual([]);
  });
});
