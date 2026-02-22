import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from "@tiptap/react";
import { useState, useRef, useEffect } from "react";

export function DraggableParagraphView({ node, getPos, editor }: NodeViewProps) {
  const [hovered, setHovered] = useState(false);
  const [dropPosition, setDropPosition] = useState<"above" | "below" | null>(null);
  const isEmpty = node.content.size === 0;
  const isFirstNode = typeof getPos === "function" && getPos() === 0;
  const editorIsEmpty = isEmpty && isFirstNode && editor.state.doc.childCount === 1;
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Store position in a ref so it's always current
  const currentPosRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (typeof getPos === "function") {
      currentPosRef.current = getPos();
    }
  });

  const handleDragStart = (e: React.DragEvent) => {
    if (typeof getPos !== "function") return;

    const pos = getPos();
    if (pos === undefined) return;

    const dragData = {
      type: "paragraph",
      pos,
      nodeSize: node.nodeSize,
      content: node.textContent,
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
      className={`relative flex items-start gap-2 my-0.5 group draggable-paragraph`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drop indicator line - above */}
      {dropPosition === "above" && (
        <div className="absolute -top-0.5 left-0 right-0 h-0.5 bg-blue-500 rounded-full z-50 pointer-events-none" />
      )}

      {/* Drag handle - visible on hover */}
      <div
        className={`drag-handle flex items-center pt-0.5 transition-opacity flex-shrink-0 w-4 ${
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

      {/* Text content */}
      <div className="flex-1 relative min-h-[1.625rem]">
        {editorIsEmpty && (
          <span className="absolute top-0 left-0 text-sm leading-relaxed text-muted-foreground/50 pointer-events-none select-none">
            Start writing your prompt
          </span>
        )}
        <NodeViewContent
          className="text-sm leading-relaxed text-foreground min-h-[1.625rem]"
        />
      </div>

      {/* Drop indicator line - below */}
      {dropPosition === "below" && (
        <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-blue-500 rounded-full z-50 pointer-events-none" />
      )}
    </NodeViewWrapper>
  );
}
