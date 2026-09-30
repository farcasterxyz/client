import { Octicons } from '@expo/vector-icons';
import { BottomSheetView, useBottomSheet } from '@gorhom/bottom-sheet';
import { AnalyticsEvent } from 'farcaster-analytics';
import React, { memo, useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ButtonV2 } from '~/components/ButtonV2';
import { Text2 } from '~/components/Text';
import { joinChannelViaInviteCodeRestrictedPrompt } from '~/constants/Storage';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { useTheme } from '~/contexts/ThemeProvider';

import { Prompt } from './Prompt';

const JoinChannelViaInviteCodeRestrictedPrompt = memo(() => {
  const { activePromptKey, hideGlobalPrompt, globalData } = useGlobalPrompts();
  const shouldPresent = useCallback(
    () => activePromptKey === joinChannelViaInviteCodeRestrictedPrompt,
    [activePromptKey],
  );

  return (
    <Prompt
      shouldPresent={shouldPresent}
      height={'100%'}
      storageKey={joinChannelViaInviteCodeRestrictedPrompt}
      onBackdropPress={hideGlobalPrompt}
      onCloseCallback={hideGlobalPrompt}
      enableDynamicSizing={true}
      enableTouchThrough={false}
      withExtraShadow={false}
    >
      <React.Suspense>
        <JoinChannelViaInviteCodeRestrictedPromptContent
          channelKey={globalData.joinChannelViaInviteCode?.channelKey ?? ''}
        />
      </React.Suspense>
    </Prompt>
  );
});

JoinChannelViaInviteCodeRestrictedPrompt.displayName =
  'JoinChannelViaInviteCodeRestrictedPrompt';

const JoinChannelViaInviteCodeRestrictedPromptContent = memo(
  ({ channelKey }: { channelKey: string }) => {
    const t = useTheme();
    const insets = useSafeAreaInsets();
    const { forceClose } = useBottomSheet();
    const { hideGlobalPrompt } = useGlobalPrompts();
    const { trackEvent } = useAnalytics();

    useEffect(() => {
      trackEvent(AnalyticsEvent.ViewJoinChannelAccessRestricted, {
        channelKey,
      });
    }, [channelKey, trackEvent]);

    const dismiss = () => {
      hideGlobalPrompt();
      forceClose();
    };

    return (
      <BottomSheetView>
        <View
          style={[
            t.p4,
            // This is a quirk of dynamically sized bottom sheet views with flex displays
            { minHeight: 200, paddingBottom: insets.bottom },
          ]}
        >
          <View style={[t.flexRow, t.itemsCenter]}>
            <View
              style={[
                t.h10,
                t.w10,
                t.roundedFull,
                t.justifyCenter,
                t.itemsCenter,
                { backgroundColor: t.dark ? '#2A1021' : '#FBE7EB' },
              ]}
            >
              <Octicons name="alert" size={24} color={t.colors.text.danger} />
            </View>
            <Text2 weight="semibold" size="2xl" style={[t.mL3]}>
              Access restricted
            </Text2>
          </View>
          <Text2 size="lg" style={[t.mT2]}>
            You were previously removed from this channel. As a result, your
            access via this invite link has been denied.
          </Text2>
          <Text2 style={[t.mT4]} color="secondary" size="lg">
            If you believe this is an error or wish to appeal, please contact a
            moderator for assistance.
          </Text2>
          <View style={[t.mT4, t.wFull]}>
            <ButtonV2
              title="Ok"
              variant="primary"
              onPress={dismiss}
              width="full"
            />
          </View>
        </View>
      </BottomSheetView>
    );
  },
);

export { JoinChannelViaInviteCodeRestrictedPrompt };
