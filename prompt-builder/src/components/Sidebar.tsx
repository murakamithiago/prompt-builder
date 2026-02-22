import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PromptCard } from "./PromptCard";
import type { SavedPrompt } from "@/lib/storage";

interface SidebarProps {
  prompts: SavedPrompt[];
  onSave: (prompt: SavedPrompt) => void;
  onUpdate: (id: string, updates: Partial<SavedPrompt>) => void;
  onDelete: (id: string) => void;
  onReorder: (prompts: SavedPrompt[]) => void;
}

export function Sidebar({ prompts, onSave: _onSave, onUpdate, onDelete, onReorder }: SidebarProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<SavedPrompt | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editTagInput, setEditTagInput] = useState("");
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<"above" | "below" | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Get all unique tags across prompts
  const allTags = Array.from(
    new Set(prompts.flatMap((p) => p.tags || []))
  );

  // Filter prompts by search and active tag
  const filteredPrompts = prompts.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase());
    const matchesTag = activeTag
      ? p.tags && p.tags.includes(activeTag)
      : true;
    return matchesSearch && matchesTag;
  });

  function handleEdit(prompt: SavedPrompt) {
    setEditingPrompt(prompt);
    setTitle(prompt.title);
    setContent(prompt.content);
    setEditTags(prompt.tags || []);
    setEditDialogOpen(true);
  }

  function handleSaveEdit() {
    if (!editingPrompt || !title.trim() || !content.trim()) return;
    onUpdate(editingPrompt.id, {
      title: title.trim(),
      content: content.trim(),
      tags: editTags,
    });
    handleCloseEdit();
  }

  function handleCloseEdit() {
    setTitle("");
    setContent("");
    setEditTags([]);
    setEditTagInput("");
    setEditingPrompt(null);
    setEditDialogOpen(false);
  }

  function handleAddEditTag() {
    const trimmed = editTagInput.trim();
    if (trimmed && !editTags.includes(trimmed)) {
      setEditTags([...editTags, trimmed]);
    }
    setEditTagInput("");
  }

  // Reorder drag handlers
  const isFiltering = search.length > 0 || activeTag !== null;

  const handleReorderDragOver = useCallback((e: React.DragEvent, promptId: string) => {
    // Only handle sidebar reorder drags
    if (!e.dataTransfer.types.includes("application/x-sidebar-reorder")) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position = e.clientY < midY ? "above" : "below";

    setDragOverId(promptId);
    setDragOverPosition(position);
  }, []);

  const handleReorderDrop = useCallback((e: React.DragEvent, targetId: string) => {
    if (!e.dataTransfer.types.includes("application/x-sidebar-reorder")) return;
    e.preventDefault();
    e.stopPropagation();

    const sourceId = e.dataTransfer.getData("application/x-sidebar-reorder");
    if (!sourceId || sourceId === targetId) {
      setDragOverId(null);
      setDragOverPosition(null);
      setDraggingId(null);
      return;
    }

    const newPrompts = [...prompts];
    const sourceIndex = newPrompts.findIndex((p) => p.id === sourceId);
    const targetIndex = newPrompts.findIndex((p) => p.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const [moved] = newPrompts.splice(sourceIndex, 1);
    const insertIndex = dragOverPosition === "above" ? targetIndex : targetIndex + 1;
    // Adjust for removal shifting indices
    const adjustedIndex = sourceIndex < targetIndex ? insertIndex - 1 : insertIndex;
    newPrompts.splice(adjustedIndex, 0, moved);

    onReorder(newPrompts);
    setDragOverId(null);
    setDragOverPosition(null);
    setDraggingId(null);
  }, [prompts, dragOverPosition, onReorder]);

  return (
    <div className="w-72 border-r border-border flex flex-col h-full bg-card">
      {/* Header */}
      <div className="p-4 pt-3">
        <h2 className="text-sm font-semibold mb-3">Saved prompts</h2>
        <Input
          placeholder="Type to search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-xs"
        />

        {/* Tag filters */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            <Badge
              variant={activeTag === null ? "default" : "outline"}
              className="rounded-full px-2.5 py-0.5 text-[10px] cursor-pointer"
              onClick={() => setActiveTag(null)}
            >
              All
            </Badge>
            {allTags.map((tag) => (
              <Badge
                key={tag}
                variant={activeTag === tag ? "default" : "outline"}
                className="rounded-full px-2.5 py-0.5 text-[10px] cursor-pointer"
                onClick={() =>
                  setActiveTag(activeTag === tag ? null : tag)
                }
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Prompt List */}
      <ScrollArea className="flex-1 min-h-0 overflow-auto">
        <div className="p-3 space-y-2 overflow-auto">
          {filteredPrompts.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              {search || activeTag
                ? "No prompts found"
                : "No saved prompts yet. Use the Save button in the top bar to create one."}
            </p>
          ) : (
            filteredPrompts.map((prompt) => (
              <div
                key={prompt.id}
                onDragOver={(e) => handleReorderDragOver(e, prompt.id)}
                onDragLeave={() => {
                  setDragOverId(null);
                  setDragOverPosition(null);
                }}
                onDrop={(e) => handleReorderDrop(e, prompt.id)}
                className="relative"
              >
                {dragOverId === prompt.id && dragOverPosition === "above" && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary rounded-full -translate-y-0.5 z-10" />
                )}
                <PromptCard
                  prompt={prompt}
                  onDelete={onDelete}
                  onEdit={handleEdit}
                  onDragStartReorder={!isFiltering ? (id: string) => setDraggingId(id) : undefined}
                  onDragEndReorder={() => {
                    setDraggingId(null);
                    setDragOverId(null);
                    setDragOverPosition(null);
                  }}
                  isDraggingReorder={draggingId === prompt.id}
                  disableReorder={isFiltering}
                />
                {dragOverId === prompt.id && dragOverPosition === "below" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full translate-y-0.5 z-10" />
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <Separator />
      <div className="p-3">
        <p className="text-[10px] text-muted-foreground text-center">
          {prompts.length} prompt{prompts.length !== 1 ? "s" : ""} saved
        </p>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => !open && handleCloseEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Prompt</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Content</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Tags</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {editTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="default"
                    className="rounded-full px-2.5 py-0.5 text-xs cursor-pointer"
                    onClick={() => setEditTags(editTags.filter((t) => t !== tag))}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={editTagInput}
                  onChange={(e) => setEditTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddEditTag();
                    }
                  }}
                  placeholder="Add tag..."
                  className="h-8 text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={handleAddEditTag}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseEdit}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={!title.trim() || !content.trim()}>
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
