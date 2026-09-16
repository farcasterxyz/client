import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { ApiUser } from 'farcaster-client-data';
import {
  useContactsUsersWithRefreshOnMount,
  userKeyExtractor,
} from 'farcaster-client-hooks';
import React, { useMemo } from 'react';
import { View } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { User } from '~/components/users/User';
import { onEndReachedThreshold } from '~/constants/FlatList';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePullToRefreshInfinite } from '~/hooks/data/usePullToRefreshInfinite';
import { useReportErrorOnDuplicateKeys } from '~/hooks/useReportErrorOnDuplicateKeys';
import { CommonStackParamList } from '~/types';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';

type ContactsUsersScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'ContactsUsers'
>;

const ContactsUsersScreen = buildScreen<ContactsUsersScreenProps>(
  { name: 'ContactsUsers' },
  () => {
    const t = useTheme();

    const { data, refetch, fetchNextPage } =
      useContactsUsersWithRefreshOnMount();

    const { refreshControl } = usePullToRefreshInfinite({ refetch });

    const users = useMemo(
      () => data!.pages.flatMap((page) => page.result.users) || [],
      [data],
    );

    useReportErrorOnDuplicateKeys(
      'ContactsUsersScreen',
      users,
      userKeyExtractor,
    );

    if (users.length === 0) {
      return (
        <View style={[t.flexGrow, t.mX2, t.justifyCenter, t.itemsCenter]}>
          <Text style={[t.texts.primary, t.textBase, t.textCenter]}>
            🔎 Syncing contacts...
          </Text>
          <Text style={[t.texts.secondary, t.textBase, t.textCenter, t.mT2]}>
            We will let you know once we have some matches for you!
          </Text>
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
  <User user={user} hideBio={false} />
);

export { ContactsUsersScreen };
