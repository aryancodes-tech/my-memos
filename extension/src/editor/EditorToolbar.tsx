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
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Mic,
  Minus,
  Paperclip,
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
import { preventEditorBlur, ToolbarPopover, ToolbarTip } from "@/editor/ToolbarPopover";
import {
  ATTACHMENT_FS_UNSUPPORTED_MESSAGE,
  EDITOR_ALIGN_CENTER_LABEL,
  EDITOR_ALIGN_JUSTIFY_LABEL,
  EDITOR_ALIGN_LEFT_LABEL,
  EDITOR_ALIGN_RIGHT_LABEL,
  EDITOR_BACKGROUND_COLORS,
  EDITOR_BACKGROUND_CUSTOM_DEFAULT,
  EDITOR_CUSTOM_COLOR_LABEL,
  EDITOR_HIGHLIGHT_COLORS,
  EDITOR_HIGHLIGHT_CUSTOM_DEFAULT,
  EDITOR_TEXT_COLORS,
  EDITOR_TEXT_CUSTOM_DEFAULT,
  EDITOR_TOOLBAR_ATTACH_AUDIO_LABEL,
  EDITOR_TOOLBAR_AUDIO_ARIA,
  EDITOR_TOOLBAR_AUDIO_TIP,
  EDITOR_TOOLBAR_BLOCK_TYPE_ARIA,
  EDITOR_TOOLBAR_CODE_BLOCK_LABEL,
  EDITOR_TOOLBAR_IMAGE_ALIGN_ARIA,
  EDITOR_TOOLBAR_LINK_LABEL,
  EDITOR_TOOLBAR_RECORD_VOICE_LABEL,
  EDITOR_TOOLBAR_STRIKETHROUGH_LABEL,
  EDITOR_TOOLBAR_TEXT_ALIGN_ARIA,
  PRODUCT_TOUR_TARGETS,
} from "@/lib/constants";
import { normalizeHexColor } from "@/lib/themes";
import { insertImageFromPicker } from "@/editor/commands/insertImage";
import { insertAudioFromPicker } from "@/editor/commands/insertAudioFromFile";
import { insertInlineVoiceRecording } from "@/editor/commands/insertVoiceRecording";
import { useStore } from "@/store/useStore";
import { len } from "@/lib/text";

type BlockKind = "paragraph" | "h1" | "h2" | "h3" | "h4";
type AlignKind = "left" | "center" | "right" | "justify";

/** Tracks hover rect for instant portal tooltips. */
function useInstantTip() {
  const [tip, setTip] = useState<{ label: string; rect: DOMRect } | null>(null);

  const showTip = useCallback((label: string, el: HTMLElement) => {
    setTip({ label, rect: el.getBoundingClientRect() });
  }, []);

  const hideTip = useCallback(() => setTip(null), []);

  return { tip, showTip, hideTip };
}

const BLOCK_OPTIONS: { id: BlockKind; label: string }[] = [
  { id: "paragraph", label: "Text" },
  { id: "h1", label: "Heading 1" },
  { id: "h2", label: "Heading 2" },
  { id: "h3", label: "Heading 3" },
  { id: "h4", label: "Heading 4" },
];

const ALIGN_OPTIONS: { id: AlignKind; label: string; icon: ReactNode }[] = [
  { id: "left", label: EDITOR_ALIGN_LEFT_LABEL, icon: <AlignLeft size={14} strokeWidth={1.75} /> },
  {
    id: "center",
    label: EDITOR_ALIGN_CENTER_LABEL,
    icon: <AlignCenter size={14} strokeWidth={1.75} />,
  },
  {
    id: "right",
    label: EDITOR_ALIGN_RIGHT_LABEL,
    icon: <AlignRight size={14} strokeWidth={1.75} />,
  },
  {
    id: "justify",
    label: EDITOR_ALIGN_JUSTIFY_LABEL,
    icon: <AlignJustify size={14} strokeWidth={1.75} />,
  },
];

interface EditorToolbarProps {
  editor: Editor;
}

