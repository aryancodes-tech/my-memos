import type { StateCreator } from "zustand";
import { nanoid } from "nanoid";
import * as db from "@/storage/db";
import type { CustomTheme } from "@/storage/types";
import { CUSTOM_THEMES_SETTING, DEFAULT_THEME, SETTINGS_KEYS } from "@/lib/constants";
import { len } from "@/lib/text";
import {
  applyThemeToDocument,
  getCustomThemeStorageId,
  syncCustomThemeStyles,
  toCustomThemeName,
} from "@/lib/themes";
import type { StoreState, ThemeUiSlice } from "@/store/types";

export const createThemeUiSlice: StateCreator<StoreState, [], [], ThemeUiSlice> = (set, get) => ({
  theme: DEFAULT_THEME,
  customThemes: [],
  customThemeDialogOpen: false,

  setTheme(t) {
    const { customThemes } = get();
    set({ theme: t });
    applyThemeToDocument(t, customThemes);
    void db.setSetting(SETTINGS_KEYS.theme, t);
  },

  openCustomThemeDialog() {
    set({ customThemeDialogOpen: true });
  },

  closeCustomThemeDialog() {
    set({ customThemeDialogOpen: false });
  },

  async addCustomTheme(name, colors) {
    const trimmedName = name.trim();
    if (len(trimmedName) === 0) return;

    const theme: CustomTheme = {
      id: nanoid(8),
      name: trimmedName,
      colors,
    };
    const customThemes = [...get().customThemes, theme];
    syncCustomThemeStyles(customThemes);
    set({ customThemes, customThemeDialogOpen: false });
    get().setTheme(toCustomThemeName(theme.id));
    await db.setSetting(CUSTOM_THEMES_SETTING, customThemes);
  },

  async removeCustomTheme(id) {
    const { theme, customThemes } = get();
    const nextThemes = customThemes.filter((item) => item.id !== id);
    syncCustomThemeStyles(nextThemes);
    set({ customThemes: nextThemes });

    if (getCustomThemeStorageId(theme) === id) {
      get().setTheme(DEFAULT_THEME);
    }

    await db.setSetting(CUSTOM_THEMES_SETTING, nextThemes);
  },
});
