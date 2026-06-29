import type { Editor } from "@tiptap/react";
import type { LucideIcon } from "lucide-react";
import {
  CheckSquare,
  Code2,
  FileAudio,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Mic,
  Minus,
  Quote,
  Type,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { SLASH_MENU_PLACEHOLDER, SLASH_MENU_SECTION } from "@/lib/constants";
import { len } from "@/lib/text";
import { DEFAULT_CODE_LANGUAGE } from "@/editor/codeLowlight";
import {
  applyCodeBlock,
  applyListBlock,
  applyTaskListBlock,
  type SlashRange,
} from "@/editor/slashBlock";
import { insertAudioFromPicker } from "@/lib/attachments/insertAudioFromFile";
import { insertInlineVoiceRecording } from "@/lib/attachments/insertVoiceRecording";

interface SlashCommand {
  id: string;
  title: string;
  description: string;
  shortcut: string;
  keywords: string[];
  icon: LucideIcon;
  previewTitle: string;
  previewLines?: string[];
  /** Controls how the hover preview panel renders this block type. */
  previewKind:
    | "text"
    | "heading"
    | "bullet"
    | "numbered"
    | "todo"
    | "quote"
    | "code"
    | "divider"
    | "voice";
  headingLevel?: 1 | 2 | 3 | 4;
  /** Applies the block transform after removing the slash trigger text. */
  run: (editor: Editor, range: SlashRange) => void;
}

const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: "text",
    title: "Text",
    description: "Plain paragraph text.",
    shortcut: "",
    keywords: ["text", "paragraph", "p"],
    icon: Type,
    previewTitle: "Plain paragraph text for notes and body copy.",
    previewKind: "text",
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).setParagraph().run();
    },
  },
  {
    id: "h1",
    title: "Heading 1",
    description: "Large section heading.",
    shortcut: "#",
    keywords: ["h1", "heading", "title"],
    icon: Heading1,
    previewTitle: "Our Values",
    previewLines: ["Ownership", "Altruism"],
    previewKind: "heading",
    headingLevel: 1,
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
    },
  },
  {
    id: "h2",
    title: "Heading 2",
    description: "Medium section heading.",
    shortcut: "##",
    keywords: ["h2", "heading"],
    icon: Heading2,
    previewTitle: "Our Values",
    previewLines: ["Ownership", "Altruism"],
    previewKind: "heading",
    headingLevel: 2,
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
    },
  },
  {
    id: "h3",
    title: "Heading 3",
    description: "Small section heading.",
    shortcut: "###",
    keywords: ["h3", "heading"],
    icon: Heading3,
    previewTitle: "Our Values",
    previewLines: ["Ownership", "Altruism"],
    previewKind: "heading",
    headingLevel: 3,
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run();
    },
  },
  {
    id: "h4",
    title: "Heading 4",
    description: "Minor section heading.",
    shortcut: "####",
    keywords: ["h4", "heading"],
    icon: Heading4,
    previewTitle: "Our Values",
    previewLines: ["Ownership", "Altruism"],
    previewKind: "heading",
    headingLevel: 4,
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 4 }).run();
    },
  },
  {
    id: "bullet",
    title: "Bulleted list",
    description: "Create a simple bulleted list.",
    shortcut: "-",
    keywords: ["ul", "list", "bullet"],
    icon: List,
    previewTitle: "Our Values",
    previewLines: ["Ownership", "Altruism"],
    previewKind: "bullet",
    run: (editor, range) => {
      applyListBlock(editor, range, "bulletList");
    },
  },
  {
    id: "numbered",
    title: "Numbered list",
    description: "Create a numbered list.",
    shortcut: "1.",
    keywords: ["ol", "numbered", "ordered"],
    icon: ListOrdered,
    previewTitle: "Our Values",
    previewLines: ["Ownership", "Altruism"],
    previewKind: "numbered",
    run: (editor, range) => {
      applyListBlock(editor, range, "orderedList");
    },
  },
  {
    id: "todo",
    title: "To-do list",
    description: "Track tasks with checkboxes.",
    shortcut: "[]",
    keywords: ["todo", "check", "task", "checkbox"],
    icon: CheckSquare,
    previewTitle: "Our Values",
    previewLines: ["Ownership", "Altruism"],
    previewKind: "todo",
    run: (editor, range) => {
      applyTaskListBlock(editor, range);
    },
  },
  {
    id: "quote",
    title: "Quote",
    description: "Capture a quote or callout.",
    shortcut: "",
    keywords: ["quote", "blockquote"],
    icon: Quote,
    previewTitle: "Our Values",
    previewLines: ["Ownership", "Altruism"],
    previewKind: "quote",
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    id: "code",
    title: "Code block",
    description: "Capture a code snippet.",
    shortcut: "",
    keywords: ["code", "pre", "snippet"],
    icon: Code2,
    previewTitle: "const values = [",
    previewLines: ['  "ownership",', '  "altruism",', "];"],
    previewKind: "code",
    run: (editor, range) => {
      applyCodeBlock(editor, range, DEFAULT_CODE_LANGUAGE);
    },
  },
  {
    id: "divider",
    title: "Divider",
    description: "Visually divide blocks.",
    shortcut: "---",
    keywords: ["hr", "divider", "line"],
    icon: Minus,
    previewTitle: "Section break",
    previewKind: "divider",
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    id: "voice-note",
    title: "Voice note",
    description: "Record audio inline at the cursor.",
    shortcut: "",
    keywords: ["voice", "audio", "record", "mic", "microphone"],
    icon: Mic,
    previewTitle: "Voice Note",
    previewKind: "voice",
    run: (editor, range) => {
      insertInlineVoiceRecording(editor, range);
    },
  },
  {
    id: "audio-file",
    title: "Audio file",
    description: "Attach an existing audio file from your device.",
    shortcut: "",
    keywords: ["audio", "file", "mp3", "upload", "attach", "sound"],
    icon: FileAudio,
    previewTitle: "Attached audio",
    previewKind: "voice",
    run: (editor, range) => {
      insertAudioFromPicker(editor, range);
    },
  },
];

