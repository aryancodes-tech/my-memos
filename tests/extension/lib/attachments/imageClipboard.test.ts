import { afterEach, describe, expect, it, vi } from "vitest";
import {
  extractImageSrcsFromHtml,
  collectImageFilesFromDataTransfer,
  fetchImageSrcAsFile,
  resolveImagesFromDataTransfer,
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

  it("prefers FileList images over items", () => {
    const png = new File([new Uint8Array([1])], "a.png", { type: "image/png" });
    const data = {
      files: [png],
      items: [],
    } as unknown as DataTransfer;
    expect(collectImageFilesFromDataTransfer(data)).toEqual([png]);
  });

  it("falls back to DataTransferItemList files", () => {
    const png = new File([new Uint8Array([1])], "from-item.png", { type: "image/png" });
    const data = {
      files: [],
      items: [
        { kind: "string", getAsFile: () => null },
        { kind: "file", getAsFile: () => png },
        {
          kind: "file",
          getAsFile: () => new File([new Uint8Array([1])], "notes.txt", { type: "text/plain" }),
        },
      ],
    } as unknown as DataTransfer;
    expect(collectImageFilesFromDataTransfer(data).map((f) => f.name)).toEqual(["from-item.png"]);
  });
});

describe("extractImageSrcsFromHtml edge cases", () => {
  it("returns empty for blank HTML and skips empty srcs", () => {
    expect(extractImageSrcsFromHtml("")).toEqual([]);
    expect(extractImageSrcsFromHtml('<img src="   " /><img src="https://x/a.png" />')).toEqual([
      "https://x/a.png",
    ]);
  });
});

describe("fetchImageSrcAsFile", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns null for empty src", async () => {
    await expect(fetchImageSrcAsFile("")).resolves.toBeNull();
  });

  it("decodes data: URLs into image Files", async () => {
    const png1x1 =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const file = await fetchImageSrcAsFile(png1x1);
    expect(file).not.toBeNull();
    expect(file?.type).toBe("image/png");
    expect(file?.name).toMatch(/\.png$/);
    expect(file!.size).toBeGreaterThan(0);
  });

  it("returns null for malformed data URLs", async () => {
    await expect(fetchImageSrcAsFile("data:not-valid")).resolves.toBeNull();
  });

  it("fetches http(s) images and names them from the URL path", async () => {
    const bytes = new Uint8Array([137, 80, 78, 71]);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => new Blob([bytes], { type: "image/png" }),
      }),
    );

    const file = await fetchImageSrcAsFile("https://cdn.example/path/shot.png?x=1");
    expect(file?.name).toBe("shot.png");
    expect(file?.type).toBe("image/png");
  });

  it("returns null on non-OK responses and network errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    await expect(fetchImageSrcAsFile("https://cdn.example/a.png")).resolves.toBeNull();

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    await expect(fetchImageSrcAsFile("https://cdn.example/a.png")).resolves.toBeNull();
  });

  it("rejects non-image responses without an image-like URL", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => new Blob([new Uint8Array([1])], { type: "application/octet-stream" }),
      }),
    );
    await expect(fetchImageSrcAsFile("https://cdn.example/api/payload")).resolves.toBeNull();
  });
});

describe("resolveImagesFromDataTransfer", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns empty for null transfer", async () => {
    await expect(resolveImagesFromDataTransfer(null)).resolves.toEqual([]);
  });

  it("prefers binary files over HTML img srcs", async () => {
    const png = new File([new Uint8Array([1])], "drop.png", { type: "image/png" });
    const data = {
      files: [png],
      items: [],
      getData: () => '<img src="https://cdn.example/ignored.png" />',
    } as unknown as DataTransfer;

    await expect(resolveImagesFromDataTransfer(data)).resolves.toEqual([png]);
  });

  it("resolves HTML img srcs when no files are present", async () => {
    const png1x1 =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const data = {
      files: [],
      items: [],
      getData: (type: string) => (type === "text/html" ? `<img src="${png1x1}" />` : ""),
    } as unknown as DataTransfer;

    const files = await resolveImagesFromDataTransfer(data);
    expect(files).toHaveLength(1);
    expect(files[0]?.type).toBe("image/png");
  });
});
