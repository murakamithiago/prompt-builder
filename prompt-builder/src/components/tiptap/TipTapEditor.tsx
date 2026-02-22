import {
  forwardRef,
  useImperativeHandle,
  useCallback,
  useEffect,
  useState,
  useRef,
} from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { PromptBlockNode } from "./extensions/PromptBlockNode";
import { DraggableParagraph } from "./extensions/DraggableParagraph";
import {
  tipTapJSONToEditorBlocks,
  getPlainTextFromJSON,
  type EditorBlock,
} from "./utils/serialization";
import { generateId, type SavedPrompt } from "@/lib/storage";

export interface EditorHandle {
  insertPromptAtEnd: (prompt: SavedPrompt) => void;
  insertPromptAtPosition: (prompt: SavedPrompt, position: number) => void;
  getPlainText: () => string;
  clear: () => void;
  getBlocks: () => EditorBlock[];
  moveBlock: (activeId: string, overId: string) => void;
  getJSON: () => object;
  setContent: (json: object) => void;
  hasContent: () => boolean;
}

interface TipTapEditorProps {
  onEditPrompt: (prompt: SavedPrompt) => void;
  onExternalDrop?: (prompt: SavedPrompt, position: number) => void;
}

export const TipTapEditor = forwardRef<EditorHandle, TipTapEditorProps>(
  function TipTapEditor({ onEditPrompt }, ref) {
    const [promptCount, setPromptCount] = useState(0);
    const [externalDropPosition, setExternalDropPosition] = useState<number | null>(null);
    const editorContainerRef = useRef<HTMLDivElement>(null);

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          paragraph: false,
          heading: false,
          blockquote: false,
          bulletList: false,
          orderedList: false,
          codeBlock: false,
          horizontalRule: false,
          bold: false,
          italic: false,
          strike: false,
          code: false,
        }),
        DraggableParagraph,
        PromptBlockNode.configure({
          onEdit: onEditPrompt,
        }),
      ],
      content: { type: "doc", content: [{ type: "paragraph" }] },
      editorProps: {
        attributes: {
          class: "tiptap-editor",
        },
      },
      onUpdate: ({ editor }) => {
        let count = 0;
        editor.state.doc.descendants((node) => {
          if (node.type.name === "promptBlock") {
            count++;
          }
        });
        setPromptCount(count);
      },
    });

    // Calculate drop position from Y coordinate
    const calculateDropPosition = useCallback((clientY: number): number => {
      if (!editor || !editorContainerRef.current) return -1;

      const proseMirror = editorContainerRef.current.querySelector('.ProseMirror');
      if (!proseMirror) return -1;

      // Get all top-level block nodes
      const nodeViews = proseMirror.querySelectorAll('[data-node-view-wrapper]');

      let insertPos = 1; // Default: start of document (after doc node)

      for (let i = 0; i < nodeViews.length; i++) {
        const nodeView = nodeViews[i] as HTMLElement;
        const rect = nodeView.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;

        if (clientY < midpoint) {
          // Insert before this node
          break;
        }

        // Insert after this node - we need to get the actual position
        // For now, just track index and calculate position later
        insertPos = i + 1;
      }

      // Convert index to ProseMirror position
      let pos = 0;
      let nodeIndex = 0;
      editor.state.doc.forEach((node, offset) => {
        if (nodeIndex < insertPos) {
          pos = offset + node.nodeSize;
        }
        nodeIndex++;
      });

      return pos || 1;
    }, [editor]);

    // Handle external drag over
    const handleDragOver = useCallback((e: React.DragEvent) => {
      // Check if this is an external drag (from sidebar) using custom MIME type
      const isExternalDrag = e.dataTransfer.types.includes('application/x-prompt');
      if (!isExternalDrag) return;

      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";

      const pos = calculateDropPosition(e.clientY);
      setExternalDropPosition(pos);
    }, [calculateDropPosition]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
      // Only clear if actually leaving the container
      const relatedTarget = e.relatedTarget as HTMLElement;
      if (!editorContainerRef.current?.contains(relatedTarget)) {
        setExternalDropPosition(null);
      }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
      // Check if this is an external drop using custom MIME type
      const dataStr = e.dataTransfer.getData("application/x-prompt");
      if (!dataStr) {
        // Not an external drop, let internal handlers deal with it
        setExternalDropPosition(null);
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      setExternalDropPosition(null);

      if (!editor) return;

      try {
        const data = JSON.parse(dataStr);

        // This is a sidebar prompt
        if (data.id && data.title && data.content !== undefined) {
          const pos = calculateDropPosition(e.clientY);

          const promptNode = {
            type: "promptBlock",
            attrs: {
              id: generateId(),
              promptId: data.id,
              title: data.title,
              content: data.content,
              tags: data.tags || [],
              createdAt: data.createdAt || Date.now(),
            },
          };

          // Insert at position
          const tr = editor.state.tr;
          tr.insert(pos, editor.schema.nodeFromJSON(promptNode));
          tr.insert(pos + 1, editor.schema.nodeFromJSON({ type: "paragraph" }));
          editor.view.dispatch(tr);
        }
      } catch {
        // Not JSON, ignore
      }
    }, [editor, calculateDropPosition]);

    // EditorHandle implementation
    const insertPromptAtEnd = useCallback(
      (prompt: SavedPrompt) => {
        if (!editor) return;

        editor
          .chain()
          .focus("end")
          .insertContent([
            {
              type: "promptBlock",
              attrs: {
                id: generateId(),
                promptId: prompt.id,
                title: prompt.title,
                content: prompt.content,
                tags: prompt.tags,
                createdAt: prompt.createdAt,
              },
            },
            { type: "paragraph" },
          ])
          .run();
      },
      [editor]
    );

    const insertPromptAtPosition = useCallback(
      (prompt: SavedPrompt, position: number) => {
        if (!editor) return;

        const promptNode = {
          type: "promptBlock",
          attrs: {
            id: generateId(),
            promptId: prompt.id,
            title: prompt.title,
            content: prompt.content,
            tags: prompt.tags || [],
            createdAt: prompt.createdAt || Date.now(),
          },
        };

        const tr = editor.state.tr;
        tr.insert(position, editor.schema.nodeFromJSON(promptNode));
        tr.insert(position + 1, editor.schema.nodeFromJSON({ type: "paragraph" }));
        editor.view.dispatch(tr);
      },
      [editor]
    );

    const getPlainText = useCallback(() => {
      if (!editor) return "";
      return getPlainTextFromJSON(editor.getJSON());
    }, [editor]);

    const clear = useCallback(() => {
      if (!editor) return;
      editor.commands.setContent({
        type: "doc",
        content: [{ type: "paragraph" }],
      });
    }, [editor]);

    const getBlocks = useCallback(() => {
      if (!editor) return [];
      return tipTapJSONToEditorBlocks(editor.getJSON());
    }, [editor]);

    const moveBlock = useCallback(
      (activeId: string, overId: string) => {
        if (!editor || activeId === overId) return;
      },
      [editor]
    );

    const getJSON = useCallback(() => {
      if (!editor) return { type: "doc", content: [] };
      return editor.getJSON();
    }, [editor]);

    const setContent = useCallback(
      (json: object) => {
        if (!editor) return;
        editor.commands.setContent(json);
      },
      [editor]
    );

    const hasContent = useCallback(() => {
      if (!editor) return false;
      const json = editor.getJSON();
      const content = (json as { content?: unknown[] }).content || [];

      for (const node of content) {
        const n = node as { type?: string; content?: unknown[]; attrs?: unknown };
        if (n.type === "promptBlock") return true;
        if (n.type === "paragraph" && n.content && n.content.length > 0) {
          for (const child of n.content) {
            const c = child as { text?: string };
            if (c.text && c.text.trim()) return true;
          }
        }
      }
      return false;
    }, [editor]);

    useImperativeHandle(ref, () => ({
      insertPromptAtEnd,
      insertPromptAtPosition,
      getPlainText,
      clear,
      getBlocks,
      moveBlock,
      getJSON,
      setContent,
      hasContent,
    }));

    // Update prompt count on mount
    useEffect(() => {
      if (editor) {
        let count = 0;
        editor.state.doc.descendants((node) => {
          if (node.type.name === "promptBlock") {
            count++;
          }
        });
        setPromptCount(count);
      }
    }, [editor]);

    // Render drop indicator
    const renderDropIndicator = () => {
      if (externalDropPosition === null || !editor || !editorContainerRef.current) return null;

      const proseMirror = editorContainerRef.current.querySelector('.ProseMirror');
      if (!proseMirror) return null;

      const nodeViews = proseMirror.querySelectorAll('[data-node-view-wrapper]');

      // Find the node at the drop position and render indicator
      let nodeIndex = 0;
      let pos = 0;
      let targetNode: HTMLElement | null = null;
      let insertAfter = false;

      editor.state.doc.forEach((node) => {
        if (pos + node.nodeSize <= externalDropPosition) {
          nodeIndex++;
          insertAfter = true;
        } else if (pos < externalDropPosition) {
          insertAfter = false;
        }
        pos += node.nodeSize;
      });

      if (nodeViews.length > 0) {
        if (insertAfter && nodeIndex > 0) {
          targetNode = nodeViews[Math.min(nodeIndex - 1, nodeViews.length - 1)] as HTMLElement;
        } else {
          targetNode = nodeViews[Math.min(nodeIndex, nodeViews.length - 1)] as HTMLElement;
        }
      }

      if (targetNode) {
        const containerRect = editorContainerRef.current.getBoundingClientRect();
        const nodeRect = targetNode.getBoundingClientRect();
        const top = insertAfter
          ? nodeRect.bottom - containerRect.top
          : nodeRect.top - containerRect.top;

        return (
          <div
            className="absolute left-6 right-6 h-0.5 bg-blue-500 rounded-full z-50 pointer-events-none"
            style={{ top: `${top}px` }}
          />
        );
      }

      return null;
    };

    return (
      <div className="flex-1 flex flex-col h-full">
        <div
          ref={editorContainerRef}
          className="flex-1 overflow-auto bg-background relative"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="max-w-3xl mx-auto py-8 px-6">
            <EditorContent editor={editor} />
          </div>
          {renderDropIndicator()}
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between px-4 py-1.5 border-t border-border bg-card text-[11px] text-muted-foreground">
          <span>
            {promptCount} prompt{promptCount !== 1 ? "s" : ""} inserted
          </span>
          <span>Drag to reorder blocks</span>
        </div>
      </div>
    );
  }
);
