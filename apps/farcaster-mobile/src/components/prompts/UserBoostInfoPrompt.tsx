import { Octicons } from '@expo/vector-icons';
import { BottomSheetView, useBottomSheet } from '@gorhom/bottom-sheet';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  formatDuration,
  getNotionLinkTarget,
  sleep,
  useInvalidateUserAppContext,
  useTrackEvent,
} from 'farcaster-client-hooks';
import React, { useCallback, useMemo } from 'react';
import { Keyboard, Linking, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ButtonV2 } from '~/components/ButtonV2';
import { LoadingIndicator } from '~/components/LoadingIndicator';
import { Prompt } from '~/components/prompts/Prompt';
import { Text } from '~/components/Text';
import { TextWithPress } from '~/components/TextWithPress';
import { userBoostInfoPromptKey } from '~/constants/Storage';
import { useOpenComposer } from '~/contexts/CreateCastComposerProvider';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { sizes, useTheme } from '~/contexts/ThemeProvider';
import { useUserAppContext } from '~/contexts/UserAppContextProvider';

const UserBoostInfoPrompt: React.FC = React.memo(() => {
  const invalidateUserAppContext = useInvalidateUserAppContext();
  const { activePromptKey, hideGlobalPrompt, globalData } = useGlobalPrompts();

  const shouldPresent = useCallback(() => {
    const present = activePromptKey === userBoostInfoPromptKey;

    if (present) {
      Keyboard.dismiss();
      invalidateUserAppContext();
    }

    return present;
  }, [activePromptKey, invalidateUserAppContext]);

  const showCastButton = useMemo(() => {
    return globalData.userBoostInfo?.showCastButton === true;
  }, [globalData]);

  return (
    <Prompt
      shouldPresent={shouldPresent}
      height={'60%'}
      enableDynamicSizing={true}
      storageKey={userBoostInfoPromptKey}
      enableTouchThrough={false}
      onBackdropPress={hideGlobalPrompt}
      onCloseCallback={hideGlobalPrompt}
      withExtraShadow={true}
    >
      <UserBoostInfoPromptContent showCastButton={showCastButton} />
    </Prompt>
  );
});

UserBoostInfoPrompt.displayName = 'UserBoostPrompt';

interface UserBoostInfoPromptContentProps {
  showCastButton: boolean;
}

const UserBoostInfoPromptContent: React.FC<UserBoostInfoPromptContentProps> = ({
  showCastButton,
}) => {
  const insets = useSafeAreaInsets();
  const { userBoost } = useUserAppContext();
  const { trackEvent } = useTrackEvent();
  const t = useTheme();
  const { forceClose } = useBottomSheet();
  const { hideGlobalPrompt } = useGlobalPrompts();
  const openComposer = useOpenComposer();

  const closePrompt = React.useCallback(async () => {
    const transitionDuration = 200;

    forceClose({ duration: transitionDuration });
    hideGlobalPrompt();

    await sleep(transitionDuration);
  }, [forceClose, hideGlobalPrompt]);

  if (userBoost === undefined) {
    // We should never be here
    return (
      <BottomSheetView>
        <View
          style={[t.flexCol, t.itemsCenter, t.justifyCenter, { height: 150 }]}
        >
          <LoadingIndicator />
        </View>
      </BottomSheetView>
    );
  }

  return (
    <BottomSheetView>
      <View
        style={[
          t.p4,
          t.flexCol,
          { paddingBottom: insets.bottom + sizes.s4 },
          // This is a quirk of dynamically sized bottom sheet views with flex displays
          { minHeight: 100 },
        ]}
      >
        <View style={[t.flexCol, t.itemsCenter]}>
          <View
            style={[
              t.roundedFull,
              t.flexRow,
              t.justifyCenter,
              t.itemsCenter,
              {
                height: 62,
                width: 62,
                backgroundColor: '#FBF0CD',
              },
            ]}
          >
            <Octicons name="rocket" size={28} color={t.colors.yellow800} />
          </View>
          <Text
            style={[
              t.texts.primary,
              t.fontSemibold,
              t.textCenter,
              t.mT4,
              { fontSize: 28 },
            ]}
          >
            Boost
          </Text>
          <Text
            style={[
              t.texts.secondary,
              t.textCenter,
              t.mT2,
              t.pX8,
              { fontSize: 17, lineHeight: 24 },
            ]}
          >
            Casts will reach more people for the next{' '}
            {formatDuration(userBoost.endsAt - Date.now())}.{' '}
            <TextWithPress
              style={[t.texts.brand]}
              onPress={() => {
                Linking.openURL(getNotionLinkTarget({ to: 'boosts' }));
              }}
            >
              Learn more
            </TextWithPress>
            .
          </Text>
        </View>
        {showCastButton && (
          <ButtonV2
            title="Cast Now"
            margin={{ marginTop: sizes.s6 }}
            onPress={async () => {
              trackEvent(AnalyticsEvent.PressUserBoostCastNow, undefined);

              await closePrompt();

              setTimeout(() => openComposer({}), 350);
            }}
            textStyle={{ fontSize: 17 }}
          />
        )}
      </View>
    </BottomSheetView>
  );
};

export { UserBoostInfoPrompt };
