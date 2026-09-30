import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiFrame } from 'farcaster-client-data';
import {
  resolveUsernameShort,
  useEnableFrameNotifications,
  useFeatureFlag,
  useFrameDetails,
  useGloballyCachedFrame,
  useSetMiniAppPushNotifications,
  useTrackEvent,
  useUpdateFavoriteFrame,
} from 'farcaster-client-hooks';
import { useRootToast } from 'farcaster-expo';
import React, { FC, useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';

import { ButtonGroup, ButtonGroupOption } from '~/components/ButtonGroup';
import { ButtonV2 } from '~/components/ButtonV2';
import { FrameIconImage } from '~/components/FrameIconImage';
import { buildScreen } from '~/components/Screen';
import { Switch } from '~/components/Switch';
import { Text2 } from '~/components/Text';
import { TextWithPress } from '~/components/TextWithPress';
import {
  FavoriteFrameProvider,
  useFavoriteFrame,
} from '~/contexts/FavoriteFrameProvider';
import { usePushNotificationPermission } from '~/contexts/PushNotificationPermissionProvider';
import { sizes, useTheme } from '~/contexts/ThemeProvider';
import { usePop } from '~/hooks/navigation/usePop';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';
import { isNotificationPromptDisabled } from '~/hooks/pushNotifications/useRequestNotificationsPermission';
import { AppsHomeStackParamList } from '~/types';
import { openWarpcastSettings } from '~/utils/UrlUtils';

type AppSettingsScreenProps = NativeStackScreenProps<
  AppsHomeStackParamList,
  'AppSettings'
>;

const AppSettingsScreen = buildScreen<AppSettingsScreenProps>(
  { name: 'AppSettings' },
  ({
    route: {
      params: { domain },
    },
  }) => {
    return <AppSettings domain={domain} />;
  },
);
AppSettingsScreen.displayName = 'AppSettingsScreen';

interface AppSettingsProps {
  domain: string;
}

const AppSettings: FC<AppSettingsProps> = ({ domain }) => {
  const { data } = useFrameDetails({ domain });
  const frame = useGloballyCachedFrame(data);

  if (frame && !frame.harmful) {
    return (
      <FavoriteFrameProvider>
        <AppSettingsContent frame={frame} />
      </FavoriteFrameProvider>
    );
  } else {
    return <Text2>Frame not found</Text2>;
  }
};

interface AppSettingsContentProps {
  frame: ApiFrame;
}

const AppSettingsContent: FC<AppSettingsContentProps> = ({
  frame: fallback,
}) => {
  const frame = useGloballyCachedFrame(fallback);

  const t = useTheme();
  const toast = useRootToast();
  const { trackEvent } = useTrackEvent();
  const pushToUserProfile = usePushToUserProfile();
  const pop = usePop();
  const favoriteFrame = useFavoriteFrame();
  const miniAppPushNotificationsEnabled = useFeatureFlag(
    'mini-app-push-notifications',
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    frame.viewerContext?.notificationsEnabled || false,
  );
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(
    frame.viewerContext?.pushNotificationsEnabled || false,
  );
  const { permission, setPermission } = usePushNotificationPermission();
  const enableFrameNotifications = useEnableFrameNotifications();
  const updateFavoriteFrame = useUpdateFavoriteFrame();
  const setMiniAppPushNotifications = useSetMiniAppPushNotifications();

  const viewAuthor = useCallback(() => {
    if (!frame.author) return;

    trackEvent(AnalyticsEvent.ClickFrameAuthor);

    pushToUserProfile({ fid: frame.author.fid });
  }, [frame.author, pushToUserProfile, trackEvent]);

  const toggleNotifications = useCallback(async () => {
    if (notificationsEnabled) {
      try {
        setNotificationsEnabled(false);
        await updateFavoriteFrame({
          frame,
          disableNotifications: true,
          pushNotificationsEnabled:
            miniAppPushNotificationsEnabled && frame.supportsPushNotifications
              ? pushNotificationsEnabled
              : undefined,
        });
        toast.show('Notifications disabled', { type: 'generic' });
      } catch (e: unknown) {
        setNotificationsEnabled(true);
        toast.show('Error disabling notifications, please try again', {
          type: 'error',
        });
      }
    } else {
      try {
        setNotificationsEnabled(true);
        await enableFrameNotifications(frame);
        toast.show('Notifications enabled', { type: 'generic' });
      } catch (e: unknown) {
        setNotificationsEnabled(false);
        toast.show('Error enabling notifications, please try again', {
          type: 'error',
        });
      }
    }
  }, [
    enableFrameNotifications,
    frame,
    miniAppPushNotificationsEnabled,
    notificationsEnabled,
    pushNotificationsEnabled,
    toast,
    updateFavoriteFrame,
  ]);

  const togglePushNotifications = useCallback(async () => {
    const nextValue = !pushNotificationsEnabled;
    if (nextValue && !permission?.granted) {
      if (isNotificationPromptDisabled) {
        return;
      }
      if (permission && !permission.canAskAgain) {
        toast.show('Enable Farcaster notifications in system settings', {
          type: 'generic',
        });
        openWarpcastSettings();
        return;
      }
      const nextPermission = await Notifications.requestPermissionsAsync();
      setPermission(nextPermission);
      if (!nextPermission.granted) return;
    }

    setPushNotificationsEnabled(nextValue);
    try {
      await setMiniAppPushNotifications({ frame, enabled: nextValue });
      toast.show(`Push notifications ${nextValue ? 'enabled' : 'disabled'}`, {
        type: 'generic',
      });
    } catch {
      setPushNotificationsEnabled(!nextValue);
      toast.show('Error updating push notifications, please try again', {
        type: 'error',
      });
    }
  }, [
    frame,
    permission,
    pushNotificationsEnabled,
    setMiniAppPushNotifications,
    setPermission,
    toast,
  ]);

  const options: ButtonGroupOption[] = useMemo(() => {
    return [
      {
        label: 'In-app notifications',
        subLabel: !frame.supportsNotifications
          ? 'Mini App does not support notifications'
          : undefined,
        icon: () => (
          <Switch
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
            newColors
            disabled={!frame.supportsNotifications}
          />
        ),
        onPress: toggleNotifications,
        disabled: !frame.supportsNotifications,
      },
      ...(miniAppPushNotificationsEnabled && frame.supportsPushNotifications
        ? [
            {
              label: 'Push notifications',
              icon: () => (
                <Switch
                  value={pushNotificationsEnabled}
                  onValueChange={togglePushNotifications}
                  newColors
                />
              ),
              onPress: togglePushNotifications,
            },
          ]
        : []),
    ] satisfies ButtonGroupOption[];
  }, [
    frame.supportsNotifications,
    frame.supportsPushNotifications,
    miniAppPushNotificationsEnabled,
    notificationsEnabled,
    pushNotificationsEnabled,
    toggleNotifications,
    togglePushNotifications,
  ]);

  const remove = useCallback(async () => {
    const removed = await favoriteFrame.confirmRemoveFavoriteFrame({
      frame,
      emit: undefined,
    });
    if (removed) {
      pop();
    }
  }, [favoriteFrame, frame, pop]);

  return (
    <View style={[t.p3, t.hFull, t.flexCol, { gap: sizes.s6 }]}>
      <View style={[t.flexRow, t.itemsCenter, { gap: sizes.s3 }]}>
        <FrameIconImage imageUrl={frame.iconUrl} size={56} />
        <View style={[t.flexCol, t.flexShrink]}>
          <Text2 weight="semibold">{frame.name}</Text2>
          {frame.author && (
            <Text2 size="sm" color="secondary">
              Built by{' '}
              <TextWithPress onPress={viewAuthor} style={[t.texts.brand]}>
                {resolveUsernameShort(frame.author)}
              </TextWithPress>
            </Text2>
          )}
          <Text2 size="xs" color="secondary" numberOfLines={1}>
            {frame.homeUrl}
          </Text2>
        </View>
      </View>
      <ButtonGroup options={options} />
      <ButtonV2 variant="destructive-outline" title="Remove" onPress={remove} />
    </View>
  );
};

export { AppSettingsScreen };
