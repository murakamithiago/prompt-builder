import { useState } from "react";
import type { SavedPrompt } from "@/lib/storage";

interface PromptBlockProps {
  prompt: SavedPrompt;
  onEdit: (prompt: SavedPrompt) => void;
  onRemove: (blockId: string) => void;
  blockId: string;
  dragHandleProps?: Record<string, unknown>;
}

export function PromptBlock({
  prompt,
  onEdit,
  onRemove: _onRemove,
  blockId: _blockId,
  dragHandleProps,
}: PromptBlockProps) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative flex items-start gap-2 my-2 group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Drag handle — visible on hover */}
      <div
        className={`flex items-center pt-3 transition-opacity cursor-grab active:cursor-grabbing ${
          hovered ? "opacity-100" : "opacity-0"
        }`}
        {...dragHandleProps}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="text-muted-foreground"
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
        className={`flex-1 border border-border rounded-xl px-4 py-3 bg-card transition-all max-w-2xl ${
          hovered ? "border-muted-foreground/30" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Title */}
            <p className="text-sm font-semibold text-foreground">
              {prompt.title}
            </p>

            {/* Content preview or full */}
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

          {/* Expand/collapse chevron */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1 p-1 rounded-md hover:bg-accent transition-colors flex-shrink-0 bg-transparent border-none shadow-none"
            style={{ boxShadow: "none" }}
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
              className={`text-foreground transition-transform ${
                expanded ? "rotate-180" : ""
              }`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </div>

      {/* Edit button — visible on hover */}
      <div
        className={`flex items-center pt-2 transition-opacity ${
          hovered ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="relative group/edit">
          <button
            onClick={() => onEdit(prompt)}
            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-accent transition-colors bg-card"
            style={{ boxShadow: "none" }}
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
              className="text-foreground"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          {/* Tooltip */}
          <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2.5 py-1 rounded-md whitespace-nowrap opacity-0 group-hover/edit:opacity-100 transition-opacity pointer-events-none">
            Edit prompt
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground rotate-45" />
          </div>
        </div>
      </div>
    </div>
  );
}
