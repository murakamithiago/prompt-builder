import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { generateId, type SavedPrompt } from "@/lib/storage";
import { useAuth } from "@/components/auth/AuthProvider";

interface TopBarProps {
  promptTitle: string;
  onTitleChange: (title: string) => void;
  onSave: (prompt: SavedPrompt) => void;
  onCopy: () => void;
  getEditorContent: () => string;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  allTags: string[];
  onLoginClick: () => void;
}

export function TopBar({
  promptTitle,
  onTitleChange,
  onSave,
  onCopy,
  getEditorContent,
  sidebarCollapsed,
  onToggleSidebar,
  allTags,
  onLoginClick,
}: TopBarProps) {
  const { user, signOut } = useAuth();
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tagMenuOpen, setTagMenuOpen] = useState(false);
  const [loginPrompt, setLoginPrompt] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const tagMenuRef = useRef<HTMLDivElement>(null);

  // Close tag menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        tagMenuRef.current &&
        !tagMenuRef.current.contains(e.target as Node) &&
        tagInputRef.current &&
        !tagInputRef.current.contains(e.target as Node)
      ) {
        setTagMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleOpenSave() {
    // If not logged in, show login prompt instead
    if (!user) {
      setLoginPrompt(true);
      return;
    }
    setSaveName(promptTitle || "New prompt");
    setTags([]);
    setTagInput("");
    setTagMenuOpen(false);
  }

  function handleAddTag(tag: string) {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput("");
    setTagMenuOpen(false);
  }

  function handleRemoveTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  function handleTagKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = tagInput.trim();
      if (trimmed) {
        handleAddTag(trimmed);
      }
    }
    if (e.key === "Escape") {
      setTagInput("");
      setTagMenuOpen(false);
    }
  }

  // Filter existing tags: exclude already selected ones, and filter by input text
  const availableTags = allTags.filter(
    (t) => !tags.includes(t) && t.toLowerCase().includes(tagInput.toLowerCase())
  );

  // Show "Create" option if input doesn't exactly match an existing tag
  const showCreateOption =
    tagInput.trim().length > 0 &&
    !allTags.some((t) => t.toLowerCase() === tagInput.trim().toLowerCase());

  function handleSavePrompt() {
    const content = getEditorContent();
    if (!saveName.trim() || !content.trim()) return;

    onSave({
      id: generateId(),
      title: saveName.trim(),
      content: content.trim(),
      tags,
      createdAt: Date.now(),
    });

    setSaveOpen(false);
    setSaveName("");
    setTags([]);
  }

  async function handleLogout() {
    await signOut();
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background">
      {/* Left side: collapse button + title */}
      <div className="flex items-center gap-3">
        {/* Collapse/Expand sidebar button */}
        <button
          onClick={onToggleSidebar}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-foreground"
          >
            {sidebarCollapsed ? (
              <>
                <polyline points="13 17 18 12 13 7" />
                <polyline points="6 17 11 12 6 7" />
              </>
            ) : (
              <>
                <polyline points="11 17 6 12 11 7" />
                <polyline points="18 17 13 12 18 7" />
              </>
            )}
          </svg>
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-border" />

        {/* Editable title */}
        <input
          type="text"
          value={promptTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          className="text-lg font-semibold bg-transparent border-none outline-none focus:outline-none p-0 m-0"
          placeholder="New prompt"
          style={{ boxShadow: "none" }}
        />
      </div>

      {/* Right side: Save + Copy + Auth */}
      <div className="flex items-center gap-2">
        {/* Save button */}
        <Popover open={saveOpen} onOpenChange={(open) => {
          if (open) {
            handleOpenSave();
            // Only open the popover if user is logged in
            if (user) setSaveOpen(true);
          } else {
            setSaveOpen(false);
          }
        }}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="rounded-lg px-5">
              Save
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-4">
            <div className="space-y-4">
              <h3 className="text-base font-semibold">Save a new prompt</h3>

              {/* Name field */}
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium shrink-0 w-12">Name</label>
                <Input
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="New prompt"
                />
              </div>

              {/* Tags field */}
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium shrink-0 w-12">Tag</label>
                  <div className="relative flex-1">
                    <div className="relative">
                      <Input
                        ref={tagInputRef}
                        value={tagInput}
                        onChange={(e) => {
                          setTagInput(e.target.value);
                          setTagMenuOpen(true);
                        }}
                        onFocus={() => setTagMenuOpen(true)}
                        onKeyDown={handleTagKeyDown}
                        placeholder="Search or create tag..."
                        className="h-9 text-sm pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (tagInput.trim()) handleAddTag(tagInput.trim());
                        }}
                        className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                      >
                        +
                      </button>
                    </div>

                    {/* Tag dropdown menu */}
                    {tagMenuOpen && (availableTags.length > 0 || showCreateOption) && (
                      <div
                        ref={tagMenuRef}
                        className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-md z-50 py-2 px-2"
                      >
                        {availableTags.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground px-1">Select a tag or create one</p>
                            <div className="flex flex-wrap gap-1.5">
                              {availableTags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className="rounded-full px-3 py-1 text-xs cursor-pointer hover:bg-accent"
                                  onClick={() => handleAddTag(tag)}
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {showCreateOption && (
                          <div
                            className={`flex items-center gap-2 ${availableTags.length > 0 ? "mt-2 pt-2 border-t border-border" : ""}`}
                          >
                            <span className="text-xs text-muted-foreground">Create</span>
                            <Badge
                              variant="default"
                              className="rounded-full px-3 py-1 text-xs cursor-pointer"
                              onClick={() => handleAddTag(tagInput.trim())}
                            >
                              {tagInput.trim()}
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected tags - full width below */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="default"
                        className="rounded-full px-3 py-1 text-xs cursor-pointer hover:opacity-80"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Save button */}
              <Button
                className="w-full rounded-lg"
                onClick={handleSavePrompt}
                disabled={!saveName.trim()}
              >
                Save prompt
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Button className="rounded-lg px-5 gap-2" onClick={onCopy}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Copy Prompt
        </Button>

        {/* Divider */}
        <div className="w-px h-6 bg-border" />

        {/* Auth section */}
        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground truncate max-w-[150px]">
              {user.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-lg text-xs"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            className="rounded-lg px-4 text-xs"
            onClick={onLoginClick}
          >
            Login / Sign Up
          </Button>
        )}
      </div>

      {/* Login prompt popover for unauthenticated save attempts */}
      {loginPrompt && !user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm space-y-4 shadow-lg">
            <h3 className="text-base font-semibold">Login required</h3>
            <p className="text-sm text-muted-foreground">
              You need to be logged in to save prompts. Your prompts will be securely stored in the cloud.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                className="rounded-lg"
                onClick={() => setLoginPrompt(false)}
              >
                Cancel
              </Button>
              <Button
                className="rounded-lg"
                onClick={() => {
                  setLoginPrompt(false);
                  onLoginClick();
                }}
              >
                Login / Sign Up
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
