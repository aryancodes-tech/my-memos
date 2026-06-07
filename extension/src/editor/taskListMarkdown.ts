import BulletList from "@tiptap/extension-bullet-list";
import TaskItem from "@tiptap/extension-task-item";
import { wrappingInputRule } from "@tiptap/core";

import {
  MARKDOWN_BULLET_LIST_INPUT_REGEX,
  MARKDOWN_TASK_ITEM_INPUT_REGEX,
  MARKDOWN_TASK_LIST_HTML_CLASS,
} from "@/lib/constants";

/**
 * Bullet list that skips GFM task syntax (`- [x]`) and markdown-it task list HTML.
 */
export const MarkdownBulletList = BulletList.extend({
  parseHTML() {
    return [
      {
        tag: "ul",
        getAttrs: (node) => {
          if (!(node instanceof HTMLElement)) {
            return null;
          }

          if (node.classList.contains(MARKDOWN_TASK_LIST_HTML_CLASS)) {
            return false;
          }

          if (len(node.getAttribute("data-type") ?? "") > 0) {
            return false;
          }

          return null;
        },
      },
    ];
  },

  addInputRules() {
    return [
      wrappingInputRule({
        find: MARKDOWN_BULLET_LIST_INPUT_REGEX,
        type: this.type,
      }),
    ];
  },
});

/**
 * Task item with GFM markdown typing support (`- [x] ` / `- [ ] `).
 */
export const MarkdownTaskItem = TaskItem.extend({
  addInputRules() {
    const parentRules = this.parent?.() ?? [];

    return [
      wrappingInputRule({
        find: MARKDOWN_TASK_ITEM_INPUT_REGEX,
        type: this.type,
        getAttributes: (match) => ({
          checked: match[match.length - 1] === "x",
        }),
      }),
      ...parentRules,
    ];
  },
});

/** Empty-string check using length, per project convention. */
function len(value: string): number {
  return value.length;
}
