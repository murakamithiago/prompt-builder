import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { PromptBlockView } from "../nodeviews/PromptBlockView";
import type { SavedPrompt } from "@/lib/storage";

export interface PromptBlockOptions {
  onEdit: (prompt: SavedPrompt) => void;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    promptBlock: {
      insertPromptBlock: (attrs: {
        id: string;
        promptId: string;
        title: string;
        content: string;
        tags: string[];
        createdAt: number;
      }) => ReturnType;
    };
  }
}

export const PromptBlockNode = Node.create<PromptBlockOptions>({
  name: "promptBlock",
  group: "block",
  atom: true, // Treated as single unit, no editable content inside
  selectable: true, // Can be selected as part of range
  draggable: true, // Can be dragged for reordering

  addOptions() {
    return {
      onEdit: () => {},
    };
  },

  addAttributes() {
    return {
      id: {
        default: null,
      },
      promptId: {
        default: null,
      },
      title: {
        default: "",
      },
      content: {
        default: "",
      },
      tags: {
        default: [],
      },
      createdAt: {
        default: 0,
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="prompt-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "prompt-block" }),
    ];
  },

  // For getPlainText(), return the prompt content
  renderText({ node }) {
    return node.attrs.content || "";
  },

  addNodeView() {
    return ReactNodeViewRenderer(PromptBlockView, {
      stopEvent: ({ event }) => {
        // Stop ProseMirror from handling drag/drop events so our custom React handlers work
        if (event.type.startsWith("drag") || event.type === "drop") {
          return true;
        }
        return false;
      },
    });
  },

  addCommands() {
    return {
      insertPromptBlock:
        (attrs) =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs,
            })
            .run();
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        const { selection } = editor.state;
        const { $from, empty } = selection;

        // Only handle when cursor is at an empty position
        if (!empty) return false;

        // Check if we're at the start of a paragraph
        if ($from.parentOffset !== 0) return false;

        // Check if the previous node is a promptBlock
        const posBefore = $from.before();
        if (posBefore <= 0) return false;

        const nodeBefore = editor.state.doc.nodeAt(posBefore - 1);
        if (nodeBefore?.type.name === "promptBlock") {
          // Delete the prompt block
          const tr = editor.state.tr;
          tr.delete(posBefore - nodeBefore.nodeSize, posBefore);
          editor.view.dispatch(tr);
          return true;
        }

        return false;
      },
    };
  },
});
