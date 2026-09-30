import { Octicons } from '@expo/vector-icons';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiFrame, ApiNotificationGroup } from 'farcaster-client-data';
import {
  canDisableMiniAppPushNotifications,
  useFeatureFlag,
  useGloballyCachedFrame,
  useIngestNotificationFeedback,
  useNonSuspenseFrameDetails,
  useSetMiniAppPushNotifications,
  useTrackEvent,
} from 'farcaster-client-hooks';
import { AnimatedPressable, useHaptics, useRootToast } from 'farcaster-expo';
import React, { FC, memo, ReactNode, useCallback, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { AutoDisplayingBottomSheetModal } from '~/components/BottomSheet/AutoDisplayingBottomSheetModal';
import { ButtonGroup, ButtonGroupOption } from '~/components/ButtonGroup';
import { hitSlop } from '~/constants/Pressable';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';

type NotificationGroupOuterContainerProps = {
  children: ReactNode;
  group: ApiNotificationGroup;
  onPress: () => void;
  trackingProps?: Record<string, string>;
  trackAsGroup?: boolean;
};

const NotificationGroupOuterContainer: FC<NotificationGroupOuterContainerProps> =
  memo(({ children, group, onPress, trackingProps, trackAsGroup }) => {
    const t = useTheme();
    const { trackEvent } = useTrackEvent();
    const v2ThemeEnabled = true;
    const [pushNotificationsDisabled, setPushNotificationsDisabled] =
      React.useState(false);

    const uniqueFrameDomain: string | null = useMemo(() => {
      if (group.type !== 'frame-generic' && group.type !== 'mini-app') {
        return null;
      }

      const allDomains: Set<string> = new Set();
      for (const item of group.previewItems) {
        if (item.type === 'frame-generic') {
          allDomains.add(item.content.frame.domain);
        }
        if (item.type === 'mini-app') {
          allDomains.add(item.content.miniapp.domain);
        }
      }
      if (allDomains.size !== 1) {
        return null;
      }
      return Array.from(allDomains)[0];
    }, [group]);

    const openToFeedback = React.useMemo(() => {
      const genericFrameWithSingleDomain =
        group.type === 'frame-generic' && uniqueFrameDomain !== null;
      const miniAppWithSingleDomain =
        group.type === 'mini-app' && uniqueFrameDomain !== null;
      return (
        group.type === 'dormant-user-new-cast' ||
        group.type === 'trending-token' ||
        genericFrameWithSingleDomain ||
        miniAppWithSingleDomain
      );
    }, [group.type, uniqueFrameDomain]);

    const [showMenuModal, setShowMenuModal] = React.useState<boolean>(false);

    const onMenuPress = React.useCallback(() => {
      setShowMenuModal(true);
    }, []);

    const miniApp = React.useMemo(() => {
      if (group.type !== 'mini-app') {
        return undefined;
      }
      return group.previewItems[0].content.miniapp;
    }, [group]);
    const miniAppName = miniApp?.name ?? 'Mini App';

    const { triggerImpactAsync } = useHaptics();

    const handlePress = useCallback(() => {
      trackEvent(
        trackAsGroup
          ? AnalyticsEvent.ClickGroupedNotification
          : AnalyticsEvent.ClickNotification,
        {
          type: group.type,
          ...trackingProps,
        },
      );
      triggerImpactAsync();
      onPress();
    }, [
      trackEvent,
      trackAsGroup,
      group.type,
      trackingProps,
      triggerImpactAsync,
      onPress,
    ]);

    return (
      <AnimatedPressable onPress={handlePress}>
        <View
          style={[
            t.p3,
            { borderBottomWidth: 0.66 },
            { borderColor: t.colors.border.tertiary },
            t.flexRow,
            t.itemsStart,
            t.relative,
            { gap: 8 },
            group.isUnread && t.bgCastHighlight,
          ]}
        >
          {children}
          {openToFeedback && (
            <>
              <Pressable
                onPress={onMenuPress}
                hitSlop={hitSlop}
                style={[
                  t.absolute,
                  t.itemsCenter,
                  t.justifyCenter,
                  v2ThemeEnabled
                    ? {
                        top: 16,
                        right: 12,
                        height: 16,
                        width: 16,
                      }
                    : {
                        top: 8,
                        right: 8,
                        height: 34,
                        width: 34,
                      },
                ]}
              >
                <Octicons
                  name="kebab-horizontal"
                  size={16}
                  color={
                    v2ThemeEnabled
                      ? t.colors.text.secondary
                      : t.colors.text.tertiary
                  }
                />
              </Pressable>
              {showMenuModal && (
                <MenuModal
                  onDismiss={() => setShowMenuModal(false)}
                  notificationType={group.type}
                  domain={uniqueFrameDomain || undefined}
                  miniAppName={miniAppName}
                  miniApp={miniApp}
                  pushNotificationsDisabled={pushNotificationsDisabled}
                  onPushNotificationsDisabled={() =>
                    setPushNotificationsDisabled(true)
                  }
                />
              )}
            </>
          )}
        </View>
      </AnimatedPressable>
    );
  });

NotificationGroupOuterContainer.displayName = 'NotificationGroupOuterContainer';

function MenuModal({
  onDismiss,
  notificationType,
  domain,
  miniAppName,
  miniApp,
  pushNotificationsDisabled,
  onPushNotificationsDisabled,
}: {
  onDismiss: () => void;
  notificationType: ApiNotificationGroup['type'];
  domain?: string;
  miniAppName?: string;
  miniApp?: ApiFrame;
  pushNotificationsDisabled: boolean;
  onPushNotificationsDisabled: () => void;
}) {
  const { trackEvent } = useAnalytics();

  const toast = useRootToast();

  const ingestNotificationFeedback = useIngestNotificationFeedback();
  const setMiniAppPushNotifications = useSetMiniAppPushNotifications();
  const miniAppPushNotificationsEnabled = useFeatureFlag(
    'mini-app-push-notifications',
  );
  const { data: miniAppDetails } = useNonSuspenseFrameDetails({
    domain: miniApp?.domain,
    enabled: !!miniApp,
  });
  const currentMiniApp = useGloballyCachedFrame(miniAppDetails ?? miniApp);
  const showPushNotificationMenuItem =
    miniAppPushNotificationsEnabled &&
    currentMiniApp?.supportsPushNotifications === true;
  const showDisablePushNotifications = canDisableMiniAppPushNotifications({
    featureEnabled: miniAppPushNotificationsEnabled,
    miniApp: currentMiniApp,
    locallyDisabled: pushNotificationsDisabled,
  });

  const onSeeLessOftenClick = React.useCallback(() => {
    trackEvent(AnalyticsEvent.PressSeeLessOften, {
      notificationType: notificationType,
    });

    ingestNotificationFeedback({
      notificationType: notificationType,
      feedbackType: 'see-fewer',
      domain,
    });

    onDismiss();

    toast.show('You will no longer receive this type of notification', {
      id: notificationType,
      placement: 'bottom',
    });
  }, [
    ingestNotificationFeedback,
    notificationType,
    onDismiss,
    toast,
    trackEvent,
    domain,
  ]);

  const seeLessOftenLabel = React.useMemo(() => {
    switch (notificationType) {
      case 'mini-app':
        return `Disable ${miniAppName} in-app notifications`;
      case 'trending-token':
        return 'Disable trending token notifications';
      default:
        return 'See less often';
    }
  }, [notificationType, miniAppName]);

  const onDisablePushNotificationsClick = React.useCallback(async () => {
    if (!currentMiniApp) {
      return;
    }

    try {
      await setMiniAppPushNotifications({
        frame: currentMiniApp,
        enabled: false,
      });
      onPushNotificationsDisabled();
      onDismiss();
      toast.show(`Push notifications disabled for ${miniAppName}`, {
        placement: 'bottom',
      });
    } catch {
      toast.show('Error disabling push notifications, please try again', {
        type: 'danger',
        placement: 'bottom',
      });
    }
  }, [
    currentMiniApp,
    miniAppName,
    onDismiss,
    onPushNotificationsDisabled,
    setMiniAppPushNotifications,
    toast,
  ]);

  const buttonGroupOptions = React.useMemo(() => {
    const options: ButtonGroupOption[] = [
      {
        label: seeLessOftenLabel,
        iconLeft: () => <Octicons name="mute" size={16} />,
        onPress: onSeeLessOftenClick,
        destructive: false,
        enableHaptics: true,
      },
    ];
    if (showPushNotificationMenuItem) {
      options.push({
        label: showDisablePushNotifications
          ? `Disable ${miniAppName} push notifications`
          : `${miniAppName} push notifications are off`,
        iconLeft: () => <Octicons name="bell-slash" size={16} />,
        onPress: onDisablePushNotificationsClick,
        destructive: false,
        enableHaptics: showDisablePushNotifications,
        disabled: !showDisablePushNotifications,
      });
    }
    return options;
  }, [
    miniAppName,
    onDisablePushNotificationsClick,
    onSeeLessOftenClick,
    seeLessOftenLabel,
    showDisablePushNotifications,
    showPushNotificationMenuItem,
  ]);

  const modalRef = React.useRef<{ dismiss: () => void }>(null);

  return (
    <AutoDisplayingBottomSheetModal
      name="notificationActionsModal"
      onDismiss={onDismiss}
      ref={modalRef}
    >
      <ButtonGroup options={buttonGroupOptions} />
    </AutoDisplayingBottomSheetModal>
  );
}

export { NotificationGroupOuterContainer };