/** Returns slash trigger metadata when the cursor sits inside `/query` at block start. */
function getSlashState(editor: Editor): { range: SlashRange; query: string } | null {
  const { from, empty } = editor.state.selection;
  if (!empty) return null;

  const $from = editor.state.doc.resolve(from);
  const blockStart = $from.start();
  const textBefore = editor.state.doc.textBetween(blockStart, from, "\0", "\0");
  const match = textBefore.match(/^\/(.*)$/);
  if (!match) return null;

  const slashFrom = blockStart + (match.index ?? 0);
  return {
    range: { from: slashFrom, to: from },
    query: match[1],
  };
}

function filterCommands(query: string): SlashCommand[] {
  const q = query.trim().toLowerCase();
  if (len(q) === 0) return SLASH_COMMANDS;

  return SLASH_COMMANDS.filter((cmd) => {
    if (cmd.title.toLowerCase().includes(q)) return true;
    if (len(cmd.shortcut) > 0 && cmd.shortcut.toLowerCase().includes(q)) return true;
    return cmd.keywords.some((keyword) => keyword.includes(q));
  });
}

function menuCoords(editor: Editor, range: SlashRange): { top: number; left: number } {
  const coords = editor.view.coordsAtPos(range.from);
  const menuWidth = 300;
  const previewWidth = 252;
  const totalWidth = menuWidth + previewWidth + 12;
  const margin = 12;

  let left = coords.left;
  if (left + totalWidth > window.innerWidth - margin) {
    left = Math.max(margin, window.innerWidth - totalWidth - margin);
  }

  let top = coords.bottom + 8;
  const menuHeight = 420;
  if (top + menuHeight > window.innerHeight - margin) {
    top = Math.max(margin, coords.top - menuHeight - 8);
  }

  return { top, left };
}

/** Notion-style slash menu triggered by `/` at the start of a block. */
export default function SlashMenu({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<SlashRange | null>(null);
  const [query, setQuery] = useState("");
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const filtered = useMemo(() => filterCommands(query), [query]);
  const previewIndex = hoverIndex ?? activeIndex;
  const previewCommand = filtered[previewIndex] ?? filtered[0] ?? null;

  const closeMenu = useCallback(() => {
    setOpen(false);
    setRange(null);
    setQuery("");
    setPos(null);
    setActiveIndex(0);
    setHoverIndex(null);
  }, []);

  const runCommand = useCallback(
    (command: SlashCommand) => {
      const slash = getSlashState(editor) ?? (range ? { range, query } : null);
      if (!slash) {
        closeMenu();
        return;
      }

      command.run(editor, slash.range);
      closeMenu();
    },
    [closeMenu, editor, query, range],
  );

  useEffect(() => {
    const syncFromEditor = () => {
      const slash = getSlashState(editor);
      if (!slash) {
        if (open) closeMenu();
        return;
      }

      setOpen(true);
      setRange(slash.range);
      setQuery(slash.query);
      setPos(menuCoords(editor, slash.range));
    };

    editor.on("transaction", syncFromEditor);
    return () => {
      editor.off("transaction", syncFromEditor);
    };
  }, [closeMenu, editor, open]);

  useEffect(() => {
    setActiveIndex(0);
    setHoverIndex(null);
  }, [query]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (!getSlashState(editor)) return;

      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) => Math.min(index + 1, Math.max(filtered.length - 1, 0)));
        setHoverIndex(null);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
        setHoverIndex(null);
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        const command = filtered[activeIndex];
        if (command) runCommand(command);
      }
    };

    editor.view.dom.addEventListener("keydown", onKeyDown, true);
    return () => editor.view.dom.removeEventListener("keydown", onKeyDown, true);
  }, [activeIndex, closeMenu, editor, filtered, open, runCommand]);

  if (!open || !pos || !range) return null;

  return (
    <div
      className="ko-slash-menu-root fixed z-50 flex items-start gap-2"
      style={{ top: pos.top, left: pos.left }}
    >
      <div className="ko-slash-menu">
        <div className="ko-slash-menu-search">
          <span className="ko-slash-menu-search-prefix">/</span>
          <span
            className={
              len(query) > 0 ? "ko-slash-menu-search-value" : "ko-slash-menu-search-placeholder"
            }
          >
            {len(query) > 0 ? query : SLASH_MENU_PLACEHOLDER}
          </span>
        </div>

        <div className="ko-slash-menu-section">{SLASH_MENU_SECTION}</div>

        <div className="ko-slash-menu-list ko-scroll">
          {filtered.length === 0 && <div className="ko-slash-menu-empty">No results</div>}
          {filtered.map((command, index) => (
            <SlashMenuItem
              key={command.id}
              command={command}
              active={index === activeIndex}
              onHover={() => setHoverIndex(index)}
              onLeave={() => setHoverIndex(null)}
              onSelect={() => runCommand(command)}
            />
          ))}
        </div>

        <button type="button" className="ko-slash-menu-close" onClick={closeMenu}>
          <span>Close menu</span>
          <kbd>esc</kbd>
        </button>
      </div>

      {previewCommand && <SlashMenuPreview command={previewCommand} />}
    </div>
  );
}

