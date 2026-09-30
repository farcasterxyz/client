import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { ApiUser } from 'farcaster-client-data';
import { useNotificationActorsInGroupWithRefreshOnMount } from 'farcaster-client-hooks';
import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { User } from '~/components/users';
import { onEndReachedThreshold } from '~/constants/FlatList';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePullToRefreshInfinite } from '~/hooks/data/usePullToRefreshInfinite';
import { NotificationsStackParamList } from '~/types';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';

type NotificationActorsInGroupScreenProps = NativeStackScreenProps<
  NotificationsStackParamList,
  'NotificationActorsInGroup'
>;

const NotificationActorsInGroupScreen =
  buildScreen<NotificationActorsInGroupScreenProps>(
    { name: 'NotificationActorsInGroup' },
    ({ route: { params } }) => {
      const t = useTheme();
      const { setOptions } = useNavigation();

      const { groupId, type } = params;
      const { data, fetchNextPage, refetch } =
        useNotificationActorsInGroupWithRefreshOnMount({
          groupId,
          type,
        });

      const { refreshControl } = usePullToRefreshInfinite({ refetch });

      const users = useMemo(
        () => data?.pages.flatMap((page) => page.result.actors) || [],
        [data],
      );

      useEffect(() => {
        const getHeaderTitle = () => {
          switch (type) {
            case 'cast-mention':
              return 'Mentioned By';
            case 'cast-reaction':
              return 'Liked By';
            case 'cast-reply':
              return 'Replies From';
            case 'follow':
              return 'Followed By';
            case 'recast':
              return 'Recast By';
            case 'nearby':
              return params.locationDescription;
            default:
              return 'Notifications';
          }
        };

        setOptions({ headerTitle: getHeaderTitle() });
      }, [setOptions, type, params]);

      return (
        <View style={[t.hFull]}>
          <FlashList
            data={users}
            keyExtractor={extractKey}
            refreshControl={refreshControl}
            onEndReached={() => fetchNextPage()}
            onEndReachedThreshold={onEndReachedThreshold}
            {...STANDARD_FLASHLIST_PERF_PROPS}
            renderItem={renderItem}
          />
        </View>
      );
    },
  );

NotificationActorsInGroupScreen.displayName = 'NotificationActorsInGroupScreen';

const extractKey = (item: ApiUser) => item.fid.toString();

const renderItem = ({ item }: { item: ApiUser }) => {
  return <User user={item} hideBio={false} />;
};

export { NotificationActorsInGroupScreen };
