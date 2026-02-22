// Re-export types for backward compatibility
export type {
  TextBlock,
  PromptBlockData,
  EditorBlock,
} from "./tiptap/utils/serialization";

// Re-export EditorHandle from TipTapEditor
export type { EditorHandle } from "./tiptap/TipTapEditor";

// Re-export TipTapEditor as Editor
export { TipTapEditor as Editor } from "./tiptap/TipTapEditor";
