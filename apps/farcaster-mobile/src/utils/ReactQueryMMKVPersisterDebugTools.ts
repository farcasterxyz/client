/* eslint-disable no-console */
import { PersistedClient } from '@tanstack/react-query-persist-client';

import { getStorage } from './FastStorageUtils';
import { SelectiveMMKVPersister } from './ReactQueryMMKVPersister';

export function logLargestMMKVEntries(limit: number = 10) {
  const keys = getStorage().getAllKeys();
  const entries = keys.map((key) => {
    const value = getStorage().getString(key);
    const size = value ? value.length : 0;
    return { key, size };
  });

  const sorted = entries.sort((a, b) => b.size - a.size);
  console.log(`🔍 Top ${limit} largest MMKV entries:`);
  sorted.slice(0, limit).forEach(({ key, size }, idx) => {
    console.log(`${idx + 1}. ${key} — ${size} bytes`);
  });
}

export function logLargestPersistedQueries(limit = 10) {
  const raw = getStorage().getString('farcaster.persisted.rq');
  if (!raw) {
    console.log('No persisted query data found.');
    return;
  }

  try {
    const parsed = JSON.parse(raw) as PersistedClient;
    const queries = parsed?.clientState?.queries || [];

    const entries = queries.map((q, i) => {
      const size = JSON.stringify(q).length;
      return {
        index: i,
        key: Array.isArray(q.queryKey)
          ? q.queryKey.join('.')
          : String(q.queryKey),
        size,
      };
    });

    const top = entries.sort((a, b) => b.size - a.size).slice(0, limit);
    console.log(`🔍 Top ${limit} largest persisted queries:`);
    top.forEach(({ index, key, size }, i) => {
      console.log(`${i + 1}. [${key}] (query #${index}) — ${size} bytes`);
    });
  } catch (err) {
    console.warn('Failed to parse or inspect persisted data:', err);
  }
}

export function deepInspectPersistedClient() {
  const raw = getStorage().getString('farcaster.persisted.rq');
  if (!raw) {
    console.log('No persisted query data found.');
    return;
  }

  try {
    const parsed = JSON.parse(raw) as PersistedClient;
    const totalSize = raw.length;
    const queryBytes = JSON.stringify(parsed.clientState?.queries || []).length;
    const mutationBytes = JSON.stringify(
      parsed.clientState?.mutations || [],
    ).length;
    const other = totalSize - (queryBytes + mutationBytes);

    console.log(`📦 Total persisted size: ${totalSize} bytes`);
    console.log(`📁 Queries size:         ${queryBytes} bytes`);
    console.log(`📁 Mutations size:       ${mutationBytes} bytes`);
    console.log(`📁 Metadata/Other size:  ${other} bytes`);
  } catch (err) {
    console.warn('Failed to parse persisted state:', err);
  }
}

export function logGlobalCacheQuerySizes() {
  const raw = getStorage().getString('farcaster.persisted.rq');
  if (!raw) {
    console.log('No persisted query data found.');
    return;
  }

  try {
    const parsed = JSON.parse(raw) as PersistedClient;
    const queries = parsed?.clientState?.queries || [];

    const prefixes = ['globallyCachedUser', 'globallyCachedCast'];
    const matching = queries
      .map((q, i) => {
        const key = Array.isArray(q.queryKey)
          ? q.queryKey.join('.')
          : String(q.queryKey);
        const match = prefixes.some((prefix) => key.startsWith(prefix));
        return match ? { index: i, key, size: JSON.stringify(q).length } : null;
      })
      .filter(Boolean) as { index: number; key: string; size: number }[];

    if (matching.length === 0) {
      console.log('No globally cached queries found.');
      return;
    }

    const sorted = matching.sort((a, b) => b.size - a.size);

    console.log(`🔍 Globally cached query sizes:`);
    sorted.forEach(({ index, key, size }, i) => {
      console.log(`${i + 1}. [${key}] (query #${index}) — ${size} bytes`);
    });
  } catch (err) {
    console.warn('Failed to parse or inspect persisted data:', err);
  }
}

