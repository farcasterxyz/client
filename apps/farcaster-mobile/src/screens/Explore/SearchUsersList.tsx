import { FlashList, FlashListProps, FlashListRef } from '@shopify/flash-list';
import { ApiUser } from 'farcaster-client-data';
import { userKeyExtractor } from 'farcaster-client-hooks';
import uniqBy from 'lodash/uniqBy';
import React, {
  FC,
  memo,
  ReactElement,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { View } from 'react-native';

import { Empty } from '~/components/Empty';
import { LoadingIndicator } from '~/components/LoadingIndicator';
import { onEndReachedThreshold } from '~/constants/FlatList';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCommonFlatListExtraData } from '~/hooks/useCommonFlatListExtraData';
import { useDisplayLimit } from '~/hooks/useDisplayLimit';
import { useReportErrorOnDuplicateKeys } from '~/hooks/useReportErrorOnDuplicateKeys';
import { useScrollToTop } from '~/hooks/useScrollToTop';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';

const LIST_BATCH_SIZE = 10;

type SearchUsersProps = {
  emptyMessage?: string;
  fetchNextPage?: () => void;
  refreshControl?: React.ComponentProps<typeof FlashList>['refreshControl'];
  renderItem: ({ item }: { item: ApiUser }) => ReactElement;
  users: ApiUser[] | undefined;
  ListHeaderComponent?: FlashListProps<ApiUser[]>['ListHeaderComponent'];
  hasNextPage?: boolean;
};

const SearchUsersList: FC<SearchUsersProps> = memo(
  ({
    fetchNextPage,
    refreshControl,
    emptyMessage,
    renderItem,
    users,
    ListHeaderComponent,
    hasNextPage,
  }) => {
    const t = useTheme();
    const uniqueUsers: ApiUser[] = useMemo(
      () => uniqBy(users, 'username'),
      [users],
    );

    const { displayedItems: displayedUsers, handleEndReached } =
      useDisplayLimit({
        data: uniqueUsers,
        batchSize: LIST_BATCH_SIZE,
        hasNextPage: hasNextPage ?? false,
        fetchNextPage,
      });

    const flatListRef = useRef<FlashListRef<ApiUser>>(null);

    useScrollToTop(flatListRef);

    const extraData = useCommonFlatListExtraData();

    useEffect(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToOffset({ offset: 0, animated: false });
      }
    }, []);

    useReportErrorOnDuplicateKeys(
      'SearchUsersList',
      uniqueUsers,
      userKeyExtractor,
    );

    if (!uniqueUsers || uniqueUsers.length === 0) {
      return (
        <View style={[t.flexGrow]}>
          <Empty message={emptyMessage || 'No users match your query.'} />
        </View>
      );
    }

    return (
      <FlashList
        data={displayedUsers}
        extraData={extraData}
        keyExtractor={userKeyExtractor}
        refreshControl={refreshControl}
        onEndReached={handleEndReached}
        onEndReachedThreshold={onEndReachedThreshold}
        ref={flatListRef}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={ListHeaderComponent}
        {...STANDARD_FLASHLIST_PERF_PROPS}
        renderItem={renderItem}
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

SearchUsersList.displayName = 'SearchUsersList';

export { SearchUsersList };
