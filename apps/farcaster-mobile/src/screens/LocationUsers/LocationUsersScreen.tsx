import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { ApiUser } from 'farcaster-client-data';
import {
  useLocationUsersWithRefreshOnMount,
  userKeyExtractor,
} from 'farcaster-client-hooks';
import React, { useMemo } from 'react';
import { View } from 'react-native';

import { Empty } from '~/components/Empty';
import { buildScreen } from '~/components/Screen';
import { User } from '~/components/users/User';
import { onEndReachedThreshold } from '~/constants/FlatList';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePullToRefreshInfinite } from '~/hooks/data/usePullToRefreshInfinite';
import { useReportErrorOnDuplicateKeys } from '~/hooks/useReportErrorOnDuplicateKeys';
import { CommonStackParamList } from '~/types';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';

type LocationUsersScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'LocationUsers'
>;

const LocationUsersScreen = buildScreen<LocationUsersScreenProps>(
  { name: 'LocationUsers' },
  ({
    route: {
      params: { placeId },
    },
  }) => {
    const t = useTheme();

    const { data, refetch, fetchNextPage } = useLocationUsersWithRefreshOnMount(
      {
        placeId,
      },
    );

    const users = useMemo(
      () => data?.pages.flatMap((page) => page.result.users) || [],
      [data],
    );
    const { refreshControl } = usePullToRefreshInfinite({ refetch });

    useReportErrorOnDuplicateKeys(
      'LocationUsersScreen',
      users,
      userKeyExtractor,
    );

    if (users.length === 0) {
      return (
        <Empty message="No users have set this location." refresh={refetch} />
      );
    }

    return (
      <View style={[t.hFull]}>
        <FlashList
          data={users}
          keyExtractor={userKeyExtractor}
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

const renderItem = ({ item: user }: { item: ApiUser }) => (
  <User user={user} hideBio={false} />
);

export { LocationUsersScreen };
