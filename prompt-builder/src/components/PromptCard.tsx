import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import type { SavedPrompt } from "@/lib/storage";

interface PromptCardProps {
  prompt: SavedPrompt;
  onDelete: (id: string) => void;
  onEdit: (prompt: SavedPrompt) => void;
  onDragStartReorder?: (id: string) => void;
  onDragEndReorder?: () => void;
  isDraggingReorder?: boolean;
  disableReorder?: boolean;
}

export function PromptCard({ prompt, onDelete, onEdit, onDragStartReorder, onDragEndReorder, isDraggingReorder, disableReorder }: PromptCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpen]);

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
    onEdit(prompt);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
    onDelete(prompt.id);
  };

  // Native HTML5 drag handlers
  const handleDragStart = (e: React.DragEvent) => {
    // Set the drag data with a custom MIME type to avoid ProseMirror intercepting it
    const promptData = JSON.stringify(prompt);
    e.dataTransfer.setData("application/x-prompt", promptData);
    // Also set sidebar reorder MIME type for reordering within the library
    if (!disableReorder) {
      e.dataTransfer.setData("application/x-sidebar-reorder", prompt.id);
    }
    e.dataTransfer.effectAllowed = "copyMove";
    setIsDragging(true);
    onDragStartReorder?.(prompt.id);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onDragEndReorder?.();
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`p-3 rounded-lg border border-border hover:border-muted-foreground/30 transition-colors bg-card cursor-grab active:cursor-grabbing relative ${
        isDragging || isDraggingReorder ? "opacity-50" : ""
      }`}
    >
      {/* Title and menu */}
      <div className="flex items-start justify-between gap-2 min-w-0">
        <p className="text-sm font-medium text-foreground truncate flex-1 min-w-0">
          {prompt.title}
        </p>

        {/* Dropdown menu */}
        <div
          className="relative flex-shrink-0"
          ref={menuRef}
          draggable={false}
          onDragStart={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleMenuToggle}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            draggable={false}
            className="p-0.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
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
              className={`transition-transform ${menuOpen ? "rotate-180" : ""}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg py-1 z-50 min-w-[100px]"
              draggable={false}
              onDragStart={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleEdit}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                draggable={false}
                className="w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 hover:bg-accent transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit
              </button>
              <button
                onClick={handleDelete}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                draggable={false}
                className="w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 hover:bg-accent text-destructive transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content preview */}
      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
        {prompt.content}
      </p>

      {/* Tags - at bottom */}
      {prompt.tags && prompt.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {prompt.tags.map((tag) => (
            <Badge
              key={tag}
              variant="default"
              className="rounded-full px-2.5 py-0.5 text-[10px]"
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
