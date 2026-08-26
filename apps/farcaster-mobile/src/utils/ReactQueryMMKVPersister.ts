import AsyncStorage from '@react-native-async-storage/async-storage';
import { partialMatchKey } from '@tanstack/query-core';
import {
  PersistedClient,
  Persister,
} from '@tanstack/react-query-persist-client';
import { MILLIS_PER_SECOND } from 'farcaster-client-hooks';
import debounce from 'lodash/debounce';
import { InteractionManager } from 'react-native';

import type { KeySelector } from '~/contexts/QueryClientProvider';

import { getStorage } from './FastStorageUtils';

const LEGACY_REACT_QUERY_ASYNC_STORAGE_KEY = 'REACT_QUERY_OFFLINE_CACHE';
const REACT_QUERY_STORAGE_ID = 'farcaster.persisted.rq';
const MIGRATION_FLAG_KEY = 'rq.migration.completed';

// Persistence cadence. 10s (vs old 4s) keeps the user-visible cost of an
// interrupted-by-quit cache miss low while cutting how often we hit the JS
// thread with a multi-MB stringify + sync MMKV write — a top contributor to
// Android user-perceived ANRs.
const PERSIST_DEBOUNCE_MS = MILLIS_PER_SECOND * 10;

// Schedule heavy persist work after current interactions/scroll have flushed
// so we never stringify + write the dehydrated cache mid-frame.
//
// Coalesce to a SINGLE pending idle persist. The caller is already debounced
// (maxWait 10s), so a long continuous scroll would otherwise queue one
// runAfterInteractions task per debounce window; they all resolve at once when
// interactions end, producing exactly the back-to-back stringify+MMKV write
// burst this is meant to avoid. Instead we keep only the latest write and let
// repeat calls replace it while a flush is already pending.
let pendingIdlePersist: (() => void) | null = null;
let idlePersistHandle: { cancel: () => void } | undefined;
let idlePersistTimeout: ReturnType<typeof setTimeout> | undefined;

function scheduleIdlePersist(run: () => void): void {
  pendingIdlePersist = run;
  if (idlePersistHandle) {
    return;
  }
  idlePersistHandle = InteractionManager.runAfterInteractions(() => {
    idlePersistHandle = undefined;
    if (idlePersistTimeout !== undefined) {
      clearTimeout(idlePersistTimeout);
    }
    const toRun = pendingIdlePersist;
    pendingIdlePersist = null;
    if (toRun) {
      idlePersistTimeout = setTimeout(toRun, 0);
    }
  });
}

// TODO: Check if this is safe overall to do - alternatively we never pass
// some queries from the persister at all but need to do some analysis which
// ones.
const BIGINT_KEY = '__bigint__';

function safeStringify(obj: unknown): string {
  return JSON.stringify(obj, (_, value) =>
    typeof value === 'bigint' ? { [BIGINT_KEY]: value.toString() } : value,
  );
}

function safeParse<T>(str: string): T {
  // Passing a reviver forces Hermes off its fast JSON.parse path for the
  // whole multi-MB blob, and this parse runs synchronously on the JS thread
  // during cold start. The reviver only ever does work when a serialized
  // bigint marker is present, so check for the marker first (a single
  // String.includes scan) and take the fast path when there is none.
  if (!str.includes(BIGINT_KEY)) {
    return JSON.parse(str) as T;
  }
  return JSON.parse(str, (_, value) =>
    value && typeof value === 'object' && BIGINT_KEY in value
      ? BigInt(value[BIGINT_KEY])
      : value,
  );
}

// Hard cap on the serialized React Query cache we'll write to MMKV. Past this
// size the synchronous MMKV write — and, worse, the cold-start `restoreClient`
// that JSON-parses the blob back on launch — becomes a multi-second
// main-thread stall, a known Android ANR source. Above the cap we drop the
// persisted cache entirely rather than risk the freeze; React Query just
// refetches on next launch. Length ≈ bytes for the mostly-ASCII JSON we store.
const MAX_PERSIST_BYTES = 4 * 1024 * 1024;

const queryStorage = {
  set: <T>([key]: [string], value: T): void => {
    const serialized = safeStringify(value);
    if (serialized.length > MAX_PERSIST_BYTES) {
      // Oversized: skip the write and remove any previously persisted blob so
      // the next cold-start restore can't inherit a multi-MB parse cost.
      getStorage().delete(key);
      return;
    }
    getStorage().set(key, serialized);
  },

  get: async <T>([key]: [string]): Promise<T | undefined> => {
    const raw = getStorage().getString(key);
    if (!raw) {
      return undefined;
    }
    if (raw.length > MAX_PERSIST_BYTES) {
      // A blob persisted by an older build (before the write-side cap) would
      // otherwise be JSON-parsed synchronously on cold start — exactly the
      // launch ANR we're guarding against. Drop it and refetch instead.
      getStorage().delete(key);
      return undefined;
    }
    return safeParse(raw) as T;
  },

  remove: ([key]: [string]): void => {
    getStorage().delete(key);
  },
};

class MMKVPersister implements Persister {
  private throttledPersist = debounce(
    (persistedClient: PersistedClient) => {
      scheduleIdlePersist(() => {
        queryStorage.set([REACT_QUERY_STORAGE_ID], persistedClient);
      });
    },
    PERSIST_DEBOUNCE_MS,
    {
      leading: false,
      trailing: true,
      maxWait: PERSIST_DEBOUNCE_MS,
    },
  );

  persistClient(persistedClient: PersistedClient): void {
    this.throttledPersist(persistedClient);
  }

