import { beforeEach, describe, expect, it, vi } from "vitest";
import { CUSTOM_THEMES_SETTING, DEFAULT_THEME, SETTINGS_KEYS } from "@/lib/constants";
import * as db from "@/storage/db";
import { useStore } from "@/store/useStore";

vi.mock("@/storage/db", () => ({
  putPage: vi.fn(async () => undefined),
  setSetting: vi.fn(async () => undefined),
  getSetting: vi.fn(async () => undefined),
  listPages: vi.fn(async () => []),
  deletePage: vi.fn(async () => undefined),
}));

describe("theme UI slice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useStore.setState({
      theme: DEFAULT_THEME,
      customThemes: [],
      customThemeDialogOpen: false,
    });
    document.documentElement.removeAttribute("data-theme");
    document.getElementById("ko-custom-theme-styles")?.remove();
  });

  it("setTheme persists and applies data-theme", () => {
    useStore.getState().setTheme("ocean");
    expect(useStore.getState().theme).toBe("ocean");
    expect(document.documentElement.dataset.theme).toBe("ocean");
    expect(db.setSetting).toHaveBeenCalledWith(SETTINGS_KEYS.theme, "ocean");
  });

  it("ignores blank custom theme names", async () => {
    await useStore.getState().addCustomTheme("   ", {
      bg: "#111111",
      text: "#eeeeee",
      accent: "#888888",
    });
    expect(useStore.getState().customThemes).toHaveLength(0);
    expect(db.setSetting).not.toHaveBeenCalledWith(CUSTOM_THEMES_SETTING, expect.anything());
  });

  it("adds a custom theme, closes the dialog, and activates it", async () => {
    useStore.getState().openCustomThemeDialog();
    expect(useStore.getState().customThemeDialogOpen).toBe(true);

    await useStore.getState().addCustomTheme(" Focus ", {
      bg: "#111111",
      text: "#eeeeee",
      accent: "#888888",
    });

    const themes = useStore.getState().customThemes;
    expect(themes).toHaveLength(1);
    expect(themes[0]?.name).toBe("Focus");
    expect(useStore.getState().customThemeDialogOpen).toBe(false);
    expect(useStore.getState().theme).toBe(`custom-${themes[0]!.id}`);
    expect(db.setSetting).toHaveBeenCalledWith(CUSTOM_THEMES_SETTING, themes);
  });

  it("falls back to the default theme when removing the active custom theme", async () => {
    await useStore.getState().addCustomTheme("Temp", {
      bg: "#000000",
      text: "#ffffff",
      accent: "#cccccc",
    });
    const id = useStore.getState().customThemes[0]!.id;
    expect(useStore.getState().theme).toBe(`custom-${id}`);

    await useStore.getState().removeCustomTheme(id);
    expect(useStore.getState().customThemes).toEqual([]);
    expect(useStore.getState().theme).toBe(DEFAULT_THEME);
  });

  it("closeCustomThemeDialog only closes the dialog", () => {
    useStore.setState({ customThemeDialogOpen: true });
    useStore.getState().closeCustomThemeDialog();
    expect(useStore.getState().customThemeDialogOpen).toBe(false);
  });
});
