import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ApiUser } from 'farcaster-client-data';
import { useUsersForQualityAnnotationWithRefreshOnMount } from 'farcaster-client-hooks';
import React from 'react';
import { View } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { User } from '~/components/users';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePullToRefreshUsersForQualityAnnotation } from '~/hooks/data/usePullToRefreshUsersForQualityAnnotation';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';
import { SearchUsersList } from '~/screens/Explore/SearchUsersList';
import { CommonStackParamList } from '~/types';

type DebugUserQualityScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'DebugUserQuality'
>;

const DebugUserQualityScreen = buildScreen<DebugUserQualityScreenProps>(
  { name: 'DebugUserQuality' },
  () => {
    const t = useTheme();
    const { data, refetch, fetchNextPage } =
      useUsersForQualityAnnotationWithRefreshOnMount();
    const { refreshControl } = usePullToRefreshUsersForQualityAnnotation({
      refetch,
    });
    const pushToUserProfile = usePushToUserProfile();

    return (
      <View style={[t.hFull, t.p4, t.justifyBetween]}>
        <SearchUsersList
          users={data.pages.flatMap((page) => page.result.users)}
          refreshControl={refreshControl}
          renderItem={({ item }: { item: ApiUser }) => {
            return (
              <User
                user={item}
                hideBio={false}
                onUserPressCallback={() => pushToUserProfile({ fid: item.fid })}
              />
            );
          }}
          fetchNextPage={fetchNextPage}
        />
      </View>
    );
  },
);

DebugUserQualityScreen.displayName = 'DebugUserQualityScreen';

export { DebugUserQualityScreen };
