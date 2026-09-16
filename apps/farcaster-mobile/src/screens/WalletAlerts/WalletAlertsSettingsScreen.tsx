import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WalletAlertsSettings } from 'farcaster-expo';
import React, { useCallback } from 'react';

import { buildScreen } from '~/components/Screen';
import { enablePushNotificationsPromptInfoKey } from '~/constants/Storage';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { usePushNotificationPermission } from '~/contexts/PushNotificationPermissionProvider';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';
import { WalletStackParamList } from '~/types';

type WalletAlertsSettingsScreenProps = NativeStackScreenProps<
  WalletStackParamList,
  'WalletAlertsSettings'
>;

const WalletAlertsSettingsScreen = buildScreen<WalletAlertsSettingsScreenProps>(
  {
    name: 'WalletAlertsSettings',
    insetTop: true,
    themeV2: true,
  },
  ({
    route: {
      params: { promptForPushes },
    },
  }) => {
    const pushToUserProfile = usePushToUserProfile();

    const handleUserPress = React.useCallback(
      ({ fid }: { fid: number }) => {
        pushToUserProfile({ fid });
      },
      [pushToUserProfile],
    );

    const { permission } = usePushNotificationPermission();
    const { showGlobalPrompt } = useGlobalPrompts();

    useFocusEffect(
      useCallback(() => {
        if (
          promptForPushes &&
          (typeof permission === 'undefined' ||
            (permission.status !== 'granted' && permission.canAskAgain))
        ) {
          showGlobalPrompt({ key: enablePushNotificationsPromptInfoKey });
        }
      }, [permission, showGlobalPrompt, promptForPushes]),
    );

    return <WalletAlertsSettings onUserPress={handleUserPress} />;
  },
);

export { WalletAlertsSettingsScreen };
