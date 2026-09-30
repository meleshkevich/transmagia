const BLOCKED_KEYS = new Set(["c", "x", "a", "s", "p", "u"]);

/** Returns true when the event target is a descendant of the protected element. */
export function isInsideProtected(target: EventTarget | null, el: Element | null): boolean {
    if (!el || !target) return false;
    if (!(target instanceof Node)) return false;
    return el.contains(target);
}

/** Returns true when the current text selection's anchor is inside the protected element. */
export function isSelectionInsideProtected(selection: Selection | null, el: Element | null): boolean {
    if (!el || !selection || selection.isCollapsed) return false;
    const anchor = selection.anchorNode;
    if (!anchor) return false;
    return el.contains(anchor);
}

/** Returns true for keys that should be blocked when a Ctrl/Cmd modifier is active. */
export function shouldBlockKey(key: string): boolean {
    return BLOCKED_KEYS.has(key.toLowerCase());
}
