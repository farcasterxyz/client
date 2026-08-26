import { partialMatchKey } from '@tanstack/query-core';
import { InfiniteData, QueryKey, QueryState } from '@tanstack/react-query';
import {
  PersistQueryClientProvider,
  PersistQueryClientProviderProps,
} from '@tanstack/react-query-persist-client';
import * as Application from 'expo-application';
import {
  buildCastAttachmentCacheKey,
  buildCastAttachmentPreviewCacheKey,
  buildClientConfigKey,
  buildDirectCastInboxByAccountKey,
  buildFeedItemsKey,
  buildGloballyCachedCastKey,
  buildGloballyCachedChannelKey,
  buildGloballyCachedDirectCastInboxConversationKey,
  buildGloballyCachedTokenKey,
  buildGloballyCachedTotpTokenKey,
  buildGloballyCachedUserKey,
  buildOnboardingStateKey,
  buildPrimaryAddressKey,
  buildProductCatalogKey,
  buildRecoveryAddressChangeHashKey,
  buildRecoveryAddressChangeKey,
  buildRecoveryAddressKey,
  buildRecoveryKey,
  buildSignersKey,
  buildUserAppContextKey,
  buildUserChannelsForCategoryKey,
  buildUserKey,
  buildUserPreferencesKey,
  buildWalletPositionsKey,
  MAX_AGE,
} from 'farcaster-client-hooks';
import React from 'react';

import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { queryClient } from '~/queryClient';
import {
  migrateReactQueryCache,
  SelectiveMMKVPersister,
} from '~/utils/ReactQueryMMKVPersister';

export type KeySelector = {
  key: QueryKey;
  predicate?: (state: QueryState) => boolean;
  transform?: (state: QueryState) => QueryState;
};

function dataExists(state: QueryState): boolean {
  return !!state.data;
}

function pagesNotEmpty(state: QueryState): boolean {
  const data = state.data as InfiniteData<unknown> | undefined;
  return !!data && Array.isArray(data.pages) && data.pages.length > 0;
}

function onlyFirstPage(state: QueryState): QueryState {
  const data = state.data as InfiniteData<unknown> | undefined;
  if (data?.pages?.length && data.pages.length > 1) {
    return {
      ...state,
      data: {
        ...data,
        pages: data.pages.slice(0, 1),
      },
    };
  }
  return state;
}

const PERSIST_QUERY_KEY_SELECTORS: Array<KeySelector> = [
  ////////////////////////
  // Used by the app initalization flow. Caching these helps the app load faster.
  ////////////////////////
  {
    key: buildUserKey({ isCurrentUser: true }),
  },
  {
    key: buildClientConfigKey(),
  },
  {
    key: buildOnboardingStateKey(),
  },
  {
    key: buildPrimaryAddressKey(),
  },
  {
    key: buildProductCatalogKey(),
  },
  {
    key: buildRecoveryKey(),
  },
  {
    key: buildRecoveryAddressKey(),
  },
  {
    key: buildRecoveryAddressChangeKey(),
  },
  {
    key: buildRecoveryAddressChangeHashKey(),
  },
  {
    key: buildUserAppContextKey(),
  },
  {
    key: buildUserPreferencesKey(),
  },
  ////////////////////////
  // Keys that are used to load app content fast and to work offline.
  ////////////////////////
  {
    // The home screen pagers suspends on this key's fetch.
    //
    // We could remove the suspense but it'll require some work to reduce flickering
    // and to not block on fetch errors.
    key: buildUserChannelsForCategoryKey({ category: 'favorites' }),
  },
  {
    // The backup mnemonic prompt suspends on this key's fetch.
    key: buildSignersKey(),
  },
  {
    key: buildWalletPositionsKey(),
    predicate: dataExists,
  },
  {
    key: buildDirectCastInboxByAccountKey({ category: 'default' }),
    predicate: pagesNotEmpty,
    transform: onlyFirstPage,
  },
  {
    key: buildFeedItemsKey({ feedKey: 'home', feedType: 'default' }),
    predicate: pagesNotEmpty,
    transform: onlyFirstPage,
  },
  {
    key: buildFeedItemsKey({
      feedKey: 'following',
      feedType: 'default',
    }),
    predicate: pagesNotEmpty,
    transform: onlyFirstPage,
  },
];

// React Query optimizes writes into the cache by recursively comparing and merging the new data with the old data.
// That helps reduce rerenders since writes only happen if the data changed. However, there is an overhead that we
// might not want to pay for in all cases.
//
// The deep merge performed by React Query will be disabled for the following query keys.
// Good candidates are queries that we tend to write to ourselves and large datasets with fields that change frequently.
const DISABLE_STRUCTURAL_SHARING_QUERY_KEYS: QueryKey[] = [
  buildGloballyCachedTokenKey(),
  buildGloballyCachedCastKey(),
  buildGloballyCachedChannelKey(),
  buildGloballyCachedUserKey(),
  buildGloballyCachedTotpTokenKey(),
  buildGloballyCachedDirectCastInboxConversationKey(),
  buildCastAttachmentCacheKey(),
  buildCastAttachmentPreviewCacheKey(),
];

