interface TiptapNode {
  type?: string;
  text?: string;
  content?: TiptapNode[];
}

/** Recorre el árbol JSON de Tiptap y concatena todo el texto plano. */
export function extractPlainText(content: unknown): string {
  if (!content || typeof content !== "object") return "";
  const node = content as TiptapNode;
  let text = node.text ?? "";
  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      const childText = extractPlainText(child);
      if (childText) text += (text ? " " : "") + childText;
    }
  }
  return text.trim();
}

export function snippet(content: unknown, maxLength = 140): string {
  const text = extractPlainText(content);
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}