export function logNotificationsForTabAll() {
  const raw = getStorage().getString('farcaster.persisted.rq');
  if (!raw) {
    console.log('❌ No persisted cache found.');
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    const queries = parsed?.clientState?.queries ?? [];

    const match = queries.find((q: { queryKey: string | string[] }) => {
      const key = Array.isArray(q.queryKey)
        ? q.queryKey.join('.')
        : String(q.queryKey);
      return key === 'userPreferences';
    });

    if (!match) {
      console.log('⚠️ userPreferences not found in persisted queries.');
      return;
    }

    console.log('🔍 userPreferences query state:');
    console.log(JSON.stringify(match, null, 2));
  } catch (err) {
    console.warn('Failed to parse or inspect persisted state:', err);
  }
}

export function groupPersistedQueriesByKeyPrefix(groupDepth = 1) {
  const raw = getStorage().getString('farcaster.persisted.rq');
  if (!raw) {
    console.log('❌ No persisted cache found.');
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    const queries = parsed?.clientState?.queries ?? [];

    const groups: Record<string, { count: number; totalBytes: number }> = {};

    queries.forEach((q: { queryKey: string | string[] }) => {
      const keyParts = Array.isArray(q.queryKey)
        ? q.queryKey
        : [String(q.queryKey)];
      const groupKey = keyParts.slice(0, groupDepth).join('.');

      const size = JSON.stringify(q).length;
      if (!groups[groupKey]) {
        groups[groupKey] = { count: 0, totalBytes: 0 };
      }
      groups[groupKey].count += 1;
      groups[groupKey].totalBytes += size;
    });

    const sorted = Object.entries(groups)
      .sort((a, b) => b[1].totalBytes - a[1].totalBytes)
      .slice(0, 20); // Top N groups

    console.log('🔍 Query groups by prefix:');
    sorted.forEach(([prefix, { count, totalBytes }]) => {
      console.log(`• ${prefix}: ${count} queries, ${totalBytes} bytes`);
    });
  } catch (err) {
    console.warn('Failed to inspect query groups:', err);
  }
}

// logLargestMMKVEntries();

// logLargestPersistedQueries();

// deepInspectPersistedClient();

// logGlobalCacheQuerySizes();

// groupPersistedQueriesByKeyPrefix();

// logNotificationsForTabAll();

export function logPersisterStats(selectivePersister: SelectiveMMKVPersister) {
  if (selectivePersister) {
    const stats = selectivePersister.getStats();
    console.log('📊 Selective Persister Stats:', {
      ...stats,
      skipRatePercent: `${(stats.skipRate * 100).toFixed(1)}%`,
    });
  } else {
    console.log('📊 No selective persister instance found');
  }
}

// Enhanced MMKV monitoring functions
export function logMMKVStorageChanges() {
  let previousKeys = new Set(getStorage().getAllKeys());
  let previousReactQueryData: string | null = null;

  // Get initial state
  try {
    previousReactQueryData =
      getStorage().getString('farcaster.persisted.rq') || null;
  } catch (err) {
    console.warn('Failed to get initial ReactQuery data:', err);
  }

  return setInterval(() => {
    const currentKeys = new Set(getStorage().getAllKeys());
    const currentReactQueryData =
      getStorage().getString('farcaster.persisted.rq') || null;

    // Check for added/removed keys
    const addedKeys = [...currentKeys].filter((key) => !previousKeys.has(key));
    const removedKeys = [...previousKeys].filter(
      (key) => !currentKeys.has(key),
    );

    if (addedKeys.length > 0) {
      console.log('🆕 [MMKV] New keys added:', addedKeys);
    }

    if (removedKeys.length > 0) {
      console.log('🗑️ [MMKV] Keys removed:', removedKeys);
    }

    // Check for ReactQuery data changes
    if (previousReactQueryData !== currentReactQueryData) {
      if (!previousReactQueryData && currentReactQueryData) {
        console.log('✅ [MMKV] ReactQuery data was restored/created');
      } else if (previousReactQueryData && !currentReactQueryData) {
        console.log('❌ [MMKV] ReactQuery data was completely removed!');
      } else if (previousReactQueryData && currentReactQueryData) {
        // Data changed, let's analyze what changed
        analyzeReactQueryDataChanges(
          previousReactQueryData,
          currentReactQueryData,
        );
      }
    }

    previousKeys = currentKeys;
    previousReactQueryData = currentReactQueryData;
  }, 5000); // Check every 5 seconds
}

