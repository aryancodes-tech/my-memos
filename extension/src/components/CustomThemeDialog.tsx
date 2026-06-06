import { useStore } from "@/store/useStore";
import {
  CUSTOM_THEME_DEFAULT_COLORS
} from "@/lib/constants";
import { deriveThemeTokens, normalizeHexColor } from "@/lib/themes";
import { len } from "@/lib/text";
import type { CustomThemeColors } from "@/storage/types";
import { Palette, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

interface ColorFieldProps {
  id: string;
  label: string;
  value: string;
  fallback: string;
  onChange: (value: string) => void;
}

/** Single color picker row with native input and hex field. */
function ColorField({ id, label, value, fallback, onChange }: ColorFieldProps) {
  return (
    <div className="ko-theme-color-field">
      <label htmlFor={id} className="ko-dialog-label">
        {label}
      </label>
      <div className="ko-theme-color-input-row">
        <input
          id={id}
          type="color"
          className="ko-theme-color-picker"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <input
          type="text"
          className="ko-dialog-input ko-theme-color-text"
          value={value}
          spellCheck={false}
          onChange={(event) => onChange(normalizeHexColor(event.target.value, value))}
        />
      </div>
    </div>
  );
}

/** Modal for creating a user-defined theme with name and primary colors. */
export default function CustomThemeDialog() {
  const { customThemeDialogOpen, closeCustomThemeDialog, addCustomTheme } = useStore();
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [colors, setColors] = useState<CustomThemeColors>(CUSTOM_THEME_DEFAULT_COLORS);

  const previewTokens = useMemo(() => deriveThemeTokens(colors), [colors]);
  const canSave = len(name.trim()) > 0;

  useEffect(() => {
    if (!customThemeDialogOpen) return;
    setName("");
    setColors(CUSTOM_THEME_DEFAULT_COLORS);
    const frame = requestAnimationFrame(() => nameRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCustomThemeDialog();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [customThemeDialogOpen, closeCustomThemeDialog]);

  if (!customThemeDialogOpen) return null;

  const updateColor = (key: keyof CustomThemeColors, value: string) => {
    setColors((current) => ({
      ...current,
      [key]: normalizeHexColor(value, current[key])
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSave) return;
    void addCustomTheme(name, colors);
  };

  return (
    <div
      className="ko-dialog-overlay"
      role="presentation"
      onClick={closeCustomThemeDialog}
    >
      <div
        className="ko-dialog ko-theme-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ko-theme-dialog-title"
        aria-describedby="ko-theme-dialog-desc"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="ko-dialog-close"
          aria-label="Close"
          onClick={closeCustomThemeDialog}
        >
          <X size={16} strokeWidth={1.75} />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <Palette size={16} strokeWidth={1.75} className="text-[var(--ko-text-muted)]" />
          <h2 id="ko-theme-dialog-title" className="ko-dialog-title">
            Add custom theme
          </h2>
        </div>

        <p id="ko-theme-dialog-desc" className="ko-dialog-body">
          Name your theme and pick the core colors. Surface and border tones are generated automatically.
        </p>

        <div
          className="ko-theme-preview-card"
          style={{
            background: previewTokens["--ko-bg"],
            borderColor: previewTokens["--ko-border"],
            color: previewTokens["--ko-text"]
          }}
        >
          <div
            className="ko-theme-preview-chip"
            style={{ background: previewTokens["--ko-surface-2"] }}
          >
            Preview
          </div>
          <div className="ko-theme-preview-title">{name.trim() || "My theme"}</div>
          <div
            className="ko-theme-preview-link"
            style={{ color: previewTokens["--ko-accent"] }}
          >
            Accent link
          </div>
          <div
            className="ko-theme-preview-muted"
            style={{ color: previewTokens["--ko-text-muted"] }}
          >
            Secondary text
          </div>
        </div>

        <form className="ko-dialog-form" onSubmit={handleSubmit}>
          <label htmlFor="ko-theme-name" className="ko-dialog-label">
            Theme name
          </label>
          <input
            ref={nameRef}
            id="ko-theme-name"
            type="text"
            className="ko-dialog-input"
            value={name}
            placeholder="Midnight Garden"
            autoComplete="off"
            onChange={(event) => setName(event.target.value)}
          />

          <div className="ko-theme-color-grid">
            <ColorField
              id="ko-theme-bg"
              label="Background"
              value={colors.bg}
              fallback={CUSTOM_THEME_DEFAULT_COLORS.bg}
              onChange={(value) => updateColor("bg", value)}
            />
            <ColorField
              id="ko-theme-text"
              label="Text"
              value={colors.text}
              fallback={CUSTOM_THEME_DEFAULT_COLORS.text}
              onChange={(value) => updateColor("text", value)}
            />
            <ColorField
              id="ko-theme-accent"
              label="Accent"
              value={colors.accent}
              fallback={CUSTOM_THEME_DEFAULT_COLORS.accent}
              onChange={(value) => updateColor("accent", value)}
            />
          </div>

          <div className="ko-dialog-actions">
            <button
              type="button"
              className="ko-dialog-btn-delete"
              onClick={closeCustomThemeDialog}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ko-dialog-btn-keep"
              disabled={!canSave}
            >
              Create theme
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
