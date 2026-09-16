import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { ApiNotification } from 'farcaster-client-data';
import {
  EventingProvider,
  extractNotificationTabFromGroupId,
  useNotificationsInGroupWithRefreshOnMount,
} from 'farcaster-client-hooks';
import React, { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';

import { Cast } from '~/components/casts/Cast';
import { ListChannelRoleInviteNotification } from '~/components/NotificationGroup/ChannelRoleInviteNotificationGroup';
import { ListCollectibleCastWatchAvailableNotification } from '~/components/NotificationGroup/CollectibleCastNotificationGroup';
import { ListFrameGenericNotification } from '~/components/NotificationGroup/FrameGenericNotificationGroup';
import { ListMiniAppNotification } from '~/components/NotificationGroup/MiniAppNotificationGroup';
import { buildScreen } from '~/components/Screen';
import { onEndReachedThreshold } from '~/constants/FlatList';
import { useTheme } from '~/contexts/ThemeProvider';
import {
  AnimatedImageViewabilityScopeProvider,
  useVideoFeedViewablilityPairs,
} from '~/contexts/VideoFeedViewablilityProvider';
import { usePullToRefreshInfinite } from '~/hooks/data/usePullToRefreshInfinite';
import { usePop } from '~/hooks/navigation/usePop';
import { NotificationsStackParamList } from '~/types';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';

type NotificationsInGroupScreenProps = NativeStackScreenProps<
  NotificationsStackParamList,
  'NotificationsInGroup'
>;

const NotificationsInGroupScreen = buildScreen<NotificationsInGroupScreenProps>(
  { name: 'NotificationsInGroup' },
  ({ route: { params } }) => {
    const t = useTheme();
    const { setOptions } = useNavigation();
    const pop = usePop();

    const { groupId, type } = params;
    const notificationTab = useMemo(
      () => extractNotificationTabFromGroupId(groupId),
      [groupId],
    );

    const { data, fetchNextPage, refetch } =
      useNotificationsInGroupWithRefreshOnMount({
        groupId,
        type,
      });

    const { refreshControl } = usePullToRefreshInfinite({ refetch });

    const notifications = useMemo(
      () => data?.pages.flatMap((page) => page.result.notifications) || [],
      [data],
    );

    useEffect(() => {
      const getHeaderTitle = () => {
        switch (type) {
          case 'new-cast':
          case 'new-cast-in-channel':
          case 'dormant-user-new-cast':
            return 'Casts';
          case 'trending-cast':
            return 'Trending Casts';
          case 'collectible-cast-watch-available':
            return 'Collectibles';
          case 'mini-app':
            return `Notifications from ${params.title}`;
          default:
            return params.title ?? 'Notifications';
        }
      };

      setOptions({ headerTitle: getHeaderTitle() });
    }, [setOptions, type, params]);

    const hadItemsRef = useRef(false);
    useEffect(() => {
      // Go back if we are left with no items after we had some, i.e. we removed them
      if (notifications.length > 0 && hadItemsRef.current === false) {
        hadItemsRef.current = true;
      } else if (notifications.length === 0 && hadItemsRef.current) {
        pop();
      }
    }, [notifications.length, pop]);

    const viewabilityPairsForVideos = useVideoFeedViewablilityPairs();

    return (
      <EventingProvider
        on={`notifications-${notificationTab}`}
        notificationType={type}
      >
        <View style={[t.hFull]}>
          <AnimatedImageViewabilityScopeProvider>
            <FlashList
              data={notifications}
              renderItem={renderItem}
              keyExtractor={extractKey}
              getItemType={getNotificationItemType}
              refreshControl={refreshControl}
              onEndReached={() => fetchNextPage()}
              onEndReachedThreshold={onEndReachedThreshold}
              viewabilityConfigCallbackPairs={viewabilityPairsForVideos}
              {...STANDARD_FLASHLIST_PERF_PROPS}
            />
          </AnimatedImageViewabilityScopeProvider>
        </View>
      </EventingProvider>
    );
  },
);

NotificationsInGroupScreen.displayName = 'NotificationsInGroupScreen';

const extractKey = (item: ApiNotification) => {
  switch (item.type) {
    case 'new-cast':
    case 'new-cast-in-channel':
    case 'dormant-user-new-cast':
    case 'trending-cast':
    case 'channel-pinned-cast':
    case 'collectible-cast-watch-available':
      return item.content.cast.hash;
    default:
      return item.id;
  }
};

const getNotificationItemType = (item: ApiNotification) => {
  switch (item.type) {
    case 'new-cast':
    case 'new-cast-in-channel':
    case 'dormant-user-new-cast':
    case 'trending-cast':
    case 'channel-pinned-cast':
      return 'cast';
    default:
      return item.type;
  }
};

const renderItem = ({ item }: { item: ApiNotification }) => {
  switch (item.type) {
    case 'new-cast':
    case 'new-cast-in-channel':
    case 'dormant-user-new-cast':
    case 'trending-cast':
      return <Cast cast={item.content.cast} />;
    case 'channel-pinned-cast':
      return <Cast cast={item.content.cast} showChannelTags={false} />;
    case 'collectible-cast-watch-available':
      return <ListCollectibleCastWatchAvailableNotification notif={item} />;
    case 'channel-role-invite':
      return <ListChannelRoleInviteNotification notif={item} />;
    case 'frame-generic':
      return <ListFrameGenericNotification notif={item} />;
    case 'mini-app':
      return <ListMiniAppNotification notif={item} />;
    default:
      return null;
  }
};

export { NotificationsInGroupScreen };
