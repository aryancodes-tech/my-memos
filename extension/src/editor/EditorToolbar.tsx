import type { Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  CheckSquare,
  ChevronDown,
  Code2,
  Highlighter,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  PaintBucket,
  Palette,
  Quote,
  Redo2,
  SquareTerminal,
  Strikethrough,
  Type,
  Underline,
  Undo2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { DEFAULT_CODE_LANGUAGE } from "@/editor/codeLowlight";
import { preventEditorBlur, ToolbarPopover } from "@/editor/ToolbarPopover";
import {
  EDITOR_BACKGROUND_COLORS,
  EDITOR_BACKGROUND_CUSTOM_DEFAULT,
  EDITOR_CUSTOM_COLOR_LABEL,
  EDITOR_HIGHLIGHT_COLORS,
  EDITOR_HIGHLIGHT_CUSTOM_DEFAULT,
  EDITOR_TEXT_COLORS,
  EDITOR_TEXT_CUSTOM_DEFAULT,
} from "@/lib/constants";
import { normalizeHexColor } from "@/lib/themes";
import { useStore } from "@/store/useStore";
import { len } from "@/lib/text";

type BlockKind = "paragraph" | "h1" | "h2" | "h3" | "h4";
type AlignKind = "left" | "center" | "right" | "justify";

const BLOCK_OPTIONS: { id: BlockKind; label: string }[] = [
  { id: "paragraph", label: "Text" },
  { id: "h1", label: "Heading 1" },
  { id: "h2", label: "Heading 2" },
  { id: "h3", label: "Heading 3" },
  { id: "h4", label: "Heading 4" },
];

const ALIGN_OPTIONS: { id: AlignKind; label: string; icon: ReactNode }[] = [
  { id: "left", label: "Align left", icon: <AlignLeft size={14} strokeWidth={1.75} /> },
  { id: "center", label: "Align center", icon: <AlignCenter size={14} strokeWidth={1.75} /> },
  { id: "right", label: "Align right", icon: <AlignRight size={14} strokeWidth={1.75} /> },
  { id: "justify", label: "Justify", icon: <AlignJustify size={14} strokeWidth={1.75} /> },
];

interface EditorToolbarProps {
  editor: Editor;
}

/** Compact formatting toolbar shown in the app header while editing a page. */
export default function EditorToolbar({ editor }: EditorToolbarProps) {
  const [, setRevision] = useState(0);
  const requestLink = useStore((state) => state.requestLink);

  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    editor.on("transaction", refresh);
    editor.on("selectionUpdate", refresh);
    return () => {
      editor.off("transaction", refresh);
      editor.off("selectionUpdate", refresh);
    };
  }, [editor]);

  const activeBlock = getActiveBlock(editor);
  const activeAlign = getActiveAlign(editor);

  const setBlock = useCallback(
    (kind: BlockKind) => {
      const chain = editor.chain().focus();
      if (kind === "paragraph") {
        chain.setParagraph().run();
        return;
      }
      const level = Number(kind.slice(1)) as 1 | 2 | 3 | 4;
      chain.setHeading({ level }).run();
    },
    [editor],
  );

  const openLinkDialog = useCallback(() => {
    const previous = editor.getAttributes("link").href as string | undefined;
    requestLink(previous ?? "");
  }, [editor, requestLink]);

  const textColor = (editor.getAttributes("textStyle").color as string | undefined) ?? "";
  const highlightColor = (editor.getAttributes("highlight").color as string | undefined) ?? "";
  const backgroundColor =
    (editor.getAttributes("textStyle").backgroundColor as string | undefined) ?? "";

  return (
    <div className="ko-editor-toolbar ko-editor-toolbar-header">
      <ToolbarGroup>
        <ToolbarButton
          title="Undo"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 size={14} strokeWidth={1.75} />
        </ToolbarButton>
        <ToolbarButton
          title="Redo"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 size={14} strokeWidth={1.75} />
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarDivider />

      <BlockTypeSelect value={activeBlock} onChange={setBlock} />

      <ToolbarDivider />

      <ToolbarGroup>
        <ToolbarButton
          title="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={14} strokeWidth={1.75} />
        </ToolbarButton>
        <ToolbarButton
          title="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={14} strokeWidth={1.75} />
        </ToolbarButton>
        <ToolbarButton
          title="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <Underline size={14} strokeWidth={1.75} />
        </ToolbarButton>
        <ToolbarButton
          title="Strikethrough"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough size={14} strokeWidth={1.75} />
        </ToolbarButton>
        <ToolbarButton
          title="Inline code"
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code2 size={14} strokeWidth={1.75} />
        </ToolbarButton>
        <ToolbarButton
          title="Code block"
          active={editor.isActive("codeBlock")}
          onClick={() =>
            editor.chain().focus().toggleCodeBlock({ language: DEFAULT_CODE_LANGUAGE }).run()
          }
        >
          <SquareTerminal size={14} strokeWidth={1.75} />
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarDivider />

      <ToolbarGroup>
        <ToolbarButton
          title="Bulleted list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={14} strokeWidth={1.75} />
        </ToolbarButton>
        <ToolbarButton
          title="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={14} strokeWidth={1.75} />
        </ToolbarButton>
        <ToolbarButton
          title="To-do list"
          active={editor.isActive("taskList")}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          <CheckSquare size={14} strokeWidth={1.75} />
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarDivider />

      <AlignSelect
        value={activeAlign}
        onChange={(align) => editor.chain().focus().setTextAlign(align).run()}
      />

      <ToolbarDivider />

      <ToolbarGroup>
        <ColorMenu
          title="Text color"
          icon={<Palette size={14} strokeWidth={1.75} />}
          colors={EDITOR_TEXT_COLORS}
          activeColor={textColor}
          allowCustom
          customDefault={EDITOR_TEXT_CUSTOM_DEFAULT}
          onPick={(color) => {
            if (len(color) === 0) editor.chain().focus().unsetColor().run();
            else editor.chain().focus().setColor(color).run();
          }}
        />
        <ColorMenu
          title="Highlight color"
          icon={<Highlighter size={14} strokeWidth={1.75} />}
          colors={EDITOR_HIGHLIGHT_COLORS}
          activeColor={highlightColor}
          align="right"
          allowCustom
          customDefault={EDITOR_HIGHLIGHT_CUSTOM_DEFAULT}
          onPick={(color) => {
            if (len(color) === 0) editor.chain().focus().unsetHighlight().run();
            else editor.chain().focus().setHighlight({ color }).run();
          }}
        />
        <ColorMenu
          title="Background color"
          icon={<PaintBucket size={14} strokeWidth={1.75} />}
          colors={EDITOR_BACKGROUND_COLORS}
          activeColor={backgroundColor}
          align="right"
          allowCustom
          customDefault={EDITOR_BACKGROUND_CUSTOM_DEFAULT}
          onPick={(color) => {
            if (len(color) === 0) editor.chain().focus().unsetBackgroundColor().run();
            else editor.chain().focus().setBackgroundColor(color).run();
          }}
        />
      </ToolbarGroup>

      <ToolbarDivider />

      <ToolbarGroup>
        <ToolbarButton
          title="Quote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={14} strokeWidth={1.75} />
        </ToolbarButton>
        <ToolbarButton
          title="Divider"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus size={14} strokeWidth={1.75} />
        </ToolbarButton>
        <ToolbarButton title="Link" active={editor.isActive("link")} onClick={openLinkDialog}>
          <Link2 size={14} strokeWidth={1.75} />
        </ToolbarButton>
      </ToolbarGroup>
    </div>
  );
}

