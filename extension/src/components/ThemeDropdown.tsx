import { useStore } from "@/store/useStore";
import {
  BUILT_IN_THEME_OPTIONS,
  BUILT_IN_THEME_SWATCHES,
  THEME_MENU_MIN_WIDTH_PX,
} from "@/lib/constants";
import { getThemeLabel, getThemeSwatchColors, toCustomThemeName } from "@/lib/themes";
import type { CustomThemeColors, ThemeName } from "@/storage/types";
import { Check, ChevronDown, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ThemeSwatchProps {
  colors: CustomThemeColors;
}

/** Three-dot preview of a theme palette. */
function ThemeSwatch({ colors }: ThemeSwatchProps) {
  return (
    <span className="ko-theme-swatch" aria-hidden>
      <span className="ko-theme-swatch-dot" style={{ background: colors.bg }} />
      <span className="ko-theme-swatch-dot" style={{ background: colors.text }} />
      <span className="ko-theme-swatch-dot" style={{ background: colors.accent }} />
    </span>
  );
}

interface ThemeOptionRowProps {
  label: string;
  colors: CustomThemeColors;
  active: boolean;
  onSelect: () => void;
  onDelete?: () => void;
}

/** Single selectable theme row in the picker menu. */
function ThemeOptionRow({ label, colors, active, onSelect, onDelete }: ThemeOptionRowProps) {
  return (
    <li role="option" aria-selected={active}>
      <div className={`ko-theme-option ${active ? "is-active" : ""}`}>
        <button type="button" className="ko-theme-option-main" onClick={onSelect}>
          <ThemeSwatch colors={colors} />
          <span className="ko-theme-option-label">{label}</span>
          {active && <Check size={14} strokeWidth={2} className="ko-theme-option-check" />}
        </button>
        {onDelete && (
          <button
            type="button"
            className="ko-theme-option-delete"
            title="Delete theme"
            aria-label={`Delete ${label}`}
            onClick={onDelete}
          >
            <Trash2 size={13} strokeWidth={1.75} />
          </button>
        )}
      </div>
    </li>
  );
}

/** Appearance picker shown in the app header (top-right). */
export default function ThemeDropdown() {
  const { theme, customThemes, setTheme, openCustomThemeDialog, removeCustomTheme } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeLabel = getThemeLabel(theme, customThemes);
  const activeSwatch = getThemeSwatchColors(theme, customThemes);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const selectTheme = (nextTheme: ThemeName) => {
    setTheme(nextTheme);
    setOpen(false);
  };

  return (
    <div className="ko-theme-dropdown" ref={ref}>
      <button
        type="button"
        className="ko-theme-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <ThemeSwatch colors={activeSwatch} />
        <span className="ko-theme-trigger-label">{activeLabel}</span>
        <ChevronDown
          size={14}
          strokeWidth={1.75}
          className={`ko-theme-trigger-chevron ${open ? "is-open" : ""}`}
        />
      </button>

      {open && (
        <div className="ko-theme-panel" style={{ minWidth: THEME_MENU_MIN_WIDTH_PX }}>
          <div className="ko-theme-panel-section">Built-in</div>
          <ul className="ko-theme-menu" role="listbox" aria-label="Built-in themes">
            {BUILT_IN_THEME_OPTIONS.map((option) => (
              <ThemeOptionRow
                key={option.id}
                label={option.label}
                colors={BUILT_IN_THEME_SWATCHES[option.id]}
                active={option.id === theme}
                onSelect={() => selectTheme(option.id)}
              />
            ))}
          </ul>

          {customThemes.length > 0 && (
            <>
              <div className="ko-theme-panel-section">Your themes</div>
              <ul className="ko-theme-menu" role="listbox" aria-label="Custom themes">
                {customThemes.map((customTheme) => {
                  const themeName = toCustomThemeName(customTheme.id);
                  return (
                    <ThemeOptionRow
                      key={customTheme.id}
                      label={customTheme.name}
                      colors={customTheme.colors}
                      active={themeName === theme}
                      onSelect={() => selectTheme(themeName)}
                      onDelete={() => void removeCustomTheme(customTheme.id)}
                    />
                  );
                })}
              </ul>
            </>
          )}

          <div className="ko-theme-panel-footer">
            <button
              type="button"
              className="ko-theme-add-btn"
              onClick={() => {
                setOpen(false);
                openCustomThemeDialog();
              }}
            >
              <Plus size={14} strokeWidth={1.75} />
              <span>Add theme</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
