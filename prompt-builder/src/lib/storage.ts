export interface SavedPrompt {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
}

const STORAGE_KEY = "prompt-builder-saved-prompts";
const TAGS_KEY = "prompt-builder-tags";

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// --- Prompts ---

export function getSavedPrompts(): SavedPrompt[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function savePrompt(prompt: SavedPrompt): void {
  const prompts = getSavedPrompts();
  prompts.push(prompt);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));

  // Also save any new tags
  const allTags = getAllTags();
  prompt.tags.forEach((tag) => {
    if (!allTags.includes(tag)) {
      allTags.push(tag);
    }
  });
  localStorage.setItem(TAGS_KEY, JSON.stringify(allTags));
}

export function updatePrompt(id: string, updates: Partial<SavedPrompt>): void {
  const prompts = getSavedPrompts();
  const index = prompts.findIndex((p) => p.id === id);
  if (index !== -1) {
    prompts[index] = { ...prompts[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
  }
}

export function deletePrompt(id: string): void {
  const prompts = getSavedPrompts().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
}

export function reorderPrompts(prompts: SavedPrompt[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
}

// --- Tags ---

export function getAllTags(): string[] {
  try {
    const data = localStorage.getItem(TAGS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addTag(tag: string): void {
  const tags = getAllTags();
  if (!tags.includes(tag)) {
    tags.push(tag);
    localStorage.setItem(TAGS_KEY, JSON.stringify(tags));
  }
}

// --- Chat History ---

export interface ChatHistoryItem {
  id: string;
  title: string;
  content: string; // TipTap JSON string
  createdAt: number;
  updatedAt: number;
}

const CHAT_HISTORY_KEY = "prompt-builder-chat-history";

export function getChatHistory(): ChatHistoryItem[] {
  try {
    const data = localStorage.getItem(CHAT_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveChatToHistory(chat: ChatHistoryItem): void {
  const history = getChatHistory();
  // Check if chat already exists (update it)
  const existingIndex = history.findIndex((h) => h.id === chat.id);
  if (existingIndex !== -1) {
    history[existingIndex] = { ...history[existingIndex], ...chat, updatedAt: Date.now() };
  } else {
    history.unshift(chat); // Add to beginning
  }
  // Keep only last 50 chats
  const trimmed = history.slice(0, 50);
  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(trimmed));
}

export function deleteChatFromHistory(id: string): void {
  const history = getChatHistory().filter((h) => h.id !== id);
  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
}

export function getChatById(id: string): ChatHistoryItem | undefined {
  return getChatHistory().find((h) => h.id === id);
}
