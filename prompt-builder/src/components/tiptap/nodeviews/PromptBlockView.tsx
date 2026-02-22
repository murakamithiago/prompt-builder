import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useState, useRef } from "react";
import type { SavedPrompt } from "@/lib/storage";

export function PromptBlockView({
  node,
  deleteNode,
  selected,
  extension,
  getPos,
  editor,
}: NodeViewProps) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [dropPosition, setDropPosition] = useState<"above" | "below" | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const prompt: SavedPrompt = {
    id: node.attrs.promptId,
    title: node.attrs.title,
    content: node.attrs.content,
    tags: node.attrs.tags || [],
    createdAt: node.attrs.createdAt || 0,
  };

  const handleEdit = () => {
    extension.options.onEdit?.(prompt);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deleteNode();
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (typeof getPos !== "function") return;

    const pos = getPos();
    if (pos === undefined) return;

    const dragData = {
      type: "promptBlock",
      pos,
      nodeSize: node.nodeSize,
      title: prompt.title,
    };

    // Use custom MIME type to prevent ProseMirror from inserting as text
    e.dataTransfer.setData("application/x-editor-block", JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = "move";

    document.body.classList.add("is-dragging");

    // Set a drag image
    if (wrapperRef.current) {
      const clone = wrapperRef.current.cloneNode(true) as HTMLElement;
      clone.style.position = "absolute";
      clone.style.top = "-1000px";
      clone.style.opacity = "0.8";
      clone.style.width = wrapperRef.current.offsetWidth + "px";
      document.body.appendChild(clone);
      e.dataTransfer.setDragImage(clone, 20, 20);
      setTimeout(() => clone.remove(), 0);
    }
  };

  const handleDragEnd = () => {
    document.body.classList.remove("is-dragging");
    setDropPosition(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    // Check if this is an external drag (from sidebar) - let it bubble to TipTapEditor
    if (e.dataTransfer.types.includes('application/x-prompt')) {
      return;
    }

    // Only handle internal editor block drags
    if (!e.dataTransfer.types.includes('application/x-editor-block')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";

    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      const newPosition = e.clientY < midpoint ? "above" : "below";
      if (newPosition !== dropPosition) {
        setDropPosition(newPosition);
      }
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    // Check if this is an external drag - let it bubble
    if (e.dataTransfer.types.includes('application/x-prompt')) {
      return;
    }
    // Only handle internal editor block drags
    if (!e.dataTransfer.types.includes('application/x-editor-block')) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Check if this is an external drag - let it bubble
    if (e.dataTransfer.types.includes('application/x-prompt')) {
      return;
    }
    // Only handle internal editor block drags
    if (!e.dataTransfer.types.includes('application/x-editor-block')) {
      return;
    }
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!wrapperRef.current?.contains(relatedTarget)) {
      setDropPosition(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    // Check if this is an external drag (from sidebar) - let it bubble to TipTapEditor
    if (e.dataTransfer.types.includes('application/x-prompt')) {
      setDropPosition(null);
      return;
    }

    // Only handle internal editor block drags
    const dataStr = e.dataTransfer.getData("application/x-editor-block");
    if (!dataStr) {
      setDropPosition(null);
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    setDropPosition(null);
    document.body.classList.remove("is-dragging");

    if (!editor || typeof getPos !== "function") return;

    try {
      const data = JSON.parse(dataStr);
      if (!data || (data.type !== "paragraph" && data.type !== "promptBlock")) return;

      const fromPos = data.pos as number;
      const targetPos = getPos();

      if (targetPos === undefined) return;

      // Calculate where to insert based on drop position
      let insertPos = targetPos;
      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        if (e.clientY >= midpoint) {
          insertPos = targetPos + node.nodeSize;
        }
      }

      // Don't do anything if dropping at the same position
      if (fromPos === insertPos || fromPos + data.nodeSize === insertPos) return;

      const { state, view } = editor;
      const $from = state.doc.resolve(fromPos);
      const nodeToMove = $from.nodeAfter;

      if (!nodeToMove) return;

      let tr = state.tr;

      if (insertPos > fromPos) {
        tr = tr.insert(insertPos, nodeToMove);
        tr = tr.delete(fromPos, fromPos + nodeToMove.nodeSize);
      } else {
        tr = tr.delete(fromPos, fromPos + nodeToMove.nodeSize);
        tr = tr.insert(insertPos, nodeToMove);
      }

      view.dispatch(tr);
    } catch {
      // Silently handle parse errors
    }
  };

  return (
    <NodeViewWrapper
      ref={wrapperRef}
      className="relative flex items-start gap-2 my-2 group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drop indicator line - above */}
      {dropPosition === "above" && (
        <div className="absolute -top-1 left-0 right-0 h-0.5 bg-blue-500 rounded-full z-50 pointer-events-none" />
      )}

      {/* Drag handle - visible on hover */}
      <div
        className={`drag-handle flex items-center pt-3 transition-opacity flex-shrink-0 w-4 ${
          hovered ? "opacity-100" : "opacity-0"
        }`}
        contentEditable={false}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="text-muted-foreground pointer-events-none"
        >
          <circle cx="5" cy="3" r="1.5" />
          <circle cx="11" cy="3" r="1.5" />
          <circle cx="5" cy="8" r="1.5" />
          <circle cx="11" cy="8" r="1.5" />
          <circle cx="5" cy="13" r="1.5" />
          <circle cx="11" cy="13" r="1.5" />
        </svg>
      </div>

      {/* Card */}
      <div
        className={`flex-1 border rounded-xl px-4 py-3 transition-all max-w-2xl overflow-hidden ${
          selected
            ? "bg-primary/5 border-primary/20"
            : hovered
            ? "bg-card border-muted-foreground/30"
            : "bg-card border-border"
        }`}
        contentEditable={false}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {prompt.title}
            </p>
            {expanded ? (
              <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                {prompt.content}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mt-0.5 truncate">
                {prompt.content}
              </p>
            )}
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1 p-1 rounded-md hover:bg-accent transition-colors flex-shrink-0 bg-transparent border-none shadow-none"
            style={{ boxShadow: "none" }}
            contentEditable={false}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`text-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </div>

      {/* Edit and Remove buttons */}
      <div
        className={`flex items-center gap-1 pt-2 transition-opacity ${hovered ? "opacity-100" : "opacity-0"}`}
        contentEditable={false}
      >
        <div className="relative group/edit">
          <button
            onClick={handleEdit}
            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-accent transition-colors bg-card"
            style={{ boxShadow: "none" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2.5 py-1 rounded-md whitespace-nowrap opacity-0 group-hover/edit:opacity-100 transition-opacity pointer-events-none z-10">
            Edit prompt
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground rotate-45" />
          </div>
        </div>

        <div className="relative group/remove">
          <button
            onClick={handleRemove}
            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-destructive/10 hover:border-destructive/30 transition-colors bg-card"
            style={{ boxShadow: "none" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
          <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2.5 py-1 rounded-md whitespace-nowrap opacity-0 group-hover/remove:opacity-100 transition-opacity pointer-events-none z-10">
            Remove
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground rotate-45" />
          </div>
        </div>
      </div>

      {/* Drop indicator line - below */}
      {dropPosition === "below" && (
        <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-500 rounded-full z-50 pointer-events-none" />
      )}
    </NodeViewWrapper>
  );
}
