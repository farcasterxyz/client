/**
 * Local-first cast-draft persistence for the web composer (NEYN-10598).
 *
 * Mirrors `apps/farcaster-mobile/src/screens/CreateCast/LocalDrafts.ts`, but
 * uses `localStorage` instead of AsyncStorage. The persisted shape is text +
 * already-uploaded embed URLs only — we deliberately don't try to round-trip
 * the rich Lexical/Draft.js editor state, since on hydration we recreate it
 * from text using the same code path the existing intent loader uses.
 *
 * Invariants:
 * - Read/write failures are non-fatal; the composer continues to work, the
 *   user just doesn't get local recovery.
 * - `setLocalDraft(undefined)` clears the legacy slot.
 * - `setLocalDraft(undefined, key)` clears that scoped slot.
 * - Retired Snap Builder state is ignored and removed during recovery.
 */

const STORAGE_KEY = 'local-caststorm-draft';
const SCOPED_STORAGE_KEY = 'local-caststorm-drafts-by-key';
const LOCAL_DRAFT_SCHEMA_VERSION = 3;
const LOCAL_DRAFT_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14;

export const LOCAL_DRAFT_TOP_LEVEL_KEY = 'cast:new';

export type LocalDraftCast = {
  text: string;
  embeds: string[];
};

export type LocalDraft = {
  schemaVersion?: number;
  updatedAt?: number;
  casts: LocalDraftCast[];
  channelKey: string | undefined;
  parentCastHash: string | undefined;
  scheduledAt: number | undefined;
};

type ScopedLocalDrafts = Record<string, LocalDraft>;

export function getActiveDraftLocalDraftKey(draftId: string): string {
  return `draft:${draftId}`;
}

export function getReplyLocalDraftKey(parentCastHash: string): string {
  return `reply:${parentCastHash}`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isValidLocalDraft(value: unknown): value is LocalDraft {
  if (!isObject(value)) {
    return false;
  }
  const candidate = value as Partial<LocalDraft>;
  if (
    typeof candidate.schemaVersion !== 'undefined' &&
    typeof candidate.schemaVersion !== 'number'
  ) {
    return false;
  }
  if (
    typeof candidate.updatedAt !== 'undefined' &&
    typeof candidate.updatedAt !== 'number'
  ) {
    return false;
  }
  if (!Array.isArray(candidate.casts)) {
    return false;
  }
  for (const cast of candidate.casts) {
    if (
      typeof cast !== 'object' ||
      cast === null ||
      typeof (cast as LocalDraftCast).text !== 'string' ||
      !Array.isArray((cast as LocalDraftCast).embeds) ||
      !(cast as LocalDraftCast).embeds.every((e) => typeof e === 'string')
    ) {
      return false;
    }
  }
  if (
    typeof candidate.channelKey !== 'undefined' &&
    typeof candidate.channelKey !== 'string'
  ) {
    return false;
  }
  if (
    typeof candidate.parentCastHash !== 'undefined' &&
    typeof candidate.parentCastHash !== 'string'
  ) {
    return false;
  }
  if (
    typeof candidate.scheduledAt !== 'undefined' &&
    typeof candidate.scheduledAt !== 'number'
  ) {
    return false;
  }
  return true;
}

function stripLegacySnapBuilder(draft: LocalDraft): LocalDraft {
  if (!('snapBuilder' in draft)) {
    return draft;
  }

  const { snapBuilder: _snapBuilder, ...rest } = draft as LocalDraft & {
    snapBuilder?: unknown;
  };
  return rest;
}

function isExpiredLocalDraft(draft: LocalDraft): boolean {
  return (
    typeof draft.updatedAt === 'number' &&
    Date.now() - draft.updatedAt > LOCAL_DRAFT_MAX_AGE_MS
  );
}

function normalizeLocalDraft(draft: LocalDraft): LocalDraft {
  return {
    ...stripLegacySnapBuilder(draft),
    schemaVersion: LOCAL_DRAFT_SCHEMA_VERSION,
    updatedAt: Date.now(),
  };
}

function readScopedLocalDrafts(): ScopedLocalDrafts {
  try {
    if (typeof window === 'undefined') {
      return {};
    }
    const raw = window.localStorage.getItem(SCOPED_STORAGE_KEY);
    if (raw === null) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isObject(parsed)) {
      window.localStorage.removeItem(SCOPED_STORAGE_KEY);
      return {};
    }

    const drafts: ScopedLocalDrafts = {};
    let changed = false;
    for (const [key, value] of Object.entries(parsed)) {
      if (isValidLocalDraft(value) && !isExpiredLocalDraft(value)) {
        const sanitizedDraft = stripLegacySnapBuilder(value);
        drafts[key] = sanitizedDraft;
        changed ||= sanitizedDraft !== value;
      } else {
        changed = true;
      }
    }
    if (changed) {
      if (Object.keys(drafts).length === 0) {
        window.localStorage.removeItem(SCOPED_STORAGE_KEY);
      } else {
        window.localStorage.setItem(SCOPED_STORAGE_KEY, JSON.stringify(drafts));
      }
    }
    return drafts;
  } catch {
    return {};
  }
}

function writeScopedLocalDrafts(drafts: ScopedLocalDrafts): void {
  try {
    if (typeof window === 'undefined') {
      return;
    }
    if (Object.keys(drafts).length === 0) {
      window.localStorage.removeItem(SCOPED_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(SCOPED_STORAGE_KEY, JSON.stringify(drafts));
  } catch {
    // Quota exceeded, private mode, or storage unavailable — best-effort.
  }
}

export function getLocalDraft(key?: string): LocalDraft | undefined {
  try {
    if (typeof window === 'undefined') {
      return undefined;
    }
    if (typeof key !== 'undefined') {
      return readScopedLocalDrafts()[key];
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return undefined;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isValidLocalDraft(parsed) || isExpiredLocalDraft(parsed)) {
      // Corrupted or unexpected shape (e.g. a stale value from an older
      // schema). Clear it so we don't keep tripping on it.
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // best-effort
      }
      return undefined;
    }
    const sanitizedDraft = stripLegacySnapBuilder(parsed);
    if (sanitizedDraft !== parsed) {
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(sanitizedDraft),
        );
      } catch {
        // best-effort
      }
    }
    return sanitizedDraft;
  } catch {
    return undefined;
  }
}

export function setLocalDraft(
  draft: LocalDraft | undefined,
  key?: string,
): void {
  try {
    if (typeof window === 'undefined') {
      return;
    }
    if (typeof key !== 'undefined') {
      const drafts = readScopedLocalDrafts();
      if (typeof draft === 'undefined') {
        delete drafts[key];
      } else {
        drafts[key] = normalizeLocalDraft(draft);
      }
      writeScopedLocalDrafts(drafts);
      return;
    }
    if (typeof draft === 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(normalizeLocalDraft(draft)),
    );
  } catch {
    // Quota exceeded, private mode, or storage unavailable — best-effort.
  }
}
