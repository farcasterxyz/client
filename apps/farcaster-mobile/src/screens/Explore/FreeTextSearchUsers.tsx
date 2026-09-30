import { ApiUser } from 'farcaster-client-data';
import {
  EventingProvider,
  useFlatSearchUsersData,
  useSearchUsers,
} from 'farcaster-client-hooks';
import React from 'react';
import { View } from 'react-native';

import { LoadingIndicator } from '~/components/LoadingIndicator';
import { useTheme } from '~/contexts/ThemeProvider';

import { SearchUsersList } from './SearchUsersList';

type FreeTextSearchUsersProps = {
  q: string;
  renderItem: ({ item }: { item: ApiUser }) => React.ReactElement;
};

const FreeTextSearchUsersContent: React.FC<FreeTextSearchUsersProps> =
  React.memo(({ q, renderItem }) => {
    const t = useTheme();
    const { data, fetchNextPage } = useSearchUsers({ q });
    const users = useFlatSearchUsersData({ data });

    if (!users) {
      return (
        <View style={[t.hFull, t.mT12]}>
          <LoadingIndicator />
        </View>
      );
    }

    return (
      <EventingProvider on="search-users">
        <SearchUsersList
          users={users}
          renderItem={renderItem}
          fetchNextPage={fetchNextPage}
        />
      </EventingProvider>
    );
  });

FreeTextSearchUsersContent.displayName = 'FreeTextSearchUsersContent';

export { FreeTextSearchUsersContent };