function AlignSelect({
  value,
  onChange,
}: {
  value: AlignKind;
  onChange: (align: AlignKind) => void;
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const active = ALIGN_OPTIONS.find((option) => option.id === value) ?? ALIGN_OPTIONS[0];

  return (
    <div className="ko-toolbar-block-select" ref={anchorRef}>
      <button
        type="button"
        className="ko-toolbar-block-trigger"
        title="Text alignment"
        onMouseDown={preventEditorBlur}
        onClick={() => setOpen((current) => !current)}
      >
        {active.icon}
        <ChevronDown size={12} strokeWidth={1.75} />
      </button>
      <ToolbarPopover open={open} onClose={() => setOpen(false)} anchorRef={anchorRef}>
        {ALIGN_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`ko-toolbar-popover-item ko-toolbar-popover-item-icon ${
              option.id === value ? "is-active" : ""
            }`}
            onClick={() => {
              onChange(option.id);
              setOpen(false);
            }}
          >
            {option.icon}
            <span>{option.label}</span>
          </button>
        ))}
      </ToolbarPopover>
    </div>
  );
}

function ColorMenu({
  title,
  icon,
  colors,
  activeColor,
  onPick,
  align = "left",
  allowCustom = false,
  customDefault = "#000000",
}: {
  title: string;
  icon: ReactNode;
  colors: { id: string; label: string; value: string }[];
  activeColor: string;
  onPick: (color: string) => void;
  align?: "left" | "right";
  /** When true, shows a native color picker and hex field below presets. */
  allowCustom?: boolean;
  /** Fallback hex for the custom picker when no custom color is active. */
  customDefault?: string;
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const presetValues = useMemo(
    () => new Set(colors.map((color) => color.value).filter((value) => len(value) > 0)),
    [colors],
  );
  const isCustomActive = len(activeColor) > 0 && !presetValues.has(activeColor);
  const [customColor, setCustomColor] = useState(isCustomActive ? activeColor : customDefault);

  useEffect(() => {
    if (!open) return;
    setCustomColor(isCustomActive ? activeColor : customDefault);
  }, [open, activeColor, customDefault, isCustomActive]);

  const applyCustomColor = useCallback(
    (value: string) => {
      const normalized = normalizeHexColor(value, customDefault);
      setCustomColor(normalized);
      onPick(normalized);
    },
    [customDefault, onPick],
  );
  const customInputId = `${title.toLowerCase().replace(/\s+/g, "-")}-custom`;

  return (
    <div className="ko-toolbar-color-menu" ref={anchorRef}>
      <ToolbarButton
        title={title}
        active={len(activeColor) > 0}
        onClick={() => setOpen((value) => !value)}
      >
        {icon}
      </ToolbarButton>
      <ToolbarPopover
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={anchorRef}
        align={align}
      >
        <div className="ko-toolbar-color-popover-inner">
          <div className="ko-toolbar-color-popover-title">{title}</div>
          <div className="ko-toolbar-color-grid">
            {colors.map((color) => (
              <button
                key={color.id}
                type="button"
                title={color.label}
                className={`ko-toolbar-color-swatch ${
                  color.value === activeColor && !isCustomActive ? "is-active" : ""
                }`}
                style={
                  len(color.value) > 0
                    ? { background: color.value }
                    : { background: "var(--ko-bg)", border: "1px dashed var(--ko-border)" }
                }
                onClick={() => {
                  onPick(color.value);
                  setOpen(false);
                }}
              />
            ))}
          </div>
          {allowCustom && (
            <div className={`ko-toolbar-color-custom ${isCustomActive ? "is-active" : ""}`}>
              <label className="ko-toolbar-color-custom-label" htmlFor={customInputId}>
                {EDITOR_CUSTOM_COLOR_LABEL}
              </label>
              <div className="ko-toolbar-color-custom-row">
                <input
                  id={customInputId}
                  type="color"
                  className="ko-toolbar-color-picker"
                  value={customColor}
                  onChange={(event) => applyCustomColor(event.target.value)}
                />
                <input
                  type="text"
                  className="ko-toolbar-color-hex"
                  value={customColor}
                  spellCheck={false}
                  aria-label={`${title} hex value`}
                  onChange={(event) =>
                    setCustomColor(normalizeHexColor(event.target.value, customColor))
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      applyCustomColor(customColor);
                      setOpen(false);
                    }
                  }}
                  onBlur={() => applyCustomColor(customColor)}
                />
              </div>
            </div>
          )}
        </div>
      </ToolbarPopover>
    </div>
  );
}

