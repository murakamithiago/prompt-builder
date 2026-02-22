import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { DraggableParagraphView } from "../nodeviews/DraggableParagraphView";

export const DraggableParagraph = Node.create({
  name: "paragraph",
  group: "block",
  content: "inline*",
  draggable: true,
  selectable: false, // Don't show selection outline on paragraphs

  parseHTML() {
    return [{ tag: "p" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["p", mergeAttributes(HTMLAttributes), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DraggableParagraphView, {
      stopEvent: ({ event }) => {
        // Stop ProseMirror from handling drag/drop events so our custom React handlers work
        if (event.type.startsWith("drag") || event.type === "drop") {
          return true;
        }
        return false;
      },
    });
  },
});