// Set of the first key segment of every persisted selector. `dehydrate` runs
// on every query-cache mutation and calls shouldDehydrateQuery for EVERY query
// in the cache — during feed scroll that is hundreds of globally-cached
// cast/user/channel queries. Since partialMatchKey requires the query key to
// start with a selector key, any query whose root segment isn't one of these
// can never match, so we reject it in O(1) before the linear selector scan.
// This does not change WHICH queries are persisted (the set is derived from the
// same selectors); it only avoids ~O(queries × selectors) partialMatchKey work.
const PERSIST_ROOT_KEYS: Set<unknown> = new Set(
  PERSIST_QUERY_KEY_SELECTORS.map(({ key }) => key[0]),
);

const dehydrateOptions: PersistQueryClientProviderProps['persistOptions']['dehydrateOptions'] =
  {
    shouldDehydrateMutation: () => false,
    shouldDehydrateQuery: ({ queryKey, state }) => {
      if (state.status !== 'success') {
        return false;
      }
      if (!PERSIST_ROOT_KEYS.has(queryKey[0])) {
        return false;
      }
      return PERSIST_QUERY_KEY_SELECTORS.some(({ key, predicate }) => {
        if (partialMatchKey(queryKey, key)) {
          return predicate ? predicate(state) : true;
        }
        return false;
      });
    },
  };

const selectivePersister = new SelectiveMMKVPersister(
  PERSIST_QUERY_KEY_SELECTORS,
);

// Bump this whenever the persisted query SHAPE changes, or to force a
// one-time field-wide wipe of the MMKV cache (e.g. to rescue users wedged on
// a poisoned cold-start cache). Persisted clients previously had no buster
// (""), so shipping any non-empty value here busts every existing cache once.
const PERSIST_SCHEMA_VERSION = '1';

// Tie the buster to the native app/build version so each store release also
// starts from a clean persisted cache. We intentionally omit Updates.updateId
// so routine OTA updates don't wipe the cache on every JS push (which would
// negate the offline/cold-start value of persistence); bump
// PERSIST_SCHEMA_VERSION instead when an OTA needs to force a wipe.
const PERSIST_BUSTER = [
  PERSIST_SCHEMA_VERSION,
  Application.nativeApplicationVersion ?? 'unknown',
  Application.nativeBuildVersion ?? 'unknown',
].join('-');

type Props = {
  children: React.ReactNode;
};

const setupQueryKeyDefaults = () => {
  for (const key of DISABLE_STRUCTURAL_SHARING_QUERY_KEYS) {
    queryClient.setQueryDefaults(key, {
      structuralSharing: false,
    });
  }
  for (const { key } of PERSIST_QUERY_KEY_SELECTORS) {
    queryClient.setQueryDefaults(key, {
      gcTime: MAX_AGE,
    });
  }

  // Client config gates the first render (Navigation suspends on it). The
  // global retry: 3 + exponential backoff means a flaky-network boot can spend
  // tens of seconds retrying before the user sees the "Try again" screen. Cap
  // retries for this one boot-critical query so failure surfaces quickly; the
  // retry UI and refetch-on-reconnect recover it. Paired with
  // DEFAULT_TIMEOUT_CLIENT_CONFIG (8s) this bounds a dead-network boot to
  // ~10-15s instead of ~30-55s. Re-set after the loop above (which only set
  // gcTime for this key) so both defaults apply.
  queryClient.setQueryDefaults(buildClientConfigKey(), {
    gcTime: MAX_AGE,
    retry: 1,
  });

  // Scope longer staleness to wallet positions only (avoid broad query impact).
  queryClient.setQueryDefaults(buildWalletPositionsKey(), {
    gcTime: MAX_AGE,
    staleTime: 30_000,
  });
};

export const FarcasterQueryClientProvider = ({ children }: Props) => {
  const [doneWithMigrations, setDoneWithMigrations] = React.useState(false);

  React.useEffect(() => {
    const run = async () => {
      await migrateReactQueryCache();
      setDoneWithMigrations(true);
      setupQueryKeyDefaults();
    };
    run();
  }, []);

  if (!doneWithMigrations) {
    return (
      <FullScreenLoadingIndicator debugName="FarcasterQueryClientProvider" />
    );
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        maxAge: MAX_AGE,
        buster: PERSIST_BUSTER,
        persister: selectivePersister,
        dehydrateOptions: dehydrateOptions,
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
};