function BlockTypeSelect({
  value,
  onChange,
}: {
  value: BlockKind;
  onChange: (kind: BlockKind) => void;
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const label = BLOCK_OPTIONS.find((option) => option.id === value)?.label ?? "Text";

  return (
    <div className="ko-toolbar-block-select" ref={anchorRef}>
      <button
        type="button"
        className="ko-toolbar-block-trigger"
        title="Block type"
        onMouseDown={preventEditorBlur}
        onClick={() => setOpen((current) => !current)}
      >
        <Type size={13} strokeWidth={1.75} />
        <span>{label}</span>
        <ChevronDown size={12} strokeWidth={1.75} />
      </button>
      <ToolbarPopover open={open} onClose={() => setOpen(false)} anchorRef={anchorRef}>
        {BLOCK_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`ko-toolbar-popover-item ${option.id === value ? "is-active" : ""}`}
            onClick={() => {
              onChange(option.id);
              setOpen(false);
            }}
          >
            {option.label}
          </button>
        ))}
      </ToolbarPopover>
    </div>
  );
}

function ToolbarGroup({ children }: { children: ReactNode }) {
  return <div className="ko-toolbar-group">{children}</div>;
}

function ToolbarDivider() {
  return <div className="ko-toolbar-divider" aria-hidden />;
}

function ToolbarButton({
  title,
  active,
  disabled,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`ko-toolbar-btn ${active ? "is-active" : ""}`}
      title={title}
      disabled={disabled}
      onMouseDown={preventEditorBlur}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function getActiveBlock(editor: Editor): BlockKind {
  if (editor.isActive("heading", { level: 1 })) return "h1";
  if (editor.isActive("heading", { level: 2 })) return "h2";
  if (editor.isActive("heading", { level: 3 })) return "h3";
  if (editor.isActive("heading", { level: 4 })) return "h4";
  return "paragraph";
}

function getActiveAlign(editor: Editor): AlignKind {
  if (editor.isActive({ textAlign: "center" })) return "center";
  if (editor.isActive({ textAlign: "right" })) return "right";
  if (editor.isActive({ textAlign: "justify" })) return "justify";
  return "left";
}
