import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { ChatHistoryItem } from "@/lib/storage";

interface DraftsProps {
  drafts: ChatHistoryItem[];
  currentDraftId: string | null;
  onSelectDraft: (draft: ChatHistoryItem) => void;
  onDeleteDraft: (id: string) => void;
}

export function Drafts({ drafts, currentDraftId, onSelectDraft, onDeleteDraft }: DraftsProps) {
  const [search, setSearch] = useState("");

  const filteredDrafts = drafts.filter((draft) =>
    draft.title.toLowerCase().includes(search.toLowerCase())
  );

  function formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return "Today";
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  }

  return (
    <div className="w-72 border-r border-border flex flex-col h-full bg-card">
      {/* Header */}
      <div className="p-4 pt-3">
        <h2 className="text-sm font-semibold mb-3">Drafts</h2>
        <Input
          placeholder="Type to search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-xs"
        />
      </div>

      <Separator />

      {/* Drafts List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          {filteredDrafts.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              {search ? "No drafts found" : "No drafts yet. Your work will be saved here automatically."}
            </p>
          ) : (
            filteredDrafts.map((draft) => (
              <div
                key={draft.id}
                className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                  currentDraftId === draft.id
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-accent border border-transparent"
                }`}
                onClick={() => onSelectDraft(draft)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {draft.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatDate(draft.updatedAt)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDraft(draft.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 transition-all"
                    title="Delete draft"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground hover:text-destructive">
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <Separator />
      <div className="p-3">
        <p className="text-[10px] text-muted-foreground text-center">
          {drafts.length} draft{drafts.length !== 1 ? "s" : ""} saved
        </p>
      </div>
    </div>
  );
}
