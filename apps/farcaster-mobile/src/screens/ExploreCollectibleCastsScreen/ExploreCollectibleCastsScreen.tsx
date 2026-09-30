import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList, FlashListRef, ListRenderItem } from '@shopify/flash-list';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiCollectibleCastsIndexKey,
  ApiCollectibleCastsIndexSort,
} from 'farcaster-client-data';
import {
  CastWithActiveAuction,
  CastWithMintedCollectible,
  isCastCollectibleExplorable,
  useCastCollectiblesIndex,
  useDebouncedValue,
  useExploreCastCollectibles,
  useResetCastCollectiblesIndexQueries,
  useSetUserPreferences,
  useUserPreferences,
} from 'farcaster-client-hooks';
import { Text2 } from 'farcaster-expo';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, View } from 'react-native';

import {
  BottomSheetModal,
  useBottomSheetModalRef,
} from '~/components/BottomSheet';
import {
  ExploreCollectibleCastListItem,
  ExploreCollectibleCastListItemPlaceholder,
} from '~/components/CollectibleCast/ExploreCollectibleCastListItem';
import { buildScreen } from '~/components/Screen';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { CommonStackParamList } from '~/types';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';
import {
  useForceZeroScrollInsets,
  ZERO_SCROLL_INSET_PROPS,
} from '~/utils/ScrollInsetUtils';

import { CollectibleCastsCarousel } from './CollectibleCastsCarousel';
import { CollectibleCastsFilterSheet } from './CollectibleCastsFilterSheet';
import { CollectibleCastsTabs } from './CollectibleCastsTabs';

type ExploreCollectibleCastsScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'ExploreCollectibleCastsScreen'
>;

export type CollectibleCastsExploreTab =
  | 'trending'
  | 'top'
  | 'my_bids'
  | 'my_casts';

