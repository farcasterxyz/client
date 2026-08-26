import {
  SNAP_INTERACTED_URLS_STORAGE_KEY,
  SNAP_INTERACTED_URLS_TTL_MS,
} from './constants';
import { snapInteractionKey } from './snapInteractionKey';
import type { InteractedSnapUrlsStore } from './types';

type MapRecord = Record<string, number>;
type LoadedMap = { map: MapRecord; changed: boolean };
type InteractedSnapUrlsScope = {
  viewerFid: number;
};

const unsafeMapKeys = new Set(['__proto__', 'constructor', 'prototype']);

function buildMapRecord(): MapRecord {
  return Object.create(null) as MapRecord;
}

function isSafeMapKey(key: string): boolean {
  return !unsafeMapKeys.has(key);
}

function buildInteractedSnapUrlsStorageKey({
  viewerFid,
}: InteractedSnapUrlsScope): string {
  return `${SNAP_INTERACTED_URLS_STORAGE_KEY}:${viewerFid}`;
}

async function loadMap(
  store: InteractedSnapUrlsStore,
  storageKey: string,
): Promise<LoadedMap> {
  const raw = await store.getItem(storageKey);
  if (!raw?.trim()) {
    return { map: buildMapRecord(), changed: false };
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed === null || typeof parsed !== 'object') {
      return { map: buildMapRecord(), changed: true };
    }
    const map = buildMapRecord();
    let changed = false;
    for (const [key, value] of Object.entries(parsed)) {
      if (
        isSafeMapKey(key) &&
        typeof value === 'number' &&
        Number.isFinite(value)
      ) {
        map[key] = value;
      } else {
        changed = true;
      }
    }
    return { map, changed };
  } catch {
    return { map: buildMapRecord(), changed: true };
  }
}

async function saveMap(
  store: InteractedSnapUrlsStore,
  storageKey: string,
  map: MapRecord,
): Promise<void> {
  await store.setItem(storageKey, JSON.stringify(map));
}

function pruneExpired(
  map: MapRecord,
  now: number,
): { map: MapRecord; changed: boolean } {
  const next = buildMapRecord();
  let changed = false;
  for (const [k, t] of Object.entries(map)) {
    if (
      isSafeMapKey(k) &&
      typeof t === 'number' &&
      Number.isFinite(t) &&
      t <= now &&
      now - t <= SNAP_INTERACTED_URLS_TTL_MS
    ) {
      next[k] = t;
    } else {
      changed = true;
    }
  }
  return { map: next, changed };
}

async function loadInteractedSnapUrlTimestamps(
  store: InteractedSnapUrlsStore,
  scope: InteractedSnapUrlsScope,
): Promise<MapRecord> {
  const storageKey = buildInteractedSnapUrlsStorageKey(scope);
  const now = Date.now();
  const loaded = await loadMap(store, storageKey);
  const pruned = pruneExpired(loaded.map, now);
  if (loaded.changed || pruned.changed) {
    await saveMap(store, storageKey, pruned.map);
  }
  return pruned.map;
}

async function hasInteractedSnapUrl(
  store: InteractedSnapUrlsStore,
  scope: InteractedSnapUrlsScope,
  url: string,
): Promise<boolean> {
  const key = snapInteractionKey(url);
  if (!key) {
    return false;
  }
  const map = await loadInteractedSnapUrlTimestamps(store, scope);
  const last = map[key];
  if (last === undefined) {
    return false;
  }
  return true;
}

async function markInteractedSnapUrl(
  store: InteractedSnapUrlsStore,
  scope: InteractedSnapUrlsScope,
  url: string,
): Promise<MapRecord> {
  const key = snapInteractionKey(url);
  if (!key) {
    return loadInteractedSnapUrlTimestamps(store, scope);
  }
  const storageKey = buildInteractedSnapUrlsStorageKey(scope);
  const now = Date.now();
  const loaded = await loadMap(store, storageKey);
  const { map } = pruneExpired(loaded.map, now);
  map[key] = now;
  await saveMap(store, storageKey, map);
  return map;
}

export {
  buildInteractedSnapUrlsStorageKey,
  hasInteractedSnapUrl,
  loadInteractedSnapUrlTimestamps,
  markInteractedSnapUrl,
};
export type { InteractedSnapUrlsScope };
