import { Octicons } from '@expo/vector-icons';
import { ApiUser } from 'farcaster-client-data';
import { AutoDisplayingBottomSheetModal, useTheme } from 'farcaster-expo';
import React from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { useKeyboardVisibility } from '~/hooks/useKeyboardVisibility';
import { CastActivityPanel, TradeAlertsPanel } from '~/screens/UserV2';

import { IconPressable } from './IconPressable';

export function ProfileNotificationsSettings({ user }: { user: ApiUser }) {
  const { fid: currentUserFid } = useCurrentUser_UNSAFE();

  if (user.fid === currentUserFid) {
    return null;
  }

  return <ProfileNotificationsSettingsInner user={user} />;
}

function ProfileNotificationsSettingsInner({ user }: { user: ApiUser }) {
  const t = useTheme();

  const [isBottomSheetOpen, setIsBottomSheetOpen] = React.useState(false);

  const openBottomSheet = React.useCallback(() => {
    setIsBottomSheetOpen(true);
  }, []);

  const closeBottomSheet = React.useCallback(() => {
    setIsBottomSheetOpen(false);
  }, []);

  const isSubscribed =
    user.viewerContext?.enableNotifications ||
    (user.viewerContext?.traderNotificationThreshold !== undefined &&
      user.viewerContext?.traderNotificationThreshold !== -1) ||
    false;

  return (
    <>
      <IconPressable
        Icon={({ color, size }) => (
          <View style={[t.relative]}>
            <Octicons
              name={isSubscribed ? 'bell-fill' : 'bell'}
              size={size}
              color={color}
            />
          </View>
        )}
        onPress={openBottomSheet}
      />
      {isBottomSheetOpen && (
        <ProfileNotificationsBottomSheet
          user={user}
          onDismiss={closeBottomSheet}
        />
      )}
    </>
  );
}

function ProfileNotificationsBottomSheet({
  user,
  onDismiss,
}: {
  user: ApiUser;
  onDismiss: () => void;
}) {
  return (
    <UnifiedFollowsProfileNotificationSettingsBottomSheet
      user={user}
      onDismiss={onDismiss}
    />
  );
}

function UnifiedFollowsProfileNotificationSettingsBottomSheet({
  user,
  onDismiss,
}: {
  user: ApiUser;
  onDismiss: () => void;
}) {
  const t = useTheme();

  const { keyboardHeight } = useKeyboardVisibility();

  const content = React.useMemo(() => {
    return (
      <Animated.View
        style={[
          t.gap6,
          {
            paddingBottom: keyboardHeight,
          },
        ]}
      >
        <CastActivityPanel user={user} />
        <TradeAlertsPanel user={user} />
      </Animated.View>
    );
  }, [keyboardHeight, t.gap6, user]);

  return (
    <AutoDisplayingBottomSheetModal
      name="profile-notifications-v2"
      onDismiss={onDismiss}
      handleStyle={{ display: 'none' }}
      enableDynamicSizing={true}
      contentContainerStyle={[t.pX6, t.pT6]}
    >
      {content}
    </AutoDisplayingBottomSheetModal>
  );
}
