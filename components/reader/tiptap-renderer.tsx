import type { ReactNode } from "react";

type TiptapMark = {
    type: string;
    attrs?: Record<string, unknown>;
};

type TiptapNode = {
    type?: string;
    text?: string;
    attrs?: Record<string, unknown>;
    marks?: TiptapMark[];
    content?: TiptapNode[];
};

type TiptapDocument = {
    type?: string;
    content?: TiptapNode[];
};

function renderText(node: TiptapNode, key: string): ReactNode {
    let output: ReactNode = node.text ?? "";

    for (const mark of node.marks ?? []) {
        if (mark.type === "bold") output = <strong key={`${key}-bold`}>{output}</strong>;
        if (mark.type === "italic") output = <em key={`${key}-italic`}>{output}</em>;
        if (mark.type === "strike") output = <del key={`${key}-strike`}>{output}</del>;
        if (mark.type === "underline") output = <u key={`${key}-underline`}>{output}</u>;
        if (mark.type === "code") output = <code key={`${key}-code`} className="rounded bg-muted px-1.5 py-0.5 text-[0.9em]">{output}</code>;
        if (mark.type === "link") {
            const href = typeof mark.attrs?.href === "string" && mark.attrs.href.startsWith("/")
                ? mark.attrs.href
                : undefined;
            output = href ? <a key={`${key}-link`} href={href} className="underline underline-offset-4">{output}</a> : output;
        }
    }

    return <span key={key}>{output}</span>;
}

function renderNodes(nodes: TiptapNode[] = [], prefix = "node"): ReactNode[] {
    return nodes.map((node, index) => renderNode(node, `${prefix}-${index}`));
}

function renderNode(node: TiptapNode, key: string): ReactNode {
    const children = renderNodes(node.content, key);

    switch (node.type) {
        case "text":
            return renderText(node, key);
        case "paragraph":
            return <p key={key}>{children}</p>;
        case "heading": {
            const level = typeof node.attrs?.level === "number" ? node.attrs.level : 2;
            if (level === 1) return <h1 key={key}>{children}</h1>;
            if (level === 3) return <h3 key={key}>{children}</h3>;
            if (level >= 4) return <h4 key={key}>{children}</h4>;
            return <h2 key={key}>{children}</h2>;
        }
        case "blockquote":
            return <blockquote key={key}>{children}</blockquote>;
        case "bulletList":
            return <ul key={key}>{children}</ul>;
        case "orderedList":
            return <ol key={key}>{children}</ol>;
        case "listItem":
            return <li key={key}>{children}</li>;
        case "codeBlock":
            return <pre key={key}><code>{node.content?.map((child) => child.text ?? "").join("")}</code></pre>;
        case "horizontalRule":
            return <hr key={key} />;
        case "hardBreak":
            return <br key={key} />;
        case "image": {
            const src = typeof node.attrs?.src === "string" ? node.attrs.src : "";
            if (!src) return null;
            const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : "";
            return <img key={key} src={src} alt={alt} loading="lazy" />;
        }
        default:
            return <>{children}</>;
    }
}

export function TiptapRenderer({ content }: { content: Record<string, unknown> }) {
    const document = content as TiptapDocument;
    return <div className="reader-content">{renderNodes(document.content)}</div>;
}
