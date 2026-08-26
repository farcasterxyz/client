import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { ApiUser, CastHashPrefix } from 'farcaster-client-data';
import {
  useCastLikesWithRefreshOnMount,
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

type CastReactionUsersScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'CastReactionUsers'
>;

const hideBio = true;

const CastReactionUsersScreen = buildScreen<CastReactionUsersScreenProps>(
  { name: 'CastReactionUsers' },
  ({ route: { params } }) => {
    if ('castHash' in params) {
      return <CastReactionsUsersContent castHash={params.castHash} />;
    }

    return (
      <CastReactionUsersForUsernameAndCastHashPrefix
        username={params.username}
        castHashPrefix={params.castHashPrefix}
      />
    );
  },
);

type CastReactionUsersForUsernameAndCastHashPrefixProps = {
  castHashPrefix: CastHashPrefix;
  username: string;
};

const CastReactionUsersForUsernameAndCastHashPrefix: FC<CastReactionUsersForUsernameAndCastHashPrefixProps> =
  memo(({ castHashPrefix, username }) => {
    const {
      result: { cast },
    } = useUserCast({
      username: username,
      hashPrefix: castHashPrefix,
    }).data!;

    return <CastReactionsUsersContent castHash={cast.hash} />;
  });

type CastReactionsUsersContentProps = {
  castHash: string;
};

const CastReactionsUsersContent: FC<CastReactionsUsersContentProps> = memo(
  ({ castHash }) => {
    const t = useTheme();

    const { data, refetch, fetchNextPage } = useCastLikesWithRefreshOnMount({
      castHash,
    });

    const users = useMemo(
      () =>
        (data!.pages || [])
          .flatMap((page) => page.result.likes)
          .map((r) => r.reactor),
      [data],
    );
    const { refreshControl } = usePullToRefreshInfinite({ refetch });

    useReportErrorOnDuplicateKeys(
      'CastReactionUsersScreen',
      users,
      userKeyExtractor,
    );

    if (users.length === 0) {
      return (
        <View style={[t.hFull]}>
          <Empty
            message="No users have liked this cast, yet."
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

export { CastReactionUsersScreen };