/** Compact formatting toolbar shown in the app header while editing a page. */
export default function EditorToolbar({ editor }: EditorToolbarProps) {
  const [, setRevision] = useState(0);
  const [attachError, setAttachError] = useState<string | null>(null);
  const requestLink = useStore((state) => state.requestLink);

  const reportAttachError = useCallback((message?: string) => {
    setAttachError(message || ATTACHMENT_FS_UNSUPPORTED_MESSAGE);
  }, []);

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

  const openImagePicker = useCallback(() => {
    setAttachError(null);
    insertImageFromPicker(editor, undefined, { onError: reportAttachError });
  }, [editor, reportAttachError]);

  const startVoiceRecording = useCallback(() => {
    setAttachError(null);
    insertInlineVoiceRecording(editor, undefined, { onError: reportAttachError });
  }, [editor, reportAttachError]);

  const attachAudioFile = useCallback(() => {
    setAttachError(null);
    insertAudioFromPicker(editor, undefined, { onError: reportAttachError });
  }, [editor, reportAttachError]);

  const textColor = (editor.getAttributes("textStyle").color as string | undefined) ?? "";
  const highlightColor = (editor.getAttributes("highlight").color as string | undefined) ?? "";
  const backgroundColor =
    (editor.getAttributes("textStyle").backgroundColor as string | undefined) ?? "";

  return (
    <div className="ko-editor-toolbar-wrap">
      {attachError && (
        <p className="ko-editor-toolbar-error" role="alert">
          {attachError}
        </p>
      )}
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
            title={EDITOR_TOOLBAR_STRIKETHROUGH_LABEL}
            active={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough size={14} strokeWidth={1.75} />
          </ToolbarButton>
          <ToolbarButton
            title="Code"
            active={editor.isActive("code")}
            onClick={() => editor.chain().focus().toggleCode().run()}
          >
            <Code2 size={14} strokeWidth={1.75} />
          </ToolbarButton>
          <ToolbarButton
            title={EDITOR_TOOLBAR_CODE_BLOCK_LABEL}
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
            title="Bullets"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List size={14} strokeWidth={1.75} />
          </ToolbarButton>
          <ToolbarButton
            title="Numbers"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered size={14} strokeWidth={1.75} />
          </ToolbarButton>
          <ToolbarButton
            title="To-do"
            active={editor.isActive("taskList")}
            onClick={() => editor.chain().focus().toggleTaskList().run()}
          >
            <CheckSquare size={14} strokeWidth={1.75} />
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarDivider />

        <AlignSelect
          value={activeAlign}
          imageSelected={editor.isActive("image")}
          onChange={(align) => {
            if (editor.isActive("image")) {
              const imageAlign = align === "justify" ? "center" : align;
              editor.chain().focus().updateAttributes("image", { align: imageAlign }).run();
              return;
            }
            editor.chain().focus().setTextAlign(align).run();
          }}
        />

        <ToolbarDivider />

        <ToolbarGroup>
          <ColorMenu
            title="Color"
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
            title="Highlight"
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
            title="Fill"
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
          <ToolbarButton
            title={EDITOR_TOOLBAR_LINK_LABEL}
            active={editor.isActive("link")}
            onClick={openLinkDialog}
          >
            <Link2 size={14} strokeWidth={1.75} />
          </ToolbarButton>
          <ToolbarButton
            title="Image"
            tourTarget={PRODUCT_TOUR_TARGETS.addImage}
            onClick={openImagePicker}
          >
            <ImageIcon size={14} strokeWidth={1.75} />
          </ToolbarButton>
          <AudioSelect
            onRecord={startVoiceRecording}
            onAttachFile={attachAudioFile}
          />
        </ToolbarGroup>
      </div>
    </div>
  );
}

function AudioSelect({
  onRecord,
  onAttachFile,
}: {
  onRecord: () => void;
  onAttachFile: () => void;
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const { tip, showTip, hideTip } = useInstantTip();

  return (
    <div
      className="ko-toolbar-block-select"
      ref={anchorRef}
      data-tour-target={PRODUCT_TOUR_TARGETS.addVoice}
    >
      <button
        type="button"
        className="ko-toolbar-btn ko-toolbar-btn-menu"
        aria-label={EDITOR_TOOLBAR_AUDIO_ARIA}
        aria-expanded={open}
        onMouseDown={preventEditorBlur}
        onMouseEnter={(event) => {
          if (!open) showTip(EDITOR_TOOLBAR_AUDIO_TIP, event.currentTarget);
        }}
        onMouseLeave={hideTip}
        onFocus={(event) => {
          if (!open) showTip(EDITOR_TOOLBAR_AUDIO_TIP, event.currentTarget);
        }}
        onBlur={hideTip}
        onClick={() => {
          hideTip();
          setOpen((current) => !current);
        }}
      >
        <Mic size={14} strokeWidth={1.75} />
        <ChevronDown size={12} strokeWidth={1.75} />
      </button>
      <ToolbarTip
        label={tip?.label ?? ""}
        visible={tip !== null && !open}
        anchorRect={tip?.rect ?? null}
      />
      <ToolbarPopover open={open} onClose={() => setOpen(false)} anchorRef={anchorRef}>
        <button
          type="button"
          className="ko-toolbar-popover-item ko-toolbar-popover-item-icon"
          onClick={() => {
            onRecord();
            setOpen(false);
          }}
        >
          <Mic size={14} strokeWidth={1.75} />
          <span>{EDITOR_TOOLBAR_RECORD_VOICE_LABEL}</span>
        </button>
        <button
          type="button"
          className="ko-toolbar-popover-item ko-toolbar-popover-item-icon"
          onClick={() => {
            onAttachFile();
            setOpen(false);
          }}
        >
          <Paperclip size={14} strokeWidth={1.75} />
          <span>{EDITOR_TOOLBAR_ATTACH_AUDIO_LABEL}</span>
        </button>
      </ToolbarPopover>
    </div>
  );
}

function AlignSelect({
  value,
  onChange,
  imageSelected = false,
}: {
  value: AlignKind;
  onChange: (align: AlignKind) => void;
  /** When an image block is selected, justify is hidden (images use left/center/right). */
  imageSelected?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const { tip, showTip, hideTip } = useInstantTip();
  const options = imageSelected
    ? ALIGN_OPTIONS.filter((option) => option.id !== "justify")
    : ALIGN_OPTIONS;
  const active = options.find((option) => option.id === value) ?? options[0];

  return (
    <div className="ko-toolbar-block-select" ref={anchorRef}>
      <button
        type="button"
        className="ko-toolbar-block-trigger"
        aria-label={
          imageSelected ? EDITOR_TOOLBAR_IMAGE_ALIGN_ARIA : EDITOR_TOOLBAR_TEXT_ALIGN_ARIA
        }
        onMouseDown={preventEditorBlur}
        onMouseEnter={(event) => {
          if (!open) showTip("Align", event.currentTarget);
        }}
        onMouseLeave={hideTip}
        onFocus={(event) => {
          if (!open) showTip("Align", event.currentTarget);
        }}
        onBlur={hideTip}
        onClick={() => {
          hideTip();
          setOpen((current) => !current);
        }}
      >
        {active.icon}
        <ChevronDown size={12} strokeWidth={1.75} />
      </button>
      <ToolbarTip
        label={tip?.label ?? ""}
        visible={tip !== null && !open}
        anchorRect={tip?.rect ?? null}
      />
      <ToolbarPopover open={open} onClose={() => setOpen(false)} anchorRef={anchorRef}>
        {options.map((option) => (
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
  const { tip, showTip, hideTip } = useInstantTip();
  const label = BLOCK_OPTIONS.find((option) => option.id === value)?.label ?? "Text";

  return (
    <div className="ko-toolbar-block-select" ref={anchorRef}>
      <button
        type="button"
        className="ko-toolbar-block-trigger"
        aria-label={EDITOR_TOOLBAR_BLOCK_TYPE_ARIA}
        onMouseDown={preventEditorBlur}
        onMouseEnter={(event) => {
          if (!open) showTip("Style", event.currentTarget);
        }}
        onMouseLeave={hideTip}
        onFocus={(event) => {
          if (!open) showTip("Style", event.currentTarget);
        }}
        onBlur={hideTip}
        onClick={() => {
          hideTip();
          setOpen((current) => !current);
        }}
      >
        <Type size={13} strokeWidth={1.75} />
        <span>{label}</span>
        <ChevronDown size={12} strokeWidth={1.75} />
      </button>
      <ToolbarTip
        label={tip?.label ?? ""}
        visible={tip !== null && !open}
        anchorRect={tip?.rect ?? null}
      />
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
  tourTarget,
  children,
}: {
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  /** Optional product-tour spotlight anchor. */
  tourTarget?: string;
  children: ReactNode;
}) {
  const { tip, showTip, hideTip } = useInstantTip();

  return (
    <>
      <button
        type="button"
        className={`ko-toolbar-btn ${active ? "is-active" : ""}`}
        aria-label={title}
        disabled={disabled}
        data-tour-target={tourTarget}
        onMouseDown={preventEditorBlur}
        onMouseEnter={(event) => {
          if (!disabled) showTip(title, event.currentTarget);
        }}
        onMouseLeave={hideTip}
        onFocus={(event) => {
          if (!disabled) showTip(title, event.currentTarget);
        }}
        onBlur={hideTip}
        onClick={() => {
          hideTip();
          onClick();
        }}
      >
        {children}
      </button>
      <ToolbarTip label={tip?.label ?? ""} visible={tip !== null} anchorRect={tip?.rect ?? null} />
    </>
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
  if (editor.isActive("image")) {
    const align = editor.getAttributes("image").align as string | undefined;
    if (align === "center" || align === "right" || align === "left") return align;
    return "center";
  }
  if (editor.isActive({ textAlign: "center" })) return "center";
  if (editor.isActive({ textAlign: "right" })) return "right";
  if (editor.isActive({ textAlign: "justify" })) return "justify";
  return "left";
}
