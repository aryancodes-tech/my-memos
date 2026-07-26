import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import VoiceNoteNodeView from "@/editor/VoiceNoteNodeView";

/** Voice note lifecycle: inline recording or saved playback block. */
export type VoiceNoteStatus = "recording" | "saved";

/** Shared attrs for inserting a saved voice note block. */
export interface VoiceNoteAttrs {
  attachmentPath?: string | null;
  duration?: number;
  size?: number;
  title?: string;
  createdAt?: string | null;
  status?: VoiceNoteStatus;
}

/** Embedded voice note block referencing an audio file on disk. */
export const VoiceNote = Node.create({
  name: "voiceNote",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      autoStart: {
        default: false,
        parseHTML: () => false,
        renderHTML: () => ({}),
      },
      status: {
        default: "saved",
        parseHTML: (element) => element.getAttribute("data-status") ?? "saved",
        renderHTML: (attributes) =>
          attributes.status ? { "data-status": attributes.status as string } : {},
      },
      attachmentPath: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-attachment-path"),
        renderHTML: (attributes) =>
          attributes.attachmentPath
            ? { "data-attachment-path": attributes.attachmentPath as string }
            : {},
      },
      duration: {
        default: 0,
        parseHTML: (element) => Number(element.getAttribute("data-duration") ?? 0),
        renderHTML: (attributes) =>
          attributes.duration ? { "data-duration": String(attributes.duration) } : {},
      },
      size: {
        default: 0,
        parseHTML: (element) => Number(element.getAttribute("data-size") ?? 0),
        renderHTML: (attributes) =>
          attributes.size ? { "data-size": String(attributes.size) } : {},
      },
      title: {
        default: "Voice Note",
        parseHTML: (element) => element.getAttribute("data-title") ?? "Voice Note",
        renderHTML: (attributes) =>
          attributes.title ? { "data-title": attributes.title as string } : {},
      },
      createdAt: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-created-at"),
        renderHTML: (attributes) =>
          attributes.createdAt ? { "data-created-at": attributes.createdAt as string } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="voice-note"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "voice-note" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VoiceNoteNodeView);
  },

  addCommands() {
    return {
      insertVoiceNote:
        (attrs: VoiceNoteAttrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { status: "saved", ...attrs },
          }),
      insertVoiceNoteRecording:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              status: "recording",
              autoStart: true,
              attachmentPath: null,
              duration: 0,
              size: 0,
              title: "Voice Note",
              createdAt: null,
            },
          }),
    };
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    voiceNote: {
      insertVoiceNote: (attrs: VoiceNoteAttrs) => ReturnType;
      insertVoiceNoteRecording: () => ReturnType;
    };
  }
}
