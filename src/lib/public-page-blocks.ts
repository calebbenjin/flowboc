export const FIXED_BLOCK_TOKENS = ["VIDEO_CALL", "EBOOK", "CLASSES"] as const;
export type FixedBlockToken = (typeof FIXED_BLOCK_TOKENS)[number];

export function linkToken(id: string): string {
  return `LINK:${id}`;
}

export function linkIdFromToken(token: string): string | null {
  return token.startsWith("LINK:") ? token.slice(5) : null;
}

// Drops stored tokens no longer "available" (e.g. a deleted link) and
// appends any available token missing from storage (a brand-new link, an
// offer never reordered before, or an empty array on first use) to the
// end — same function used by the dashboard (available = every link,
// active or not, so a deactivated link keeps its slot) and the public page
// (available = only active links, so an inactive one is simply absent from
// this render without losing its stored position for later).
export function resolveBlockOrder(stored: string[], linkIds: string[]): string[] {
  const available = [...FIXED_BLOCK_TOKENS, ...linkIds.map(linkToken)];
  const availableSet = new Set(available);

  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const token of stored) {
    if (availableSet.has(token) && !seen.has(token)) {
      ordered.push(token);
      seen.add(token);
    }
  }
  for (const token of available) {
    if (!seen.has(token)) ordered.push(token);
  }
  return ordered;
}