function analyzeReactQueryDataChanges(
  previousData: string,
  currentData: string,
) {
  try {
    const previous = JSON.parse(previousData) as PersistedClient;
    const current = JSON.parse(currentData) as PersistedClient;

    const prevQueries = previous.clientState?.queries || [];
    const currQueries = current.clientState?.queries || [];

    const debugKeys = ['feedItems', 'directCastInbox'];

    debugKeys.forEach((debugKey) => {
      const prevQuery = prevQueries.find((q) => {
        const keyString = Array.isArray(q.queryKey)
          ? q.queryKey.join('.')
          : String(q.queryKey);
        return keyString.includes(debugKey);
      });

      const currQuery = currQueries.find((q) => {
        const keyString = Array.isArray(q.queryKey)
          ? q.queryKey.join('.')
          : String(q.queryKey);
        return keyString.includes(debugKey);
      });

      if (prevQuery && !currQuery) {
        console.log(`🚨 [MMKV] ${debugKey} query was removed from storage!`, {
          queryKey: prevQuery.queryKey,
          hadData: !!prevQuery.state?.data,
          dataUpdateCount: prevQuery.state?.dataUpdateCount,
          status: prevQuery.state?.status,
        });
      } else if (!prevQuery && currQuery) {
        console.log(`🆕 [MMKV] ${debugKey} query was added to storage`, {
          queryKey: currQuery.queryKey,
          hasData: !!currQuery.state?.data,
          dataUpdateCount: currQuery.state?.dataUpdateCount,
          status: currQuery.state?.status,
        });
      } else if (prevQuery && currQuery) {
        const prevDataUpdateCount = prevQuery.state?.dataUpdateCount ?? 0;
        const currDataUpdateCount = currQuery.state?.dataUpdateCount ?? 0;

        if (prevDataUpdateCount !== currDataUpdateCount) {
          console.log(`🔄 [MMKV] ${debugKey} query data updated in storage`, {
            queryKey: currQuery.queryKey,
            dataUpdateCount: {
              prev: prevDataUpdateCount,
              curr: currDataUpdateCount,
            },
            hasData: {
              prev: !!prevQuery.state?.data,
              curr: !!currQuery.state?.data,
            },
            dataSize: {
              prev: prevQuery.state?.data
                ? JSON.stringify(prevQuery.state.data).length
                : 0,
              curr: currQuery.state?.data
                ? JSON.stringify(currQuery.state.data).length
                : 0,
            },
          });
        }
      }
    });

    // Log overall stats
    const queryCountChange = currQueries.length - prevQueries.length;
    if (queryCountChange !== 0) {
      console.log(
        `📊 [MMKV] Query count changed by ${queryCountChange} (${prevQueries.length} → ${currQueries.length})`,
      );
    }
  } catch (err) {
    console.warn('Failed to analyze ReactQuery data changes:', err);
  }
}

// Monitor specific queries in MMKV
export function monitorSpecificQueriesInMMKV(
  queryKeys: string[] = ['feedItems', 'directCastInbox'],
) {
  return setInterval(() => {
    const raw = getStorage().getString('farcaster.persisted.rq');
    if (!raw) {
      console.log('⚠️ [MMKV Monitor] No ReactQuery data found in MMKV');
      return;
    }

    try {
      const parsed = JSON.parse(raw) as PersistedClient;
      const queries = parsed.clientState?.queries || [];

      queryKeys.forEach((queryKey) => {
        const matchingQueries = queries.filter((q) => {
          const keyString = Array.isArray(q.queryKey)
            ? q.queryKey.join('.')
            : String(q.queryKey);
          return keyString.includes(queryKey);
        });

        if (matchingQueries.length === 0) {
          console.log(
            `❌ [MMKV Monitor] No ${queryKey} queries found in storage`,
          );
        } else {
          matchingQueries.forEach((query, index) => {
            const keyString = Array.isArray(query.queryKey)
              ? query.queryKey.join('.')
              : String(query.queryKey);
            const dataSize = query.state?.data
              ? JSON.stringify(query.state.data).length
              : 0;

            console.log(
              `✅ [MMKV Monitor] ${queryKey}[${index}] (${keyString}):`,
              {
                hasData: !!query.state?.data,
                dataSize: `${dataSize} bytes`,
                dataUpdateCount: query.state?.dataUpdateCount ?? 0,
                status: query.state?.status,
                timestamp: new Date().toISOString(),
              },
            );
          });
        }
      });
    } catch (err) {
      console.warn('Failed to monitor queries in MMKV:', err);
    }
  }, 10000); // Check every 10 seconds
}
