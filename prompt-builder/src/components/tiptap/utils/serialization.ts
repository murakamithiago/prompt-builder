import type { JSONContent } from "@tiptap/core";
import { generateId, type SavedPrompt } from "@/lib/storage";

// Block types matching the original Editor.tsx
export interface TextBlock {
  id: string;
  type: "text";
  content: string;
}

export interface PromptBlockData {
  id: string;
  type: "prompt";
  prompt: SavedPrompt;
}

export type EditorBlock = TextBlock | PromptBlockData;

/**
 * Convert EditorBlock[] to TipTap JSON document
 */
export function editorBlocksToTipTapJSON(blocks: EditorBlock[]): JSONContent {
  const content: JSONContent[] = [];

  for (const block of blocks) {
    if (block.type === "text") {
      // Split text content by newlines into paragraphs
      const lines = block.content.split("\n");
      for (const line of lines) {
        content.push({
          type: "paragraph",
          content: line ? [{ type: "text", text: line }] : [],
        });
      }
    } else if (block.type === "prompt") {
      content.push({
        type: "promptBlock",
        attrs: {
          id: block.id,
          promptId: block.prompt.id,
          title: block.prompt.title,
          content: block.prompt.content,
          tags: block.prompt.tags,
          createdAt: block.prompt.createdAt,
        },
      });
    }
  }

  // Ensure at least one paragraph
  if (content.length === 0) {
    content.push({ type: "paragraph" });
  }

  return { type: "doc", content };
}

/**
 * Convert TipTap JSON document to EditorBlock[]
 */
export function tipTapJSONToEditorBlocks(json: JSONContent): EditorBlock[] {
  const blocks: EditorBlock[] = [];
  let currentTextContent = "";
  let currentTextId = generateId();

  const flushTextBlock = () => {
    // Always create a text block if we have content, or if it's the first block
    if (currentTextContent || blocks.length === 0) {
      blocks.push({
        id: currentTextId,
        type: "text",
        content: currentTextContent,
      });
    }
    currentTextContent = "";
    currentTextId = generateId();
  };

  for (const node of json.content || []) {
    if (node.type === "paragraph") {
      // Extract text from paragraph
      const text =
        node.content?.map((c: JSONContent) => c.text || "").join("") || "";
      if (currentTextContent) {
        currentTextContent += "\n" + text;
      } else {
        currentTextContent = text;
      }
    } else if (node.type === "promptBlock") {
      flushTextBlock();
      blocks.push({
        id: node.attrs?.id || generateId(),
        type: "prompt",
        prompt: {
          id: node.attrs?.promptId,
          title: node.attrs?.title,
          content: node.attrs?.content,
          tags: node.attrs?.tags || [],
          createdAt: node.attrs?.createdAt || 0,
        },
      });
      currentTextId = generateId(); // New text block after prompt
    }
  }

  flushTextBlock();
  return blocks;
}

/**
 * Extract plain text from TipTap JSON, including prompt content
 */
export function getPlainTextFromJSON(json: JSONContent): string {
  const parts: string[] = [];

  for (const node of json.content || []) {
    if (node.type === "paragraph") {
      const text =
        node.content?.map((c: JSONContent) => c.text || "").join("") || "";
      if (text) {
        parts.push(text);
      }
    } else if (node.type === "promptBlock") {
      // Include prompt content in plain text
      if (node.attrs?.content) {
        parts.push(node.attrs.content);
      }
    }
  }

  return parts.join("\n\n");
}
