import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  type CastComposerEmbed,
  mergeCandidateUrls,
  normalizeComposerEmbedUrl,
} from './castComposerEmbedHelpers';
import type { CastComposerEmbedsReturn } from './useCastComposerEmbeds';

/**
 * Owns the per-mount candidate-merge / dismissal / sync-effect plumbing that
 * web and mobile `QueuedCast` components both used to carry inline. The hook:
 *
 *  - Tracks `dismissedTextEmbedUrls` locally so the current mount's
 *    `mergeCandidateUrls` filters dismissals immediately. Cross-mount
 *    persistence is handled by `removeUrlEmbed` (the canonical dismiss path
 *    in `useCastComposerEmbeds`), which `dismissUrl` invokes — that's the
 *    only thing that updates the persistent ignore set used by every future
 *    `syncEmbedsBySource` call for this cast.
 *  - Merges the caller-provided candidate URL sources (typing-derived links,
 *    intent embeds, manually-added token URLs, …) through
 *    `mergeCandidateUrls`, which dedupes by normalized URL and applies the
 *    dismiss filter.
 *  - Drives the canonical `text`-source sync effect. The sync runs only when
 *    the candidate scan saw the *current* editor text (`scannedText ===
 *    editorText`) — during the linkify/matchUrls debounce window we skip
 *    until it catches up. This is what lets us drive sync purely from
 *    current text without re-feeding prior canonical URLs (which would turn
 *    each keystroke into a stale-URL accumulator). The remount race
 *    (NEYN-10950) is handled by the same gate: callers fire an immediate
 *    scan on mount so the gate clears without waiting for typing.
 *  - Filters out URLs already in canonical state as image/video before
 *    syncing, so a URL that was uploaded as media isn't double-embedded.
 *  - Exposes `dismissUrl` which adds the dismissed URL to the local set and
 *    forwards to `removeUrlEmbed` (which strips matching url/snap canonical
 *    entries *and* records the dismissal in the persistent ignore set).
 *    Callers wrap this with platform-specific telemetry / cleanup.
 */
export function useCastComposerUrlEmbedCandidates({
  castLocalKey,
  candidateUrlSources,
  editorText,
  scannedText,
  syncEmbedsBySource,
  removeUrlEmbed,
  getMediaEmbedUrls,
  onSync,
}: {
  castLocalKey: number;
  candidateUrlSources: ReadonlyArray<readonly string[]>;
  editorText: string;
  scannedText: string;
  syncEmbedsBySource: CastComposerEmbedsReturn['syncEmbedsBySource'];
  removeUrlEmbed: CastComposerEmbedsReturn['removeUrlEmbed'];
  getMediaEmbedUrls: CastComposerEmbedsReturn['getMediaEmbedUrls'];
  /**
   * Fired inside the sync effect, *after* the gate passes and just before
   * `syncEmbedsBySource` is called. Lets callers wire telemetry that mirrors
   * the original inline-effect timing without re-deriving the sync key.
   */
  onSync?: (info: { mergedCandidateUrls: string[] }) => void;
}): {
  mergedCandidateUrls: string[];
  dismissUrl: (url: string) => void;
} {
  const [dismissedTextEmbedUrls, setDismissedTextEmbedUrls] = useState(
    () => new Set<string>(),
  );

  const mergedCandidateUrls = useMemo(
    () => mergeCandidateUrls(candidateUrlSources, dismissedTextEmbedUrls),
    [candidateUrlSources, dismissedTextEmbedUrls],
  );

  // Content-stable key so the sync effect only fires when the URL set
  // actually changes, not on every new array reference. Using
  // `mergedCandidateUrls` directly in deps would loop:
  //   effect → syncEmbedsBySource → re-render → new array → effect again.
  const mergedCandidateUrlsSyncKey = useMemo(
    () =>
      [...mergedCandidateUrls]
        .sort((a, b) => a.localeCompare(b))
        .join('\u0001'),
    [mergedCandidateUrls],
  );

  useEffect(() => {
    if (scannedText !== editorText) {
      return;
    }

    onSync?.({ mergedCandidateUrls });

    // URLs already in canonical state as image/video — skip them to avoid
    // double-embedding a URL that has been uploaded as media.
    const existingMediaUrls = new Set(getMediaEmbedUrls(castLocalKey));
    const candidates: CastComposerEmbed[] = mergedCandidateUrls
      .filter((url) => !existingMediaUrls.has(url))
      .map((url) => ({
        id: url,
        kind: 'url' as const,
        url,
        source: 'text' as const,
      }));
    syncEmbedsBySource({
      castLocalKey,
      source: 'text',
      candidates,
    });
    // `mergedCandidateUrls`, `getMediaEmbedUrls`, and `onSync` are
    // intentionally omitted — we react only to logical URL-set changes via
    // the syncKey, not new array/closure references that would loop the
    // effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    castLocalKey,
    mergedCandidateUrlsSyncKey,
    scannedText,
    editorText,
    syncEmbedsBySource,
  ]);

  const dismissUrl = useCallback(
    (url: string) => {
      // Normalize so a dismiss for the resolved API URL (which may have a
      // trailing slash from a redirect) cleans up the original text-source
      // URL too — and vice versa.
      const dismissKey = normalizeComposerEmbedUrl(url);
      setDismissedTextEmbedUrls((prev) => {
        if (prev.has(dismissKey)) {
          return prev;
        }
        const next = new Set(prev);
        next.add(dismissKey);
        return next;
      });
      // `removeUrlEmbed` strips matching url/snap entries from canonical
      // state *and* records the URL in the persistent ignore set, which
      // gates every future `syncEmbedsBySource` call for this cast (so the
      // dismissal survives remounts and re-syncs from any source).
      removeUrlEmbed({ url, castLocalKey });
    },
    [castLocalKey, removeUrlEmbed],
  );

  return { mergedCandidateUrls, dismissUrl };
}
