import { Octicons } from '@expo/vector-icons';
import { BottomSheetView, useBottomSheet } from '@gorhom/bottom-sheet';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Prompt } from '~/components/prompts/Prompt';
import { Text } from '~/components/Text';
import { relaunchWarpcastPromptKey } from '~/constants/Storage';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { sizes, useTheme } from '~/contexts/ThemeProvider';

function RelaunchWarpcastPrompt() {
  const { activePromptKey, hideGlobalPrompt } = useGlobalPrompts();
  const { trackEvent } = useAnalytics();

  const shouldPresent = React.useCallback(
    () => activePromptKey === relaunchWarpcastPromptKey,
    [activePromptKey],
  );

  React.useEffect(() => {
    if (activePromptKey === relaunchWarpcastPromptKey) {
      //trackEvent(AnalyticsEvent.ShowRelaunchWarpcastPrompt, {});
    }
  }, [activePromptKey, trackEvent]);

  return (
    <Prompt
      shouldPresent={shouldPresent}
      height={'100%'}
      enableDynamicSizing={true}
      storageKey={relaunchWarpcastPromptKey}
      enableTouchThrough={false}
      onBackdropPress={hideGlobalPrompt}
      onCloseCallback={hideGlobalPrompt}
      withExtraShadow={true}
    >
      <RelaunchWarpcastBottomSheet />
    </Prompt>
  );
}

export function RelaunchWarpcastBottomSheet() {
  const t = useTheme();
  const { bottom } = useSafeAreaInsets();
  const { hideGlobalPrompt } = useGlobalPrompts();
  const { forceClose } = useBottomSheet();

  const closePrompt = React.useCallback(() => {
    forceClose();
    hideGlobalPrompt();
  }, [forceClose, hideGlobalPrompt]);

  return (
    <BottomSheetView>
      <View
        style={[
          t.flex,
          t.flexCol,
          t.itemsStart,
          t.justifyBetween,
          t.p4,
          t.pT2,
          t.pB0,
          // This is a quirk of dynamically sized bottom sheet views with flex displays
          { minHeight: 100 },
        ]}
      >
        <View style={[t.flex, t.flexCol, t.itemsCenter, t.wFull]}>
          <View
            style={[
              t.flex,
              t.itemsCenter,
              t.justifyCenter,
              t.roundedFull,
              t.w18,
              t.h18,
              t.bgFrameActionsUnderneath,
            ]}
          >
            <Octicons name="sync" size={24} style={[t.texts.brand]} />
          </View>
          <View
            style={[t.wFull, t.mT5, t.mB3, t.justifyCenter, t.flex, t.flexRow]}
          >
            <Text
              style={[
                t.flex,
                t.flexRow,
                t.justifyCenter,
                t.texts.primary,
                t.fontBold,
                t.text2xl,
                t.textCenter,
              ]}
            >
              Relaunch Farcaster
            </Text>
          </View>
          <View style={[t.flex, t.flexCol, t.wFull, t.mB5]}>
            <Text style={[t.texts.tertiary, t.textBase, t.textCenter]}>
              To apply your changes, please close and reopen the app.
            </Text>
          </View>
        </View>

        <View style={[t.wFull, { marginBottom: Math.max(bottom, sizes.s2) }]}>
          <TouchableOpacity
            style={[
              t.bgActionFrameTx,
              t.roundedLg,
              t.flex,
              t.flexRow,
              t.justifyCenter,
              t.itemsCenter,
              t.pY4,
              t.pX3,
              t.roundedLg,
              t.borderHairline,
              t.borderDefault,
            ]}
            activeOpacity={0.75}
            onPress={closePrompt}
          >
            <Text style={[t.texts.light, t.textBase, t.fontSemibold]}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheetView>
  );
}

export { RelaunchWarpcastPrompt };
