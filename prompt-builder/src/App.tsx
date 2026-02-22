import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";
import { TopBar } from "@/components/TopBar";
import { Sidebar } from "@/components/Sidebar";
import { Drafts } from "@/components/Drafts";
import { IconSidebar, type SidebarView } from "@/components/IconSidebar";
import { Editor, EditorHandle } from "@/components/Editor";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  generateId,
  getChatHistory,
  saveChatToHistory,
  deleteChatFromHistory,
  type SavedPrompt,
  type ChatHistoryItem,
} from "@/lib/storage";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import "./App.css";

function App() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [activePrompt, setActivePrompt] = useState<SavedPrompt | null>(null);
  const [promptTitle, setPromptTitle] = useState("New prompt");
  const [copied, setCopied] = useState(false);
  const editorRef = useRef<EditorHandle>(null);

  // Sidebar state
  const [sidebarView, setSidebarView] = useState<SidebarView>("prompts");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Drafts state
  const [drafts, setDrafts] = useState<ChatHistoryItem[]>([]);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);

  // Edit prompt dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<SavedPrompt | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editTagInput, setEditTagInput] = useState("");

  // Fetch prompts from Supabase when user changes
  const fetchPrompts = useCallback(async () => {
    if (!user) {
      setPrompts([]);
      return;
    }
    const { data, error } = await supabase
      .from("prompts")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPrompts(
        data.map((p) => ({
          id: p.id,
          title: p.title,
          content: p.content,
          tags: p.tags || [],
          createdAt: new Date(p.created_at).getTime(),
        }))
      );
    }
  }, [user]);

  // Load prompts on mount and when user changes
  useEffect(() => {
    fetchPrompts();
    setDrafts(getChatHistory());
  }, [fetchPrompts]);

  // Auto-save current draft before switching
  const saveCurrentDraft = useCallback(() => {
    if (!editorRef.current) return null;

    // Check if there's any actual content
    if (!editorRef.current.hasContent()) return null;

    const draftId = currentDraftId || generateId();
    const existingDraft = getChatHistory().find(h => h.id === draftId);

    const draft: ChatHistoryItem = {
      id: draftId,
      title: promptTitle || "Untitled",
      content: JSON.stringify(editorRef.current.getJSON()),
      createdAt: existingDraft?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    saveChatToHistory(draft);
    setDrafts(getChatHistory());
    return draftId;
  }, [currentDraftId, promptTitle]);

  const handleNewPrompt = useCallback(() => {
    // Save current draft if it has content
    saveCurrentDraft();

    // Clear editor and reset state
    if (editorRef.current) {
      editorRef.current.clear();
    }
    setPromptTitle("New prompt");
    setCurrentDraftId(null);
  }, [saveCurrentDraft]);

  const handleSelectDraft = useCallback((draft: ChatHistoryItem) => {
    // Save current draft first
    saveCurrentDraft();

    // Load selected draft
    setPromptTitle(draft.title);
    setCurrentDraftId(draft.id);

    // Load content into editor
    if (editorRef.current) {
      try {
        const json = JSON.parse(draft.content);
        editorRef.current.setContent(json);
      } catch {
        editorRef.current.clear();
      }
    }
  }, [saveCurrentDraft]);

  const handleDeleteDraft = useCallback((id: string) => {
    deleteChatFromHistory(id);
    setDrafts(getChatHistory());
    if (currentDraftId === id) {
      setCurrentDraftId(null);
      setPromptTitle("New prompt");
      if (editorRef.current) {
        editorRef.current.clear();
      }
    }
  }, [currentDraftId]);

  const handleSavePrompt = useCallback(async (prompt: SavedPrompt) => {
    if (!user) return;
    const { error } = await supabase.from("prompts").insert({
      user_id: user.id,
      title: prompt.title,
      content: prompt.content,
      tags: prompt.tags,
    });
    if (!error) {
      await fetchPrompts();
    }
  }, [user, fetchPrompts]);

  const handleUpdatePrompt = useCallback(async (id: string, updates: Partial<SavedPrompt>) => {
    if (!user) return;
    const { error } = await supabase
      .from("prompts")
      .update({
        title: updates.title,
        content: updates.content,
        tags: updates.tags,
      })
      .eq("id", id);
    if (!error) {
      await fetchPrompts();
    }
  }, [user, fetchPrompts]);

  const handleDeletePrompt = useCallback(async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from("prompts").delete().eq("id", id);
    if (!error) {
      await fetchPrompts();
    }
  }, [user, fetchPrompts]);

  const handleReorderPrompts = useCallback(async (reordered: SavedPrompt[]) => {
    // Update local state immediately for responsiveness
    setPrompts(reordered);
    // Note: Supabase doesn't have an order column yet, so reorder is local-only for now
  }, []);

  // Edit prompt from editor block or sidebar
  function handleEditPrompt(prompt: SavedPrompt) {
    setEditingPrompt(prompt);
    setEditTitle(prompt.title);
    setEditContent(prompt.content);
    setEditTags(prompt.tags || []);
    setEditTagInput("");
    setEditDialogOpen(true);
  }

  function handleSaveEdit() {
    if (!editingPrompt || !editTitle.trim() || !editContent.trim()) return;
    handleUpdatePrompt(editingPrompt.id, {
      title: editTitle.trim(),
      content: editContent.trim(),
      tags: editTags,
    });
    handleCloseEdit();
  }

  function handleCloseEdit() {
    setEditTitle("");
    setEditContent("");
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

  function handleDragStart(event: DragStartEvent) {
    const prompt = event.active.data.current?.prompt as SavedPrompt;
    if (prompt) {
      setActivePrompt(prompt);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { over, active } = event;
    setActivePrompt(null);

    if (!over) return;

    // Handle dropping from sidebar to editor
    if (over.id === "editor-drop-zone") {
      const prompt = active.data.current?.prompt as SavedPrompt;
      if (prompt && editorRef.current) {
        editorRef.current.insertPromptAtEnd(prompt);
      }
      return;
    }

    // Handle reordering within editor
    if (active.id !== over.id && editorRef.current) {
      editorRef.current.moveBlock(String(active.id), String(over.id));
    }
  }

  function handleCopy() {
    if (!editorRef.current) return;
    const text = editorRef.current.getPlainText();
    if (text) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  function getEditorContent(): string {
    return editorRef.current?.getPlainText() || "";
  }

  function handleLoginClick() {
    navigate("/login");
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
        {/* Icon Sidebar */}
        <IconSidebar
          activeView={sidebarView}
          onViewChange={setSidebarView}
          onNewPrompt={handleNewPrompt}
        />

        {/* Content Sidebar (Prompts or History) */}
        {!sidebarCollapsed && (
          sidebarView === "prompts" ? (
            <Sidebar
              prompts={prompts}
              onSave={handleSavePrompt}
              onUpdate={handleUpdatePrompt}
              onDelete={handleDeletePrompt}
              onReorder={handleReorderPrompts}
            />
          ) : (
            <Drafts
              drafts={drafts}
              currentDraftId={currentDraftId}
              onSelectDraft={handleSelectDraft}
              onDeleteDraft={handleDeleteDraft}
            />
          )
        )}

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Top Bar */}
          <TopBar
            promptTitle={promptTitle}
            onTitleChange={setPromptTitle}
            onSave={handleSavePrompt}
            onCopy={handleCopy}
            getEditorContent={getEditorContent}
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
            allTags={Array.from(new Set(prompts.flatMap((p) => p.tags || [])))}
            onLoginClick={handleLoginClick}
          />

          {/* Editor */}
          <Editor ref={editorRef} onEditPrompt={handleEditPrompt} />
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activePrompt ? (
            <Card className="p-3 w-64 shadow-lg border-primary/30 bg-card">
              <p className="text-sm font-medium">{activePrompt.title}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {activePrompt.content}
              </p>
            </Card>
          ) : null}
        </DragOverlay>

        {/* Copied Toast */}
        {copied && (
          <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm shadow-lg animate-in fade-in slide-in-from-bottom-2">
            Prompt copied to clipboard!
          </div>
        )}

        {/* Edit Prompt Dialog (shared between editor blocks and sidebar) */}
        <Dialog open={editDialogOpen} onOpenChange={(open) => !open && handleCloseEdit()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Prompt</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium mb-1 block">Title</label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Content</label>
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
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
              <Button onClick={handleSaveEdit} disabled={!editTitle.trim() || !editContent.trim()}>
                Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DndContext>
  );
}

export default App;
