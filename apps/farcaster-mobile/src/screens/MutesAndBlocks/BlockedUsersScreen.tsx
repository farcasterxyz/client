import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiBlockedUser, ApiUser } from 'farcaster-client-data';
import { useBlockedUsers, useMarkVisible } from 'farcaster-client-hooks';
import { ButtonV2, useRootToast } from 'farcaster-expo';
import React, { useCallback } from 'react';
import { Alert, View } from 'react-native';

import { Empty } from '~/components/Empty';
import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { User } from '~/components/users/User';
import { onEndReachedThreshold } from '~/constants/FlatList';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useRefreshOnFocus } from '~/hooks/useRefreshOnFocus';
import { CommonStackParamList } from '~/types';
import { trackError } from '~/utils/ErrorUtils';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';
import { getUserMarkVisibleDisclaimer } from '~/utils/UserVisibilityUtils';

type BlockedUsersScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'BlockedUsers'
>;

const BlockedUsersScreen = buildScreen<BlockedUsersScreenProps>(
  { name: 'BlockedUsers' },
  () => {
    const t = useTheme();
    const {
      flatData: blockedUsers,
      fetchNextPage,
      isLoading,
      refetch,
    } = useBlockedUsers();
    const toast = useRootToast();
    const markVisible = useMarkVisible();
    const { trackEvent } = useAnalytics();

    useRefreshOnFocus(refetch);

    const showUserUnblockAlert = useCallback((user: ApiUser) => {
      const userVisibilityTitle = getUserMarkVisibleDisclaimer({
        user,
        unblock: true,
      });

      return Alert.alert(
        userVisibilityTitle,
        'Changes may take a few minutes to be reflected.',
        [
          {
            text: 'OK',
          },
        ],
      );
    }, []);

    const handleUnblock = useCallback(
      async (user: ApiUser) => {
        try {
          trackEvent(AnalyticsEvent.ClickUnblock, undefined);
          await markVisible({ targetFid: user.fid });
          showUserUnblockAlert(user);
          refetch();
        } catch (error) {
          trackError(error);
          toast.show('Failed, please try again', {
            type: 'danger',
            placement: 'top',
          });
        }
      },
      [markVisible, refetch, showUserUnblockAlert, toast, trackEvent],
    );

    const renderItem = ({ item }: { item: ApiBlockedUser }) => {
      if (!item.blockedUser) {
        return (
          <View style={[t.p4, t.borderBHairline, t.borderDefault]}>
            <Text>fid: {item.blockedFid}</Text>
          </View>
        );
      }
      const user: ApiUser = {
        ...item.blockedUser,
        followerCount: 0,
        followingCount: 0,
        profile: {
          bio: {
            text: '',
            mentions: [],
          },
          ...item.blockedUser.profile,
        },
      };
      return (
        <User
          user={user}
          hideBio={true}
          userActionOverride={
            <ButtonV2
              title="Unblock"
              height="sm"
              variant="destructive"
              onPress={() => handleUnblock(user)}
            />
          }
        />
      );
    };

    if (isLoading) {
      return (
        <FullScreenLoadingIndicator
          debugName="BlockedUsers"
          style={[t.mT6]}
          justify="start"
        />
      );
    }

    return (
      <View style={[t.hFull, t.wFull, t.borderTHairline, t.borderDefault]}>
        <FlashList
          data={blockedUsers}
          keyExtractor={(item) => String(item.blockedFid)}
          onEndReached={fetchNextPage}
          onEndReachedThreshold={onEndReachedThreshold}
          ListEmptyComponent={
            <Empty message="No blocked users" justify="center" />
          }
          {...STANDARD_FLASHLIST_PERF_PROPS}
          renderItem={renderItem}
        />
      </View>
    );
  },
);

BlockedUsersScreen.displayName = 'BlockedUsersScreen';

export { BlockedUsersScreen };
