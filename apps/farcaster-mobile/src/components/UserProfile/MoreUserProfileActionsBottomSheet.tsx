import { Ionicons, Octicons } from '@expo/vector-icons';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUser, ApiUserProfile } from 'farcaster-client-data';
import { resolveUsername, useMarkVisible } from 'farcaster-client-hooks';
import {
  useIsAdmin,
  useRootToast,
  useWalletFidOverride,
  WalletIcon,
} from 'farcaster-expo';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';

import { useBottomSheetModalRef } from '~/components/BottomSheet';
import { AutoDisplayingBottomSheetModal } from '~/components/BottomSheet/AutoDisplayingBottomSheetModal';
import { ButtonGroup, ButtonGroupOption } from '~/components/ButtonGroup';
import { ReportUser } from '~/components/users/ReportUser';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useMuteUser } from '~/contexts/MuteUserProvider';
import { useUserAppContext } from '~/contexts/UserAppContextProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { usePush } from '~/hooks/navigation/usePush';
import { trackError } from '~/utils/ErrorUtils';
import { shareUrl } from '~/utils/SharingUtils';
import { getUserMarkVisibleDisclaimer } from '~/utils/UserVisibilityUtils';

import { AboutUserBottomSheet } from './AboutUserBottomSheet';
import { ChannelStreakBottomSheetUpdated } from './ChannelStreakBottomSheetUpdated';

interface MoreUserProfileActionsBottomSheetProps {
  user: ApiUser;
  userProfile: ApiUserProfile;
  onDismiss: () => void;
  shouldManageStreaks: boolean;
}

