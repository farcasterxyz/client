import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { ApiUser } from 'farcaster-client-data';
import {
  useLeastInteractedWithFollowingWithRefreshOnMount,
  userKeyExtractor,
} from 'farcaster-client-hooks';
import React from 'react';
import { View } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { UnfollowLeastInteractedWithFollowingButton } from '~/components/UnfollowLeastInteractedWithFollowingButton';
import { User } from '~/components/users';
import { onEndReachedThreshold } from '~/constants/FlatList';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePullToRefreshLeastInteractedWithFollowing } from '~/hooks/data/usePullToRefreshLeastInteractedWithFollowing';
import { useCommonFlatListExtraData } from '~/hooks/useCommonFlatListExtraData';
import { FullParamList } from '~/types';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';

type LeastInteractedWithFollowingScreenProps = NativeStackScreenProps<
  FullParamList,
  'LeastInteractedWithFollowing'
>;

const LeastInteractedWithFollowingScreen =
  buildScreen<LeastInteractedWithFollowingScreenProps>(
    { name: 'LeastInteractedWithFollowing' },
    () => {
      const t = useTheme();

      const { data, fetchNextPage, refetch } =
        useLeastInteractedWithFollowingWithRefreshOnMount();

      const { refreshControl } = usePullToRefreshLeastInteractedWithFollowing({
        refetch,
      });

      const extraData = useCommonFlatListExtraData();

      const users = React.useMemo(
        () => data?.pages.flatMap((page) => page.result.users) || [],
        [data],
      );

      const UnfollowAllHeaderComponent = React.useMemo(() => {
        return (
          <View
            style={[
              t.flex,
              t.flexRow,
              t.justifyBetween,
              t.itemsCenter,
              t.p4,
              t.borderBHairline,
              t.borderDefault,
              t.flexGrow,
            ]}
          >
            <Text
              style={[t.texts.secondary, t.flexShrink, { maxWidth: '70%' }]}
            >
              Users you haven't replied to or reacted to.
            </Text>
            <UnfollowLeastInteractedWithFollowingButton />
          </View>
        );
      }, [
        t.borderBHairline,
        t.borderDefault,
        t.flex,
        t.flexGrow,
        t.flexRow,
        t.flexShrink,
        t.itemsCenter,
        t.justifyBetween,
        t.p4,
        t.texts.secondary,
      ]);

      return (
        <View style={[t.hFull]}>
          <FlashList
            ListHeaderComponent={UnfollowAllHeaderComponent}
            data={users}
            extraData={extraData}
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

const renderItem = ({ item }: { item: ApiUser }) => (
  <User user={item} hideBio={false} />
);

LeastInteractedWithFollowingScreen.displayName =
  'LeastInteractedWithFollowingScreen';

export { LeastInteractedWithFollowingScreen };