  async restoreClient(): Promise<PersistedClient | undefined> {
    const result = await queryStorage.get<PersistedClient>([
      REACT_QUERY_STORAGE_ID,
    ]);
    return result ?? undefined;
  }

  removeClient(): void {
    this.throttledPersist.cancel();
    queryStorage.remove([REACT_QUERY_STORAGE_ID]);
  }
}

async function migrateReactQueryCache() {
  try {
    const alreadyMigrated = getStorage().getBoolean(MIGRATION_FLAG_KEY);
    if (alreadyMigrated) {
      return;
    }

    const existing = await AsyncStorage.getItem(
      LEGACY_REACT_QUERY_ASYNC_STORAGE_KEY,
    );
    if (!existing) {
      return;
    }

    const parsed = JSON.parse(existing);
    if (!parsed?.clientState?.queries) {
      return;
    }

    getStorage().set(REACT_QUERY_STORAGE_ID, existing);
    await AsyncStorage.removeItem(LEGACY_REACT_QUERY_ASYNC_STORAGE_KEY);
    getStorage().set(MIGRATION_FLAG_KEY, true);
  } catch {
    // Not much we can do here.
  }
}

class SelectiveMMKVPersister implements Persister {
  private lastUpdateCounts: Record<string, number> = {};
  private skipCount = 0;
  private persistCount = 0;

  // Coalesces rapid-fire persistClient calls into one check per event-loop turn.
  //
  // React Query calls persistClient on every cache notification — a single feed
  // page load generates O(25) calls (one per cast entering the global cache).
  // Without coalescing, hasRelevantDataChanges + transformClientState run O(25×N)
  // times for what is one logical change (N = number of persisted queries).
  // With coalescing, only the latest snapshot is examined; intermediate snapshots
  // are discarded since the debounced write always picks up the freshest state.
  private pendingCoalesceClient: PersistedClient | undefined;
  private coalesceScheduled = false;

  constructor(private readonly keySelectors: KeySelector[]) {}

  private throttledPersist = debounce(
    (persistedClient: PersistedClient) => {
      scheduleIdlePersist(() => {
        queryStorage.set([REACT_QUERY_STORAGE_ID], persistedClient);
        this.persistCount++;
      });
    },
    PERSIST_DEBOUNCE_MS,
    {
      leading: false,
      trailing: true,
      maxWait: PERSIST_DEBOUNCE_MS,
    },
  );

  persistClient(persistedClient: PersistedClient): void {
    // Always store the latest snapshot — previous pending one is stale.
    this.pendingCoalesceClient = persistedClient;
    if (this.coalesceScheduled) {
      // A check is already queued for this event-loop turn; it will use the
      // latest snapshot we just stored above.
      return;
    }
    this.coalesceScheduled = true;
    setTimeout(() => {
      this.coalesceScheduled = false;
      const client = this.pendingCoalesceClient;
      this.pendingCoalesceClient = undefined;
      if (client) {
        this.checkAndPersist(client);
      }
    }, 0);
  }

  private checkAndPersist(persistedClient: PersistedClient): void {
    const hasChanges = this.hasRelevantDataChanges(persistedClient);

    if (hasChanges) {
      const transformedClient = {
        ...persistedClient,
        clientState: this.transformClientState(persistedClient.clientState),
      };
      this.throttledPersist(transformedClient);
      this.updateTrackedCounts(transformedClient);
    } else {
      this.skipCount++;
      if (__DEV__ && this.skipCount % 100 === 0) {
        // eslint-disable-next-line no-console
        console.log(
          `[SelectiveMMKVPersister] Skipped ${this.skipCount} unnecessary persists`,
        );
      }
    }
  }

  private hasRelevantDataChanges(client: PersistedClient): boolean {
    const queries = client.clientState?.queries || [];

    for (const query of queries) {
      const key = query.queryHash;

      const currentCount = query.state?.dataUpdateCount ?? 0;
      const lastCount = this.lastUpdateCounts[key] ?? -1;

      if (currentCount !== lastCount) {
        return true;
      }
    }

    return false;
  }

  private transformClientState(
    clientState: PersistedClient['clientState'],
  ): PersistedClient['clientState'] {
    const queries = (clientState.queries || []).map((query) => {
      const keySelector = this.keySelectors.find(({ key }) =>
        partialMatchKey(query.queryKey, key),
      );

      if (keySelector?.transform) {
        return {
          ...query,
          state: keySelector.transform(query.state),
        };
      }

      return query;
    });

    return {
      ...clientState,
      queries,
    };
  }

  private updateTrackedCounts(client: PersistedClient): void {
    const queries = client.clientState?.queries || [];

    for (const query of queries) {
      const key = query.queryHash;
      this.lastUpdateCounts[key] = query.state?.dataUpdateCount ?? 0;
    }
  }

  async restoreClient(): Promise<PersistedClient | undefined> {
    const result = await queryStorage.get<PersistedClient>([
      REACT_QUERY_STORAGE_ID,
    ]);
    return result ?? undefined;
  }

  removeClient(): void {
    this.throttledPersist.cancel();
    queryStorage.remove([REACT_QUERY_STORAGE_ID]);
  }

  // Debug utilities
  getStats() {
    return {
      skipCount: this.skipCount,
      persistCount: this.persistCount,
      skipRate: this.skipCount / (this.skipCount + this.persistCount) || 0,
    };
  }
}

const mmkvPersister = new MMKVPersister();

export { migrateReactQueryCache, mmkvPersister, SelectiveMMKVPersister };
