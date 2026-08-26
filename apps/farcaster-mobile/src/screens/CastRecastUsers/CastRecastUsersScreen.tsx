import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { ApiUser, CastHashPrefix } from 'farcaster-client-data';
import {
  useCastRecastersWithRefreshOnMount,
  userKeyExtractor,
  useUserCast,
} from 'farcaster-client-hooks';
import React, { FC, memo, useMemo } from 'react';
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

type CastRecastUsersScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'CastRecastUsers'
>;

const hideBio = true;

const CastRecastUsersScreen = buildScreen<CastRecastUsersScreenProps>(
  { name: 'CastRecastUsers' },
  ({ route: { params } }) => {
    if ('castHash' in params) {
      return <CastRecastUsersContent castHash={params.castHash} />;
    }

    return (
      <CastRecastUsersForUsernameAndCastHashPrefix
        username={params.username}
        castHashPrefix={params.castHashPrefix}
      />
    );
  },
);

type CastRecastUsersForUsernameAndCastHashPrefixProps = {
  username: string;
  castHashPrefix: CastHashPrefix;
};

const CastRecastUsersForUsernameAndCastHashPrefix: FC<CastRecastUsersForUsernameAndCastHashPrefixProps> =
  memo(({ username, castHashPrefix }) => {
    const {
      result: { cast },
    } = useUserCast({ username: username, hashPrefix: castHashPrefix }).data!;

    return <CastRecastUsersContent castHash={cast.hash} />;
  });

type CastRecastUsersContentProps = {
  castHash: string;
};

const CastRecastUsersContent: FC<CastRecastUsersContentProps> = memo(
  ({ castHash }) => {
    const t = useTheme();

    const { data, refetch, fetchNextPage } = useCastRecastersWithRefreshOnMount(
      {
        castHash,
      },
    );

    const users = useMemo(
      () => (data!.pages || []).flatMap((page) => page.result.users),
      [data],
    );
    const { refreshControl } = usePullToRefreshInfinite({ refetch });

    useReportErrorOnDuplicateKeys(
      'CastRecastUsersScreen',
      users,
      userKeyExtractor,
    );

    if (users.length === 0) {
      return (
        <View style={[t.hFull]}>
          <Empty
            message="No users have recasted this cast, yet."
            refresh={refetch}
          />
        </View>
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
  <User user={user} hideBio={hideBio} />
);

export { CastRecastUsersScreen };