const ExploreCollectibleCastsScreen =
  buildScreen<ExploreCollectibleCastsScreenProps>(
    { name: 'ExploreCollectibleCastsScreen' },
    () => {
      const t = useTheme();
      const { data, refetch: refetchExplore } = useExploreCastCollectibles({
        refetchOnMount: true,
      });

      const bottomSheetModalRef = useBottomSheetModalRef();
      const { trackEvent } = useAnalytics();
      const { data: userPreferences } = useUserPreferences();
      const setUserPreferences = useSetUserPreferences(true);

      const [refreshing, setRefreshing] = useState(false);
      const [tab, setTab] = useState<CollectibleCastsExploreTab>('trending');
      const [topSort, setTopSort] =
        useState<ApiCollectibleCastsIndexSort>('price desc');
      const [myBidsSort, setMyBidsSort] =
        useState<ApiCollectibleCastsIndexSort>('expiry asc');
      const [expiringSoon, setExpiringSoon] = useState(false);
      const [expiring24h, setExpiring24h] = useState(false);
      const [following, setFollowing] = useState(false);

      const changeTab = useCallback(
        (newTab: CollectibleCastsExploreTab) => {
          setTab(newTab);

          trackEvent(AnalyticsEvent.ClickExploreCollectibleCastsTab, {
            tab: newTab,
          });
        },
        [trackEvent],
      );

      useEffect(() => {
        if (userPreferences?.result.preferences.showCollectibleCastIntro) {
          setUserPreferences({
            preferences: {
              showCollectibleCastIntro: false,
            },
          });
        }
      }, [setUserPreferences, userPreferences]);

      // Wrapped setters to ensure mutual exclusivity between expiringSoon and expiring24h
      const handleSetExpiringSoon = useCallback((value: boolean) => {
        setExpiringSoon(value);
        if (value) {
          setExpiring24h(false);
        }
      }, []);

      const handleSetExpiring24h = useCallback((value: boolean) => {
        setExpiring24h(value);
        if (value) {
          setExpiringSoon(false);
        }
      }, []);

      const filters = useMemo(
        () => ({
          expiringSoon,
          expiring24h,
        }),
        [expiring24h, expiringSoon],
      );

      // Decouple filter state updates from flashlist rerenders
      const debouncedFilters = useDebouncedValue({
        value: filters,
        debounceDuration: 15,
      });

      // Decouple filter state updates from flashlist rerenders
      const debouncedTopSort = useDebouncedValue({
        value: topSort,
        debounceDuration: 15,
      });

      // Decouple filter state updates from flashlist rerenders
      const debouncedMyBidsSort = useDebouncedValue({
        value: myBidsSort,
        debounceDuration: 15,
      });

      const key = ((): ApiCollectibleCastsIndexKey => {
        switch (tab) {
          case 'top':
          case 'trending':
            return 'trending';
          case 'my_bids':
            return 'bid_on';
          case 'my_casts':
            return 'my_casts';
        }
      })();

      const sort = ((): ApiCollectibleCastsIndexSort => {
        switch (tab) {
          case 'top':
            return debouncedTopSort;
          case 'trending':
            return 'trending desc';
          case 'my_bids':
            return debouncedMyBidsSort;
          case 'my_casts':
            return 'last_bid desc';
        }
      })();

      const {
        data: indexData,
        onEndReached,
        isLoading,
        refetch: refetchIndex,
      } = useCastCollectiblesIndex(
        {
          key,
          sortCci: sort,
          following,
          ...debouncedFilters,
          limit: 15,
        },
        {
          staleTime: 1000 * 60,
        },
      );

      const resetCollectibleCastIndexQueries =
        useResetCastCollectiblesIndexQueries();

      // Reset queries on unmount so we don't end up refreshing N pages on
      // remount and instead just start fresh
      useEffect(() => {
        return () => {
          resetCollectibleCastIndexQueries();
        };
      }, [resetCollectibleCastIndexQueries]);

      const onFilterPress = useCallback(() => {
        bottomSheetModalRef.current?.present();
      }, [bottomSheetModalRef]);

      const carouselCasts = useMemo(() => {
        return data?.result.casts || [];
      }, [data]);

      const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
          await Promise.all([refetchExplore(), refetchIndex()]);
        } finally {
          setRefreshing(false);
        }
      }, [refetchExplore, refetchIndex]);

      const dismissFilters = useCallback(() => {
        bottomSheetModalRef.current?.dismiss();
      }, [bottomSheetModalRef]);

      useFocusEffect(
        useCallback(() => {
          trackEvent(AnalyticsEvent.ViewExploreCollectibleCasts);
        }, [trackEvent]),
      );

      const active = useMemo(
        () => (indexData ? indexData.filter(isCastCollectibleExplorable) : []),
        [indexData],
      );
      const listRef =
        React.useRef<
          FlashListRef<CastWithActiveAuction | CastWithMintedCollectible>
        >(null);
      const isFocused = useIsFocused();
      useForceZeroScrollInsets({
        ref: listRef,
        enabled: isFocused,
      });

      const renderItem = useCallback<
        ListRenderItem<CastWithActiveAuction | CastWithMintedCollectible>
      >(
        ({ item: cast }) => {
          return (
            <View style={{ paddingVertical: 10, paddingHorizontal: 12 }}>
              <ExploreCollectibleCastListItem
                cast={cast}
                bidOnView={tab === 'my_bids'}
              />
            </View>
          );
        },
        [tab],
      );

      const ListEmptyComponent = useCallback(() => {
        if (isLoading) {
          return (
            <>
              {Array.from({ length: 5 }).map((_, index) => (
                <View
                  key={index}
                  style={{ paddingVertical: 10, paddingHorizontal: 12 }}
                >
                  <ExploreCollectibleCastListItemPlaceholder />
                </View>
              ))}
            </>
          );
        }

        return (
          <View
            style={{
              paddingTop: 40,
              paddingHorizontal: 40,
              justifyContent: 'center',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Text2 weight="semibold" align="center">
              {((): string => {
                switch (tab) {
                  case 'my_casts':
                    return 'No one has bid on your casts';
                  case 'trending':
                  case 'top':
                    return 'No collectibles match your filters';
                  case 'my_bids':
                    return "You haven't bid on any casts";
                }
              })()}
            </Text2>
            <Text2 color="secondary" size="sm" align="center">
              {((): string => {
                switch (tab) {
                  case 'my_casts':
                    return 'Start casting!';
                  case 'trending':
                  case 'top':
                    return 'Try adjusting your criteria or clearing filters.';
                  case 'my_bids':
                    return 'Explore auctions and start bidding on your favorite casts.';
                }
              })()}
            </Text2>
          </View>
        );
      }, [isLoading, tab]);

      // Note: ListHeaderComponent is intentionally not memoized since doing so
      // causes a change in tabs to re-render the carousel, provide components
      // and let React reconiliation handle the rest.
      return (
        <View style={[t.flex1]}>
          <FlashList
            ref={listRef}
            data={active}
            renderItem={renderItem}
            keyExtractor={extractCollectibleCastKey}
            ListHeaderComponent={
              <>
                <CollectibleCastsCarousel casts={carouselCasts} />
                <CollectibleCastsTabs
                  tab={tab}
                  onTabChange={changeTab}
                  onFilterPress={onFilterPress}
                />
              </>
            }
            ListEmptyComponent={ListEmptyComponent}
            onEndReachedThreshold={0.2}
            onEndReached={onEndReached}
            {...ZERO_SCROLL_INSET_PROPS}
            {...STANDARD_FLASHLIST_PERF_PROPS}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
          <BottomSheetModal
            name="collectibleCastsFilter"
            ref={bottomSheetModalRef}
            enableDynamicSizing={true}
          >
            <CollectibleCastsFilterSheet
              tab={tab}
              topSort={topSort}
              myBidsSort={myBidsSort}
              expiringSoon={expiringSoon}
              expiring24h={expiring24h}
              following={following}
              setTopSort={setTopSort}
              setMyBidsSort={setMyBidsSort}
              onExpiringSoonChange={handleSetExpiringSoon}
              onExpiring24hChange={handleSetExpiring24h}
              onFollowingChange={setFollowing}
              onClose={dismissFilters}
            />
          </BottomSheetModal>
        </View>
      );
    },
  );

const extractCollectibleCastKey = (
  item: CastWithActiveAuction | CastWithMintedCollectible,
) => item.hash;

export { ExploreCollectibleCastsScreen };
