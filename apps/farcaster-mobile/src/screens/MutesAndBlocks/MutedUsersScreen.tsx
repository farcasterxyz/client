import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiMutedUser, ApiUser } from 'farcaster-client-data';
import { useMarkVisible, useMutedUsers } from 'farcaster-client-hooks';
import { ButtonV2, useRootToast } from 'farcaster-expo';
import React, { useCallback } from 'react';
import { Alert, View } from 'react-native';

import { Empty } from '~/components/Empty';
import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { buildScreen } from '~/components/Screen';
import { User } from '~/components/users/User';
import { onEndReachedThreshold } from '~/constants/FlatList';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useRefreshOnFocus } from '~/hooks/useRefreshOnFocus';
import { CommonStackParamList } from '~/types';
import { trackError } from '~/utils/ErrorUtils';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';
import { getUserMarkVisibleDisclaimer } from '~/utils/UserVisibilityUtils';

type MutedUsersScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'MutedUsers'
>;

const MutedUsersScreen = buildScreen<MutedUsersScreenProps>(
  { name: 'MutedUsers' },
  () => {
    const t = useTheme();
    const {
      flatData: mutedUsers,
      fetchNextPage,
      isLoading,
      refetch,
    } = useMutedUsers();
    const toast = useRootToast();
    const markVisible = useMarkVisible();
    const { trackEvent } = useAnalytics();

    useRefreshOnFocus(refetch);

    const showUserUnmuteAlert = useCallback((user: ApiUser) => {
      const userVisibilityTitle = getUserMarkVisibleDisclaimer({
        user,
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

    const handleUnmute = useCallback(
      async (user: ApiUser) => {
        try {
          trackEvent(AnalyticsEvent.ClickUnmute, undefined);
          await markVisible({ targetFid: user.fid });
          showUserUnmuteAlert(user);
          refetch();
        } catch (error) {
          trackError(error);
          toast.show('Failed, please try again', {
            type: 'danger',
            placement: 'top',
          });
        }
      },
      [markVisible, refetch, showUserUnmuteAlert, toast, trackEvent],
    );

    const renderItem = ({ item }: { item: ApiMutedUser }) => {
      if (!item.mutedUser) {
        return null;
      }
      const user: ApiUser = {
        ...item.mutedUser,
        followerCount: 0,
        followingCount: 0,
        profile: {
          bio: {
            text: '',
            mentions: [],
            channelMentions: [],
          },
          ...item.mutedUser.profile,
        },
      };
      return (
        <User
          user={user}
          hideBio={true}
          userActionOverride={
            <ButtonV2
              title="Unmute"
              height="sm"
              Icon={({ color }) => (
                <Ionicons
                  name="volume-medium-outline"
                  size={16}
                  color={color}
                />
              )}
              variant="secondary"
              onPress={() => handleUnmute(user)}
            />
          }
        />
      );
    };

    if (isLoading) {
      return (
        <FullScreenLoadingIndicator
          debugName="MutedUsers"
          style={[t.mT6]}
          justify="start"
        />
      );
    }

    return (
      <View style={[t.hFull, t.wFull, t.borderTHairline, t.borderDefault]}>
        <FlashList
          data={mutedUsers}
          keyExtractor={(item) => String(item.mutedFid)}
          onEndReached={fetchNextPage}
          onEndReachedThreshold={onEndReachedThreshold}
          ListEmptyComponent={
            <Empty message="No muted users" justify="center" />
          }
          {...STANDARD_FLASHLIST_PERF_PROPS}
          renderItem={renderItem}
        />
      </View>
    );
  },
);

MutedUsersScreen.displayName = 'MutedUsersScreen';

export { MutedUsersScreen };
