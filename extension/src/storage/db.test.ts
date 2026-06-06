import { describe, expect, it } from "vitest";
import { isValidImportPage } from "./db";
import type { Page } from "./types";

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
});
