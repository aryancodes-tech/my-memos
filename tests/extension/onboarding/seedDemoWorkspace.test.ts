import { describe, expect, it, vi } from "vitest";

import {
  DEMO_SEED_IMAGE_ALT,
  DEMO_SEED_IMAGE_CAPTION,
  DEMO_SEED_IMAGE_FILE_NAME,
  DEMO_SEED_IMAGE_PUBLIC_PATH,
  DEMO_SEED_VOICE_PUBLIC_PATH,
  DEMO_SEED_VOICE_TITLE,
} from "@/lib/constants";
import {
  buildDemoSeedBlockDoc,
  demoSeedAssetFetchUrls,
  demoSeedVoiceFetchUrls,
  fetchDemoSeedAssetFile,
  fetchDemoSeedVoiceFile,
} from "@/onboarding/seedDemoWorkspace";

describe("demoSeedAssetFetchUrls", () => {
  it("includes the landing root path and the demo base path", () => {
    expect(
      demoSeedAssetFetchUrls(DEMO_SEED_IMAGE_FILE_NAME, DEMO_SEED_IMAGE_PUBLIC_PATH, "/demo/"),
    ).toEqual([DEMO_SEED_IMAGE_PUBLIC_PATH, `/demo/${DEMO_SEED_IMAGE_FILE_NAME}`]);
  });

  it("dedupes when base is root", () => {
    expect(demoSeedVoiceFetchUrls("/")).toEqual([DEMO_SEED_VOICE_PUBLIC_PATH]);
  });
});

describe("fetchDemoSeedAssetFile", () => {
  it("returns a File from the first successful candidate URL", async () => {
    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" });
    const fetchImpl = vi.fn(async (url: string) => {
      if (url === DEMO_SEED_IMAGE_PUBLIC_PATH) {
        return {
          ok: true,
          blob: async () => blob,
        } as Response;
      }
      return { ok: false, blob: async () => new Blob() } as Response;
    });

    const file = await fetchDemoSeedAssetFile(
      DEMO_SEED_IMAGE_FILE_NAME,
      DEMO_SEED_IMAGE_PUBLIC_PATH,
      "image/png",
      fetchImpl,
      "/demo/",
    );
    expect(file).not.toBeNull();
    expect(file?.name).toBe(DEMO_SEED_IMAGE_FILE_NAME);
    expect(file?.type).toBe("image/png");
    expect(file?.size).toBe(3);
  });

  it("returns null when all candidates fail", async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, blob: async () => new Blob() }) as Response);
    expect(await fetchDemoSeedVoiceFile(fetchImpl, "/demo/")).toBeNull();
  });
});

describe("buildDemoSeedBlockDoc", () => {
  it("omits media blocks when no attachments are provided", () => {
    const doc = buildDemoSeedBlockDoc();
    const types = doc.content.map((node) => node.type);
    expect(types).not.toContain("voiceNote");
    expect(types).not.toContain("image");
  });

  it("includes image and voiceNote when media attrs are provided", () => {
    const doc = buildDemoSeedBlockDoc({
      image: {
        attachmentPath: "images/img_demo.png",
        attachmentSize: 93277,
        alt: DEMO_SEED_IMAGE_ALT,
        caption: DEMO_SEED_IMAGE_CAPTION,
      },
      voice: {
        attachmentPath: "audio/voice_demo.mp3",
        duration: 12,
        size: 99931,
        title: DEMO_SEED_VOICE_TITLE,
        createdAt: "2026-07-28T00:00:00.000Z",
      },
    });

    const image = doc.content.find((node) => node.type === "image");
    expect(image?.attrs).toMatchObject({
      attachmentPath: "images/img_demo.png",
      alt: DEMO_SEED_IMAGE_ALT,
      caption: DEMO_SEED_IMAGE_CAPTION,
    });

    const voice = doc.content.find((node) => node.type === "voiceNote");
    expect(voice?.attrs).toMatchObject({
      status: "saved",
      attachmentPath: "audio/voice_demo.mp3",
      duration: 12,
      title: DEMO_SEED_VOICE_TITLE,
    });
  });
});
