import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

export type SidebarView = "prompts" | "drafts";

interface IconSidebarProps {
  activeView: SidebarView;
  onViewChange: (view: SidebarView) => void;
  onNewPrompt: () => void;
  onLoginClick: () => void;
}

export function IconSidebar({ activeView, onViewChange, onNewPrompt, onLoginClick }: IconSidebarProps) {
  const { user, signOut } = useAuth();
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-12 bg-background border-r border-border flex flex-col items-center py-3 gap-2">
      {/* App logo */}
      <button
        className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center mb-2"
        title="Prompt Builder"
      >
        <img src="/logo.png" alt="Prompt Builder" className="w-9 h-9 object-cover" />
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

      {/* Spacer to push settings to bottom */}
      <div className="flex-1" />

      {/* Settings / Account button */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          onMouseEnter={() => setHoveredButton("settings")}
          onMouseLeave={() => setHoveredButton(null)}
          className="w-9 h-9 rounded-lg hover:bg-accent flex items-center justify-center transition-colors"
          title="Settings"
        >
          {user ? (
            <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
              {user.email?.charAt(0).toUpperCase()}
            </div>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )}
        </button>
        {hoveredButton === "settings" && !menuOpen && (
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-foreground text-background text-xs px-2 py-1 rounded whitespace-nowrap z-50">
            {user ? user.email : "Settings"}
          </div>
        )}

        {/* Overflow menu */}
        {menuOpen && (
          <div className="absolute left-full ml-2 bottom-0 bg-popover border border-border rounded-lg shadow-lg z-50 py-1 min-w-[160px]">
            {user ? (
              <>
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    signOut();
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onLoginClick();
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
              >
                Login / Sign Up
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
