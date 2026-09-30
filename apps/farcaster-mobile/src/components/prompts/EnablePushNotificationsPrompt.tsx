import { BottomSheetView, useBottomSheet } from '@gorhom/bottom-sheet';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { AnalyticsEvent } from 'farcaster-analytics';
import { useMarkPromptedFor } from 'farcaster-client-hooks';
import { AnimatedPressable } from 'farcaster-expo';
import React, { FC, memo, useCallback } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text2 } from '~/components/Text';
import { enablePushNotificationsPromptInfoKey } from '~/constants/Storage';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { usePushNotificationPermission } from '~/contexts/PushNotificationPermissionProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { openWarpcastSettings } from '~/utils/UrlUtils';

import { Prompt } from './Prompt';

const EnablePushNotificationsPrompt: FC = memo(() => {
  const { activePromptKey, hideGlobalPrompt } = useGlobalPrompts();
  const { pushNotificationsEnabled } = usePushNotificationPermission();

  const shouldPresent = useCallback(() => {
    const should =
      !pushNotificationsEnabled &&
      activePromptKey === enablePushNotificationsPromptInfoKey;

    return should;
  }, [activePromptKey, pushNotificationsEnabled]);

  return (
    <Prompt
      shouldPresent={shouldPresent}
      height={'30%'}
      enableDynamicSizing={true}
      storageKey={enablePushNotificationsPromptInfoKey}
      enableTouchThrough={false}
      onBackdropPress={hideGlobalPrompt}
      onCloseCallback={hideGlobalPrompt}
    >
      <EnablePushNotificationsPromptContent />
    </Prompt>
  );
});

EnablePushNotificationsPrompt.displayName = 'EnablePushNotificationsPrompt';

const EnablePushNotificationsPromptContent: FC = () => {
  const t = useTheme();
  const { setPermission, permission } = usePushNotificationPermission();
  const { forceClose } = useBottomSheet();
  const { trackEvent } = useAnalytics();
  const { hideGlobalPrompt } = useGlobalPrompts();

  const { bottom } = useSafeAreaInsets();

  const markPromptedFor = useMarkPromptedFor();

  useFocusEffect(
    React.useCallback(() => {
      trackEvent(AnalyticsEvent.PromptForPushNotifications, {});

      markPromptedFor({ promptType: 'push-notifications' });
    }, [markPromptedFor, trackEvent]),
  );

  return (
    <BottomSheetView>
      <View
        style={[
          t.flex,
          t.flexCol,
          t.itemsStart,
          t.justifyBetween,
          t.pT3,
          t.pX5,
          { minHeight: 100, gap: 8, paddingBottom: bottom },
        ]}
      >
        <Text2 weight="bold" size="2xl">
          Turn on notifications
        </Text2>
        <Text2 color="secondary" size="base">
          Get notified when people are trying to reach you on Farcaster. You can
          customize or disable this at any time.
        </Text2>
        <AnimatedPressable
          onPress={async () => {
            trackEvent(
              AnalyticsEvent.ClickTurnOnPushNotificationsPrompt,
              undefined,
            );

            if (typeof permission === 'undefined' || permission.canAskAgain) {
              Notifications.requestPermissionsAsync()
                .then((nextPermission) => {
                  setPermission(nextPermission);

                  if (!nextPermission.granted) {
                    trackEvent(
                      AnalyticsEvent.ClickTurnOnButNotGrantedPushNotificationsPrompt,
                      {
                        canAskAgain: nextPermission.canAskAgain,
                      },
                    );
                  }
                })
                .finally(() => {
                  forceClose();
                  hideGlobalPrompt();
                });
            } else {
              openWarpcastSettings();
              forceClose();
              hideGlobalPrompt();
            }
          }}
          style={{ flex: 1, height: 48, width: '100%', marginTop: 12 }}
        >
          <View
            style={[
              t.flex1,
              t.backgrounds.brand,
              { borderRadius: 32 },
              t.justifyCenter,
              t.itemsCenter,
              { height: 48 },
            ]}
          >
            <Text2 size="lg" weight="semibold" color="light">
              Continue
            </Text2>
          </View>
        </AnimatedPressable>
      </View>
    </BottomSheetView>
  );
};

export { EnablePushNotificationsPrompt };
