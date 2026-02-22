import { useState } from "react";

export type SidebarView = "prompts" | "drafts";

interface IconSidebarProps {
  activeView: SidebarView;
  onViewChange: (view: SidebarView) => void;
  onNewPrompt: () => void;
}

export function IconSidebar({ activeView, onViewChange, onNewPrompt }: IconSidebarProps) {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  return (
    <div className="w-12 bg-background border-r border-border flex flex-col items-center py-3 gap-2">
      {/* App logo */}
      <button
        className="w-9 h-9 rounded-lg bg-foreground text-background flex items-center justify-center mb-2"
        title="Prompt Builder"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
        </svg>
      </button>

      {/* New prompt button */}
      <div className="relative">
        <button
          onClick={onNewPrompt}
          onMouseEnter={() => setHoveredButton("new")}
          onMouseLeave={() => setHoveredButton(null)}
          className="w-9 h-9 rounded-lg hover:bg-accent flex items-center justify-center transition-colors"
          title="New prompt"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        {hoveredButton === "new" && (
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-foreground text-background text-xs px-2 py-1 rounded whitespace-nowrap z-50">
            New prompt
          </div>
        )}
      </div>

      {/* Saved prompts button */}
      <div className="relative">
        <button
          onClick={() => onViewChange("prompts")}
          onMouseEnter={() => setHoveredButton("prompts")}
          onMouseLeave={() => setHoveredButton(null)}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
            activeView === "prompts" ? "bg-accent" : "hover:bg-accent"
          }`}
          title="Saved prompts"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </button>
        {hoveredButton === "prompts" && (
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-foreground text-background text-xs px-2 py-1 rounded whitespace-nowrap z-50">
            Saved prompts
          </div>
        )}
      </div>

      {/* Drafts button */}
      <div className="relative">
        <button
          onClick={() => onViewChange("drafts")}
          onMouseEnter={() => setHoveredButton("drafts")}
          onMouseLeave={() => setHoveredButton(null)}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
            activeView === "drafts" ? "bg-accent" : "hover:bg-accent"
          }`}
          title="Drafts"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </button>
        {hoveredButton === "drafts" && (
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-foreground text-background text-xs px-2 py-1 rounded whitespace-nowrap z-50">
            Drafts
          </div>
        )}
      </div>
    </div>
  );
}
