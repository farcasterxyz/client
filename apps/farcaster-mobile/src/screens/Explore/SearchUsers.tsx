import { ApiUser } from 'farcaster-client-data';
import { FullScreenLoadingIndicator, LoadingIndicator } from 'farcaster-expo';
import React, { FC } from 'react';
import { View } from 'react-native';

import { UserSearchItem } from '~/components/users/UserSearchItem';
import { useTheme } from '~/contexts/ThemeProvider';
import { SearchTabProps } from '~/screens/Explore/ExploreScreen';
import { FreeTextSearchUsersContent } from '~/screens/Explore/FreeTextSearchUsers';

const SearchUsers: FC<SearchTabProps> = ({ q, enabled }) => {
  const t = useTheme();

  if (!enabled) {
    return (
      <View style={[t.hFull, t.mT12]}>
        <LoadingIndicator />
      </View>
    );
  }

  return (
    <FreeTextSearchUsersContent
      q={q}
      renderItem={({ item }: { item: ApiUser }) => {
        return <UserSearchItem user={item} showBio />;
      }}
    />
  );
};

const WrappedSearchUsers: FC<SearchTabProps> = React.memo(({ q, enabled }) => {
  return (
    <React.Suspense fallback={<FullScreenLoadingIndicator />}>
      <SearchUsers q={q} enabled={enabled} />
    </React.Suspense>
  );
});

SearchUsers.displayName = 'UsersSearchTab';

export { WrappedSearchUsers as SearchUsers };