function SlashMenuItem({
  command,
  active,
  onHover,
  onLeave,
  onSelect,
}: {
  command: SlashCommand;
  active: boolean;
  onHover: () => void;
  onLeave: () => void;
  onSelect: () => void;
}) {
  const Icon = command.icon;

  return (
    <button
      type="button"
      className={`ko-slash-menu-item ${active ? "is-active" : ""}`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onSelect}
    >
      <span className="ko-slash-menu-item-icon">
        <Icon size={16} strokeWidth={1.75} />
      </span>
      <span className="ko-slash-menu-item-label">{command.title}</span>
      {len(command.shortcut) > 0 && (
        <span className="ko-slash-menu-item-shortcut">{command.shortcut}</span>
      )}
    </button>
  );
}

function SlashMenuPreview({ command }: { command: SlashCommand }) {
  return (
    <div className="ko-slash-menu-preview">
      <div className="ko-slash-menu-preview-shell">
        <div className="ko-slash-menu-preview-card">
          <SlashMenuPreviewContent command={command} />
        </div>
      </div>
      <p className="ko-slash-menu-preview-desc">{command.description}</p>
    </div>
  );
}

function SlashMenuPreviewContent({ command }: { command: SlashCommand }) {
  if (command.previewKind === "code") {
    return (
      <pre className="ko-slash-menu-preview-code">
        <code>{command.previewTitle}</code>
        {command.previewLines?.map((line) => (
          <code key={line}>{line}</code>
        ))}
      </pre>
    );
  }

  if (command.previewKind === "divider") {
    return (
      <div className="ko-slash-preview-divider">
        <p>Content above</p>
        <hr />
        <p>Content below</p>
      </div>
    );
  }

  if (command.previewKind === "voice") {
    return (
      <div className="ko-slash-preview-voice">
        <span className="ko-slash-preview-voice-play" aria-hidden />
        <div className="ko-slash-preview-voice-bars" aria-hidden>
          {Array.from({ length: 24 }).map((_, index) => (
            <span
              key={index}
              style={{ height: `${20 + ((index * 17) % 60)}%` }}
              className="ko-slash-preview-voice-bar"
            />
          ))}
        </div>
        <span className="ko-slash-preview-voice-time">0:42</span>
      </div>
    );
  }

  if (command.previewKind === "quote") {
    return (
      <blockquote className="ko-slash-preview-quote">
        <p>{command.previewTitle}</p>
        {command.previewLines?.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </blockquote>
    );
  }

  if (command.previewKind === "bullet") {
    return (
      <ul className="ko-slash-preview-list ko-slash-preview-list-bullet">
        {command.previewLines?.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    );
  }

  if (command.previewKind === "numbered") {
    return (
      <ol className="ko-slash-preview-list ko-slash-preview-list-numbered">
        {command.previewLines?.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ol>
    );
  }

  if (command.previewKind === "todo") {
    return (
      <ul className="ko-slash-preview-list ko-slash-preview-list-todo">
        {command.previewLines?.map((line, index) => (
          <li key={line}>
            <span
              className={`ko-slash-preview-checkbox ${index === 0 ? "is-checked" : ""}`}
              aria-hidden
            />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (command.previewKind === "heading" && command.headingLevel) {
    return (
      <>
        <PreviewHeading level={command.headingLevel}>{command.previewTitle}</PreviewHeading>
        {command.previewLines && command.previewLines.length > 0 && (
          <ul className="ko-slash-preview-list ko-slash-preview-list-bullet is-sub">
            {command.previewLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
      </>
    );
  }

  return <p className="ko-slash-preview-text">{command.previewTitle}</p>;
}

function PreviewHeading({ level, children }: { level: 1 | 2 | 3 | 4; children: ReactNode }) {
  if (level === 1) return <h1 className="ko-slash-preview-h1">{children}</h1>;
  if (level === 2) return <h2 className="ko-slash-preview-h2">{children}</h2>;
  if (level === 3) return <h3 className="ko-slash-preview-h3">{children}</h3>;
  return <h4 className="ko-slash-preview-h4">{children}</h4>;
}
