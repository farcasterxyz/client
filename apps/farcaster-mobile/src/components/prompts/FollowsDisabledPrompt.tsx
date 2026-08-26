import { useBottomSheet } from '@gorhom/bottom-sheet';
import { AnalyticsEvent } from 'farcaster-analytics';
import { getNotionLinkTarget } from 'farcaster-client-hooks';
import React, { FC, memo } from 'react';
import { Linking, View } from 'react-native';

import { Button } from '~/components/Button';
import { Text } from '~/components/Text';
import { TextWithPress } from '~/components/TextWithPress';
import { followsDisabledPromptKey } from '~/constants/Storage';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { useTheme } from '~/contexts/ThemeProvider';

import { Prompt } from './Prompt';

const FollowsDisabledPrompt: FC = memo(() => {
  const { trackEvent } = useAnalytics();

  const { activePromptKey, hideGlobalPrompt } = useGlobalPrompts();

  const shouldPresent = React.useCallback(() => {
    return activePromptKey === followsDisabledPromptKey;
  }, [activePromptKey]);

  React.useEffect(() => {
    if (activePromptKey === followsDisabledPromptKey) {
      trackEvent(AnalyticsEvent.ShowFollowsDisabledPrompt, undefined);
    }
  }, [activePromptKey, trackEvent]);

  return (
    <Prompt
      shouldPresent={shouldPresent}
      height={220}
      storageKey={followsDisabledPromptKey}
      enableTouchThrough={false}
      onBackdropPress={hideGlobalPrompt}
    >
      <FollowsDisabledPromptContent />
    </Prompt>
  );
});

FollowsDisabledPrompt.displayName = 'FollowsDisabledPrompt';

const FollowsDisabledPromptContent: React.FC = () => {
  const t = useTheme();
  const { forceClose } = useBottomSheet();
  const { hideGlobalPrompt } = useGlobalPrompts();

  return (
    <View style={[t.hFull, t.justifyBetween, t.p4]}>
      <View>
        <Text
          style={[
            t.textBase,
            t.texts.primary,
            t.text2xl,
            t.fontExtrabold,
            t.mB2,
          ]}
        >
          Follows
        </Text>
        <View style={[t.flex, t.flexCol, t.itemsStart, t.mR4]}>
          <Text style={[t.texts.secondary, t.textBase]} numberOfLines={2}>
            You have reached your max follows limit.
          </Text>
          <TextWithPress
            style={[t.pT1, t.texts.brand]}
            onPress={() => {
              Linking.openURL(getNotionLinkTarget({ to: 'follows' }));
            }}
          >
            Learn more
          </TextWithPress>
        </View>
      </View>
      <View>
        <Button
          title="Close"
          variant="muted"
          style={[t.mT2]}
          onPress={() => {
            hideGlobalPrompt();
            forceClose();
          }}
        />
      </View>
    </View>
  );
};

export { FollowsDisabledPrompt };
