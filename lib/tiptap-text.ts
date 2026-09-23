type TiptapNode = {
    type?: string;
    text?: string;
    content?: TiptapNode[];
};

const BLOCK_TYPES = new Set(["paragraph", "heading", "blockquote", "listItem", "codeBlock"]);

function visitNode(node: TiptapNode): string {
    if (node.type === "hardBreak") return " ";
    if (typeof node.text === "string") return node.text;
    if (!Array.isArray(node.content)) return "";
    const inner = node.content.map(visitNode).join("");
    return BLOCK_TYPES.has(node.type ?? "") ? inner + " " : inner;
}

/**
 * Extract normalized plain text from a Tiptap JSON document.
 * Block nodes contribute a trailing space so adjacent paragraphs don't run together.
 * Whitespace is collapsed before returning.
 */
export function extractTiptapText(doc: Record<string, unknown>): string {
    return visitNode(doc as TiptapNode)
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Truncate plain text to at most `limit` characters.
 * Backs up to the last word boundary where practical and appends "…".
 * Returns the original string unchanged if it is already within the limit.
 */
export function truncateDescription(text: string, limit: number): string {
    if (text.length <= limit) return text;
    const cut = text.slice(0, limit);
    const lastSpace = cut.lastIndexOf(" ");
    const trimmed = lastSpace > 0 ? cut.slice(0, lastSpace) : cut;
    return trimmed.trimEnd() + "…";
}
