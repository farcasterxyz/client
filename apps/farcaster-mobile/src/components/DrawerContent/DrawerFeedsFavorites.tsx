import { Octicons } from '@expo/vector-icons';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  useAddFavoriteFeed,
  useInvalidateFeedSummaries,
  useRemoveFavoriteFeed,
  useSetUserPreferences,
  useUserChannelsForCategory,
  useUserPreferences,
} from 'farcaster-client-hooks';
import { hitSlop, Text, Text2 } from 'farcaster-expo';
import { PencilRulerIcon, PlusCircleIcon, Star } from 'lucide-react-native';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, TouchableOpacity, View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import {
  DrawerFeedItem,
  DrawerItem,
  ExtendedFeedRoute,
} from '~/components/DrawerContent/DrawerItem';
import { useDrawerTouchablePress } from '~/components/DrawerContent/drawerPressHandlers';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { usePullToRefreshInfinite } from '~/hooks/data/usePullToRefreshInfinite';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { useNavigateToFeed } from '~/hooks/navigation/useNavigateToFeed';
import { useCommonFlatListExtraData } from '~/hooks/useCommonFlatListExtraData';
import { FeedRoute } from '~/hooks/useFeedRoutes';
import { useUserAppContextGate } from '~/hooks/useUserAppContextGate';

export const KNOWN_NON_CHANNEL_FEEDS = ['following', 'all-channels', 'nfts'];

const FavoritesExpandableHeader = memo(
  ({
    expandFavoriteFeeds,
    onToggleExpand,
  }: {
    expandFavoriteFeeds: boolean;
    onToggleExpand: () => void;
  }) => {
    const t = useTheme();
    const pressProps = useDrawerTouchablePress(onToggleExpand);

    return (
      <TouchableOpacity
        hitSlop={hitSlop}
        style={[
          t.flexRow,
          t.justifyBetween,
          t.itemsCenter,
          { marginVertical: 10 },
          { paddingVertical: 6 },
        ]}
        activeOpacity={0.5}
        {...pressProps}
      >
        <Text2 color="primary" weight="regular" style={{ fontSize: 15 }}>
          Favorites
        </Text2>
        <View style={[t.flex]}>
          <Octicons
            name={expandFavoriteFeeds === false ? 'chevron-down' : 'chevron-up'}
            size={20}
            color={t.colors.text.tertiary}
          />
        </View>
      </TouchableOpacity>
    );
  },
);

FavoritesExpandableHeader.displayName = 'FavoritesExpandableHeader';

const FavoritesEmptyManageChannels = memo(
  ({ onManageAllChannels }: { onManageAllChannels: () => void }) => {
    const t = useTheme();
    const pressProps = useDrawerTouchablePress(onManageAllChannels);

    return (
      <TouchableOpacity
        style={[t.flex, t.pX4, t.mB2, t.selfStart]}
        {...pressProps}
        activeOpacity={0.75}
      >
        <View style={[t.flexRow, t.flex, t.itemsCenter, t.pY3, { gap: 8 }]}>
          <Text style={[t.texts.brand]}>Update your favorite channels</Text>
          <Octicons name="arrow-right" color={t.colors.text.brand} />
        </View>
      </TouchableOpacity>
    );
  },
);

FavoritesEmptyManageChannels.displayName = 'FavoritesEmptyManageChannels';

function generateDrawerFeedSections({
  routes,
  onPress,
}: {
  routes: FeedRoute[];
  onPress: (feedKey?: string) => void;
}): {
  favorite: ExtendedFeedRoute[];
} {
  const favorite: ExtendedFeedRoute[] = [];

  routes.forEach((feedRoute) => {
    const feed = {
      ...feedRoute,
      name: feedRoute.key,
      onPress,
    };

    favorite.push(feed);
  });

  favorite.sort((a, b) => {
    return (
      a.viewerContext!.favoritePosition! - b.viewerContext!.favoritePosition!
    );
  });

  return { favorite };
}

const DrawerFeedsFavorites = memo(() => {
  return (
    <React.Suspense>
      <DrawerFeeds />
    </React.Suspense>
  );
});

DrawerFeedsFavorites.displayName = 'DrawerFeedsFavorites';

