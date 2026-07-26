import { describe, expect, it } from "vitest";
import { importWorkspace, isValidImportPage } from "@/storage/db";
import type { Page } from "@/storage/types";

const validPage: Page = {
  id: "page-1",
  title: "Notes",
  parent_id: null,
  section: "general",
  kind: "page",
  favorite: false,
  archived: false,
  tags: [],
  created_at: 1,
  updated_at: 2,
  doc: { type: "doc", content: [] },
};

describe("isValidImportPage", () => {
  it("accepts a well-formed page", () => {
    expect(isValidImportPage(validPage)).toBe(true);
  });

  it("rejects missing or malformed pages", () => {
    expect(isValidImportPage(null)).toBe(false);
    expect(isValidImportPage({})).toBe(false);
    expect(isValidImportPage({ ...validPage, id: "" })).toBe(false);
    expect(isValidImportPage({ ...validPage, doc: { type: "paragraph", content: [] } })).toBe(
      false,
    );
    expect(isValidImportPage({ ...validPage, kind: "folder" })).toBe(false);
  });

  it("rejects wrong scalar types and parent_id shapes", () => {
    expect(isValidImportPage({ ...validPage, title: 1 })).toBe(false);
    expect(isValidImportPage({ ...validPage, created_at: "1" })).toBe(false);
    expect(isValidImportPage({ ...validPage, favorite: "yes" })).toBe(false);
    expect(isValidImportPage({ ...validPage, tags: "tag" })).toBe(false);
    expect(isValidImportPage({ ...validPage, parent_id: 12 })).toBe(false);
    expect(isValidImportPage({ ...validPage, doc: { type: "doc" } })).toBe(false);
  });

  it("accepts directories and string parent ids", () => {
    expect(
      isValidImportPage({
        ...validPage,
        kind: "directory",
        parent_id: "folder-1",
        tags: ["a"],
      }),
    ).toBe(true);
  });
});

describe("importWorkspace", () => {
  it("rejects payloads without a pages array", async () => {
    await expect(importWorkspace({})).rejects.toThrow("expected a pages array");
    await expect(importWorkspace({ pages: undefined })).rejects.toThrow("expected a pages array");
  });

  it("rejects malformed page entries before writing", async () => {
    await expect(importWorkspace({ pages: [{ id: "" }] })).rejects.toThrow("malformed page entry");
  });
});
