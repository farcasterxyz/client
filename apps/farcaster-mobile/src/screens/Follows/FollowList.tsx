import { FlashList, FlashListProps, ListRenderItem } from '@shopify/flash-list';
import { ApiUser } from 'farcaster-client-data';
import { userKeyExtractor } from 'farcaster-client-hooks';
import React, { FC, memo } from 'react';
import { View } from 'react-native';

import { LoadingIndicator } from '~/components/LoadingIndicator';
import { User } from '~/components/users/User';
import { onEndReachedThreshold } from '~/constants/FlatList';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCommonFlatListExtraData } from '~/hooks/useCommonFlatListExtraData';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';

type FollowListProps = {
  onEndReached: () => void;
  refreshControl: React.ComponentProps<typeof FlashList>['refreshControl'];
  users: ApiUser[];
  hasNextPage?: boolean;
  HeaderComponent?: FlashListProps<ApiUser>['ListHeaderComponent'];
  rendererOverride?: ListRenderItem<ApiUser>;
};

const FollowList: FC<FollowListProps> = memo(
  ({
    onEndReached,
    refreshControl,
    users,
    hasNextPage,
    HeaderComponent,
    rendererOverride,
  }) => {
    const t = useTheme();
    const extraData = useCommonFlatListExtraData();

    const renderer = React.useMemo(() => {
      if (typeof rendererOverride === 'function') {
        return rendererOverride;
      }
      return renderItem;
    }, [rendererOverride]);

    return (
      <FlashList
        ListHeaderComponent={HeaderComponent}
        data={users}
        extraData={extraData}
        keyExtractor={userKeyExtractor}
        refreshControl={refreshControl}
        onEndReached={onEndReached}
        onEndReachedThreshold={onEndReachedThreshold}
        {...STANDARD_FLASHLIST_PERF_PROPS}
        renderItem={renderer}
        ListFooterComponent={
          hasNextPage ? (
            <View style={[t.h24, t.mT4]}>
              <LoadingIndicator />
            </View>
          ) : null
        }
      />
    );
  },
);

FollowList.displayName = 'FollowList';

const renderItem = ({ item }: { item: ApiUser }) => (
  <User user={item} hideBio={false} hideFollowsYou />
);

export { FollowList };