const MoreUserProfileActionsBottomSheet = ({
  user,
  userProfile,
  onDismiss,
  shouldManageStreaks,
}: MoreUserProfileActionsBottomSheetProps) => {
  const toast = useRootToast();
  const { muteUser } = useMuteUser();
  const markVisible = useMarkVisible();
  const { trackEvent } = useAnalytics();
  const { fid: currentUserFid } = useCurrentUser_UNSAFE();
  const isCurrentUser = user.fid === currentUserFid;

  const isAdmin = useIsAdmin();
  const [walletFidOverride, setWalletFidOverride] = useWalletFidOverride();

  const reportUserBottomSheetRef = useBottomSheetModalRef();

  const [showAboutUserBottomSheet, setShowAboutUserBottomSheet] =
    useState(false);

  const [showChannelStreaksBottomSheet, setShowChannelStreaksBottomSheet] =
    useState(false);

  const push = usePush();

  const showUserUnmuteAlert = useCallback(() => {
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
  }, [user]);

  const profileUrl = useMemo(() => {
    return user.username
      ? `https://farcaster.xyz/${user.username}`
      : `farcaster://profiles/${user.fid}`;
  }, [user.fid, user.username]);

  const { optedOutChannelStreaks } = useUserAppContext();

  const options = useMemo(() => {
    const opts: ButtonGroupOption[] = [];

    opts.push({
      label: user.username
        ? `Share @${user.username} via...`
        : 'Share user profile',
      onPress: async () => {
        onDismiss();
        await shareUrl({
          title: user.username ? `@${user.username} on Farcaster` : 'Farcaster',
          url: profileUrl,
        });
      },
      icon: ({ size, color }) => (
        <Ionicons name="share" size={size} color={color} />
      ),
    });

    opts.push({
      label: 'About',
      onPress: () => {
        setShowAboutUserBottomSheet(true);
      },
      icon: ({ size, color }) => (
        <Octicons name="info" size={size} color={color} />
      ),
    });

    if (
      !optedOutChannelStreaks &&
      shouldManageStreaks &&
      (typeof user.streak !== 'undefined' || user.fid === currentUserFid)
    ) {
      opts.push({
        label:
          typeof user.streak !== 'undefined'
            ? `${Math.max(1, user.streak.streakCount)}d streak in /${user.streak.channel.key}`
            : 'Channel casting streak',
        onPress: () => {
          if (user.fid === currentUserFid) {
            setShowChannelStreaksBottomSheet(true);
          } else if (typeof user.streak !== 'undefined') {
            push('Channel', { channelKey: user.streak.channel.key });
          }
        },
        icon: ({ size, color }) => (
          <Octicons name="star" size={size} color={color} />
        ),
      });
    }

    if (isAdmin) {
      if (walletFidOverride !== user.fid) {
        opts.push({
          label: 'Impersonate wallet',
          onPress: () => {
            setWalletFidOverride(user.fid.toString());
          },
          icon: ({ size, color }) => (
            <WalletIcon size={size} color={color.toString()} />
          ),
        });
      } else {
        opts.push({
          label: 'Stop impersonating wallet',
          onPress: () => {
            setWalletFidOverride(undefined);
          },
          icon: ({ size, color }) => (
            <WalletIcon size={size} color={color.toString()} />
          ),
        });
      }
    }

    return opts;
  }, [
    currentUserFid,
    onDismiss,
    optedOutChannelStreaks,
    profileUrl,
    push,
    shouldManageStreaks,
    user.fid,
    user.streak,
    user.username,
    walletFidOverride,
    setWalletFidOverride,
    isAdmin,
  ]);

  const moderationOptions = useMemo(() => {
    if (isCurrentUser) {
      return [];
    }

    const opts: ButtonGroupOption[] = [];

    opts.push({
      label: 'Report user',
      onPress: () => reportUserBottomSheetRef.current?.present(),
      icon: ({ size, color }) => (
        <Ionicons name="flag" size={size} color={color} />
      ),
    });

    if (user.viewerContext?.invisible) {
      opts.push({
        label: user.viewerContext?.blocking ? 'Unblock user' : 'Unmute user',
        onPress: async () => {
          try {
            if (user.viewerContext?.blocking) {
              trackEvent(AnalyticsEvent.ClickUnblock, undefined);
            } else {
              trackEvent(AnalyticsEvent.ClickUnmute, undefined);
            }

            onDismiss();
            await markVisible({ targetFid: user.fid });
            showUserUnmuteAlert();
          } catch (error) {
            trackError(error);
            toast.show('Failed, please try again', {
              type: 'danger',
              placement: 'top',
            });
          }
        },
        enableHaptics: true,
        icon: ({ size, color }) => (
          <Ionicons name="volume-mute" size={size} color={color} />
        ),
      });
    } else {
      opts.push({
        label: 'Mute user',
        onPress: () => {
          onDismiss();
          muteUser({
            targetFid: user.fid,
            username: resolveUsername({
              username: user.username,
              fid: user.fid,
            }),
            source: 'profile',
            block: false,
          });
        },
        enableHaptics: true,
        destructive: true,
        icon: ({ size, color }) => (
          <Ionicons name="volume-mute" size={size} color={color} />
        ),
      });
      opts.push({
        label: 'Block user',
        onPress: () => {
          onDismiss();
          muteUser({
            targetFid: user.fid,
            username: resolveUsername({
              username: user.username,
              fid: user.fid,
            }),
            source: 'profile',
            block: true,
          });
        },
        enableHaptics: true,
        destructive: true,
        icon: ({ size, color }) => (
          <Octicons name="blocked" size={size} color={color} />
        ),
      });
    }
    return opts;
  }, [
    isCurrentUser,
    markVisible,
    muteUser,
    onDismiss,
    reportUserBottomSheetRef,
    showUserUnmuteAlert,
    toast,
    trackEvent,
    user.fid,
    user.username,
    user.viewerContext?.blocking,
    user.viewerContext?.invisible,
  ]);

  return (
    <>
      <AutoDisplayingBottomSheetModal
        name="moreUserProfileActions"
        onDismiss={onDismiss}
      >
        <View style={[{ gap: 16 }]}>
          <ButtonGroup options={options} />
          {moderationOptions.length > 0 && (
            <ButtonGroup options={moderationOptions} />
          )}
        </View>
      </AutoDisplayingBottomSheetModal>
      <ReportUser
        ref={reportUserBottomSheetRef}
        targetUser={user}
        onDismiss={() => reportUserBottomSheetRef.current?.dismiss()}
        onSubmit={() => reportUserBottomSheetRef.current?.dismiss()}
      />
      {showAboutUserBottomSheet && (
        <AboutUserBottomSheet
          userProfile={userProfile}
          onDismiss={() => setShowAboutUserBottomSheet(false)}
        />
      )}
      {showChannelStreaksBottomSheet && (
        <ChannelStreakBottomSheetUpdated
          user={user}
          onDismiss={() => setShowChannelStreaksBottomSheet(false)}
        />
      )}
    </>
  );
};

export { MoreUserProfileActionsBottomSheet };
