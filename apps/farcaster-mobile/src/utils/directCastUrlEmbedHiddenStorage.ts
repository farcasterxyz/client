import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiDirectCastUrlEmbedDisplayMode } from 'farcaster-client-data';

const storageKeyForMessage = (messageId: string) =>
  `dc-hide-url-embed:${messageId}`;

// Locally-remembered display mode the sender chose when composing. Used when
// the backend does not echo `urlEmbedDisplayMode` back on the stored message.
const displayModeStorageKeyForMessage = (messageId: string) =>
  `dc-url-embed-display-mode:${messageId}`;

// In-memory caches, populated synchronously on persist so the optimistic
// message renders with the correct mode without waiting on AsyncStorage.
// Bounded via FIFO eviction to avoid unbounded growth in long-lived sessions;
// AsyncStorage remains the durable source of truth if an entry is evicted.
const MAX_IN_MEMORY_ENTRIES = 500;

const inMemoryHiddenByMessageId = new Set<string>();
const inMemoryDisplayModeByMessageId = new Map<
  string,
  ApiDirectCastUrlEmbedDisplayMode
>();

function addToHiddenCache(messageId: string): void {
  if (inMemoryHiddenByMessageId.has(messageId)) {
    return;
  }
  if (inMemoryHiddenByMessageId.size >= MAX_IN_MEMORY_ENTRIES) {
    const oldest = inMemoryHiddenByMessageId.values().next().value;
    if (typeof oldest !== 'undefined') {
      inMemoryHiddenByMessageId.delete(oldest);
    }
  }
  inMemoryHiddenByMessageId.add(messageId);
}

function setInDisplayModeCache(
  messageId: string,
  mode: ApiDirectCastUrlEmbedDisplayMode,
): void {
  if (
    !inMemoryDisplayModeByMessageId.has(messageId) &&
    inMemoryDisplayModeByMessageId.size >= MAX_IN_MEMORY_ENTRIES
  ) {
    const oldestKey = inMemoryDisplayModeByMessageId.keys().next().value;
    if (typeof oldestKey !== 'undefined') {
      inMemoryDisplayModeByMessageId.delete(oldestKey);
    }
  }
  inMemoryDisplayModeByMessageId.set(messageId, mode);
}

async function loadDirectCastUrlEmbedHidden(
  messageId: string,
): Promise<boolean> {
  if (inMemoryHiddenByMessageId.has(messageId)) {
    return true;
  }
  try {
    const v = await AsyncStorage.getItem(storageKeyForMessage(messageId));
    const hidden = v === '1';
    if (hidden) {
      addToHiddenCache(messageId);
    }
    return hidden;
  } catch {
    return false;
  }
}

async function persistDirectCastUrlEmbedHidden(
  messageId: string,
): Promise<void> {
  addToHiddenCache(messageId);
  try {
    await AsyncStorage.setItem(storageKeyForMessage(messageId), '1');
  } catch {
    // ignore
  }
}

async function loadDirectCastUrlEmbedDisplayMode(
  messageId: string,
): Promise<ApiDirectCastUrlEmbedDisplayMode | undefined> {
  const cached = inMemoryDisplayModeByMessageId.get(messageId);
  if (typeof cached !== 'undefined') {
    return cached;
  }
  try {
    const v = await AsyncStorage.getItem(
      displayModeStorageKeyForMessage(messageId),
    );
    if (v === 'compact' || v === 'large') {
      setInDisplayModeCache(messageId, v);
      return v;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

async function persistDirectCastUrlEmbedDisplayMode(
  messageId: string,
  mode: ApiDirectCastUrlEmbedDisplayMode,
): Promise<void> {
  setInDisplayModeCache(messageId, mode);
  try {
    await AsyncStorage.setItem(
      displayModeStorageKeyForMessage(messageId),
      mode,
    );
  } catch {
    // ignore
  }
}

export {
  loadDirectCastUrlEmbedDisplayMode,
  loadDirectCastUrlEmbedHidden,
  persistDirectCastUrlEmbedDisplayMode,
  persistDirectCastUrlEmbedHidden,
};
