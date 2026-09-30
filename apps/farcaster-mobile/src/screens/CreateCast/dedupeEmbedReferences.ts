function normalizeEmbedReferenceForDedupe(embedReference: string): string {
  const trimmed = embedReference.trim();
  try {
    const url = new URL(trimmed);
    if (url.pathname.endsWith('/') && url.pathname.length > 1) {
      url.pathname = url.pathname.slice(0, -1);
    }
    return url.href;
  } catch {
    return trimmed;
  }
}

function dedupeEmbedReferences(embedReferences: string[]): string[] {
  const dedupedByNormalizedUrl = new Map<string, string>();

  for (const embedReference of embedReferences) {
    const trimmedEmbedReference = embedReference.trim();
    const dedupeKey = normalizeEmbedReferenceForDedupe(embedReference);
    if (!dedupedByNormalizedUrl.has(dedupeKey)) {
      dedupedByNormalizedUrl.set(dedupeKey, trimmedEmbedReference);
    }
  }

  return Array.from(dedupedByNormalizedUrl.values());
}

export { dedupeEmbedReferences };