const DrawerFeeds = memo(() => {
  const { fid } = useCurrentUser_UNSAFE();

  const { trackEvent } = useAnalytics();
  const t = useTheme();

  const { data: userPreferences } = useUserPreferences();
  const setUserPreferences = useSetUserPreferences();

  const [expandFavoriteFeeds, setExpandFavoriteFeeds] = useState(
    !(userPreferences?.result.preferences.expandFavoriteFeeds === false),
  );

  const navigateToFeed = useNavigateToFeed();
  const onPressFeed = useCallback(
    (feedKey?: string) => {
      if (feedKey) {
        trackEvent(AnalyticsEvent.PressChannelNavDrawer, { feedKey });

        navigateToFeed(feedKey);
      }
    },
    [navigateToFeed, trackEvent],
  );

  const updateExpandFavoriteFeeds = useCallback(
    (expand: boolean) => {
      setExpandFavoriteFeeds(expand);
      setUserPreferences({ preferences: { expandFavoriteFeeds: expand } });
    },
    [setUserPreferences],
  );

  const { data, refetch } = useUserChannelsForCategory({
    fid,
    category: 'favorites',
  });

  const routesRaw = React.useMemo(() => {
    const routes: FeedRoute[] = [];

    (data.pages.flatMap((p) => p.items) || []).forEach((summary) => {
      if (
        summary.type !== 'channel' &&
        !KNOWN_NON_CHANNEL_FEEDS.includes(summary.key)
      ) {
        return;
      }

      routes.push({
        type: summary.type,
        key: summary.key,
        name: summary.name,
        imageUrl: summary.imageUrl,
        sectionRank: summary.sectionRank,
        viewerContext: {
          hasUnseenItems: summary.viewerContext.hasUnseenItems,
          favoritePosition:
            // -1 with sorting above would result feeds to appear at the top. That is not what we want to
            // do here as users will have something at the top for home feed tab arrangement
            typeof summary.viewerContext.favoritePosition === 'undefined' ||
            summary.viewerContext.favoritePosition === -1
              ? 10_000
              : summary.viewerContext.favoritePosition,
          activityRank: summary.viewerContext.activityRank,
        },
      });
    });

    return routes;
  }, [data.pages]);

  const [routes, setRoutes] = useState(routesRaw);

  useEffect(() => {
    setRoutes(routesRaw);
  }, [routesRaw]);

  const feeds = useMemo(() => {
    return generateDrawerFeedSections({
      routes,
      onPress: onPressFeed,
    });
  }, [onPressFeed, routes]);

  const { refreshControl } = usePullToRefreshInfinite({
    refetch,
  });

  const addFavoriteFeed = useAddFavoriteFeed();
  const removeFavoriteFeed = useRemoveFavoriteFeed();
  const toast = useToast();
  const invalidateFeedSummaries = useInvalidateFeedSummaries();

  const onFavoriteFeed = useCallback(
    async (feedKey: string) => {
      try {
        setRoutes((currentRoutes) => {
          const route = currentRoutes.find((route) => route.key === feedKey);
          if (route) {
            route.viewerContext ||= { favoritePosition: 10000 };
            route.viewerContext.favoritePosition = 10000;
            return [...currentRoutes];
          }
          return currentRoutes;
        });

        await addFavoriteFeed({ feedKey: feedKey, channel: undefined, fid });
      } catch {
        invalidateFeedSummaries();
        toast.show('Error favoriting feed, please try again', {
          type: 'danger',
          placement: 'top',
        });
      }
    },
    [addFavoriteFeed, fid, invalidateFeedSummaries, toast],
  );

  const onUnfavoriteFeed = useCallback(
    async (feedKey: string, favoritePosition: number) => {
      try {
        setRoutes((currentRoutes) => {
          const route = currentRoutes.find((route) => route.key === feedKey);
          if (route) {
            route.viewerContext ||= { favoritePosition: -1 };
            route.viewerContext.favoritePosition = -1;
            return [...currentRoutes];
          }
          return currentRoutes;
        });
        await removeFavoriteFeed({
          feedKey,
          favoritePosition,
          channel: undefined,
          fid,
        });
      } catch {
        invalidateFeedSummaries();
        toast.show('Error unfavoriting feed, please try again', {
          type: 'danger',
          placement: 'top',
        });
      }
    },
    [fid, invalidateFeedSummaries, removeFavoriteFeed, toast],
  );

  const extraData = useCommonFlatListExtraData();

  const favoritesAfterCollapsing = useMemo(
    () => (expandFavoriteFeeds ? feeds.favorite : []),
    [expandFavoriteFeeds, feeds.favorite],
  );

  const shouldShowChevron = useMemo(() => {
    return feeds.favorite.length > 5;
  }, [feeds.favorite]);

  const { checkUserAppContextGate } = useUserAppContextGate();

  const viewerPrefersNoCreateChannels =
    !checkUserAppContextGate('create-channels').value;

  const favoritesWithOtherSections: {
    type: 'feed' | 'add-to-favorites' | 'manage-channels' | 'create-channels';
    value?: ExtendedFeedRoute;
  }[] = useMemo(() => {
    if (!expandFavoriteFeeds && shouldShowChevron) {
      return [];
    }

    const feeds = favoritesAfterCollapsing.map((feed) => ({
      type: 'feed' as const,
      value: feed,
    }));

    const fullSections: {
      type: 'feed' | 'add-to-favorites' | 'manage-channels' | 'create-channels';
      value?: ExtendedFeedRoute;
    }[] = [...feeds, { type: 'manage-channels' }];

    if (!viewerPrefersNoCreateChannels) {
      fullSections.push({ type: 'create-channels' });
    }

    return fullSections;
  }, [
    expandFavoriteFeeds,
    favoritesAfterCollapsing,
    shouldShowChevron,
    viewerPrefersNoCreateChannels,
  ]);

  const ListHeaderComponent = useMemo(() => {
    if (shouldShowChevron) {
      return (
        <FavoritesExpandableHeader
          expandFavoriteFeeds={expandFavoriteFeeds}
          onToggleExpand={() => updateExpandFavoriteFeeds(!expandFavoriteFeeds)}
        />
      );
    }

    return (
      <View
        style={[
          t.flexRow,
          t.mT3,
          t.justifyBetween,
          t.itemsCenter,
          { paddingVertical: 6 },
        ]}
      >
        <Text2 color="primary" size="base" weight="regular">
          Favorites
        </Text2>
      </View>
    );
  }, [
    expandFavoriteFeeds,
    shouldShowChevron,
    updateExpandFavoriteFeeds,
    t.flexRow,
    t.itemsCenter,
    t.justifyBetween,
    t.mT3,
  ]);

  const navigate = useNavigate();

  const onManageAllChannels = React.useCallback(() => {
    navigate('ManageChannels', {});
  }, [navigate]);

  const ListEmptyComponent = useMemo(() => {
    if (feeds.favorite.length > 0) {
      return null;
    }

    return (
      <FavoritesEmptyManageChannels onManageAllChannels={onManageAllChannels} />
    );
  }, [feeds.favorite.length, onManageAllChannels]);

  const renderItem = useCallback(
    ({
      item,
    }: {
      item: {
        type:
          | 'feed'
          | 'add-to-favorites'
          | 'manage-channels'
          | 'create-channels';
        value?: ExtendedFeedRoute;
      };
    }) => (
      <>
        {item.type === 'feed' && item.value && (
          <DrawerFeedItem
            feed={item.value}
            onFavoriteFeed={onFavoriteFeed}
            onUnfavoriteFeed={onUnfavoriteFeed}
          />
        )}
        {item.type === 'add-to-favorites' && (
          <DrawerItem
            name="Add to favorite"
            icon={<Star size={20} color={t.colors.text.primary} />}
            onPress={() => {
              navigate('Follows', {
                fid,
                initialTab: 'following',
              });
            }}
            isActive={false}
          />
        )}
        {item.type === 'manage-channels' && (
          <DrawerItem
            name="Manage channels"
            icon={<PencilRulerIcon size={20} color={t.colors.text.primary} />}
            onPress={() => {
              onManageAllChannels();
            }}
            isActive={false}
          />
        )}
        {item.type === 'create-channels' && (
          <DrawerItem
            name="Create a channel"
            icon={<PlusCircleIcon size={20} color={t.colors.text.primary} />}
            onPress={() => {
              navigate('CreateChannel', {});
            }}
            isActive={false}
          />
        )}
      </>
    ),
    [
      onFavoriteFeed,
      onUnfavoriteFeed,
      navigate,
      onManageAllChannels,
      t.colors.text.primary,
      fid,
    ],
  );

  const keyExtractor = useCallback(
    ({
      type,
      value,
    }: {
      type: 'feed' | 'manage-channels' | 'create-channels' | 'add-to-favorites';
      value?: ExtendedFeedRoute;
    }) => {
      if (type !== 'feed' || !value) {
        return type;
      }
      return `feed-${value.key}`;
    },
    [],
  );

  return useMemo(
    () => (
      <View style={[t.flex1, t.pX4]}>
        <FlatList
          showsVerticalScrollIndicator={false}
          data={favoritesWithOtherSections}
          extraData={extraData}
          style={t.hFull}
          contentContainerStyle={t.pB3}
          ListHeaderComponent={ListHeaderComponent}
          ListEmptyComponent={ListEmptyComponent}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          refreshControl={refreshControl}
          keyboardShouldPersistTaps={'handled'}
        />
      </View>
    ),
    [
      ListEmptyComponent,
      ListHeaderComponent,
      extraData,
      favoritesWithOtherSections,
      keyExtractor,
      refreshControl,
      renderItem,
      t.flex1,
      t.hFull,
      t.pB3,
      t.pX4,
    ],
  );
});

DrawerFeeds.displayName = 'DrawerFeeds';

export { DrawerFeedsFavorites };
