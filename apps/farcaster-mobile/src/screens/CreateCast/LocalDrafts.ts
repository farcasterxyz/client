import { QueuedCastInfo } from '~/types';
import { deleteItem, getItem, setItem } from '~/utils/StorageUtils';

const LEGACY_LOCAL_DRAFT_STORAGE_KEY = 'local-caststorm-draft';
const SCOPED_LOCAL_DRAFT_STORAGE_KEY = 'local-caststorm-drafts-by-key';

export const LOCAL_DRAFT_TOP_LEVEL_KEY = 'cast:new';

export type LocalDraftKey =
  | typeof LOCAL_DRAFT_TOP_LEVEL_KEY
  | `reply:${string}`
  | `draft:${string}`;

export type LocalDraft = {
  queuedCasts: QueuedCastInfo[];
  channelKey: string | undefined;
  embedUrls: { [castLocalKey: number]: string[] };
  parentCastHash: string | undefined;
  scheduledAt: number | undefined;
};

type ScopedLocalDrafts = Record<string, LocalDraft>;

function getReplyLocalDraftKey(parentCastHash: string): LocalDraftKey {
  return `reply:${parentCastHash}`;
}

function getActiveDraftLocalDraftKey(draftId: string): LocalDraftKey {
  return `draft:${draftId}`;
}

async function getScopedLocalDrafts(): Promise<ScopedLocalDrafts> {
  return (
    (await getItem<ScopedLocalDrafts>({
      key: SCOPED_LOCAL_DRAFT_STORAGE_KEY,
      fallback: {},
    })) ?? {}
  );
}

async function getLocalDraft(
  key: LocalDraftKey = LOCAL_DRAFT_TOP_LEVEL_KEY,
): Promise<LocalDraft | undefined> {
  const scopedDrafts = await getScopedLocalDrafts();
  const scopedDraft = scopedDrafts[key];

  if (typeof scopedDraft !== 'undefined') {
    return scopedDraft;
  }

  if (key === LOCAL_DRAFT_TOP_LEVEL_KEY) {
    return getItem<LocalDraft | undefined>({
      key: LEGACY_LOCAL_DRAFT_STORAGE_KEY,
      fallback: undefined,
    });
  }

  return undefined;
}

async function setLocalDraft(
  localDraft: LocalDraft | undefined,
  key: LocalDraftKey = LOCAL_DRAFT_TOP_LEVEL_KEY,
): Promise<void> {
  // Clear by removing the key; writing `undefined` persists the string "null"
  // (see the getItem coalesce in StorageUtils).
  const scopedDrafts = await getScopedLocalDrafts();

  if (typeof localDraft === 'undefined') {
    delete scopedDrafts[key];
  } else {
    scopedDrafts[key] = localDraft;
  }

  if (Object.keys(scopedDrafts).length === 0) {
    await deleteItem({ key: SCOPED_LOCAL_DRAFT_STORAGE_KEY });
  } else {
    await setItem({ key: SCOPED_LOCAL_DRAFT_STORAGE_KEY, value: scopedDrafts });
  }

  if (key === LOCAL_DRAFT_TOP_LEVEL_KEY && typeof localDraft === 'undefined') {
    await deleteItem({ key: LEGACY_LOCAL_DRAFT_STORAGE_KEY });
  }
}

export {
  getActiveDraftLocalDraftKey,
  getLocalDraft,
  getReplyLocalDraftKey,
  setLocalDraft,
};
