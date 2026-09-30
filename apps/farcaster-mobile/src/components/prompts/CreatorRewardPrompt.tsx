import { Octicons } from '@expo/vector-icons';
import { BottomSheetView, useBottomSheet } from '@gorhom/bottom-sheet';
import { AnalyticsEvent } from 'farcaster-analytics';
import { getTransactionExplorerUrl } from 'farcaster-client-data';
import {
  getNotionLinkTarget,
  sleep,
  useInvalidateUserAppContext,
  useTrackEvent,
} from 'farcaster-client-hooks';
import React, { useCallback } from 'react';
import { Keyboard, Linking, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ButtonV2 } from '~/components/ButtonV2';
import { Prompt } from '~/components/prompts/Prompt';
import { Text, Text2 } from '~/components/Text';
import { TextWithPress } from '~/components/TextWithPress';
import { creatorRewardPromptKey } from '~/constants/Storage';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { sizes, useTheme } from '~/contexts/ThemeProvider';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

const CreatorRewardPrompt: React.FC = React.memo(() => {
  const invalidateUserAppContext = useInvalidateUserAppContext();
  const { activePromptKey, hideGlobalPrompt, globalData } = useGlobalPrompts();

  const shouldPresent = useCallback(() => {
    const present = activePromptKey === creatorRewardPromptKey;

    if (present) {
      Keyboard.dismiss();
      invalidateUserAppContext();
    }

    return present;
  }, [activePromptKey, invalidateUserAppContext]);

  return (
    <Prompt
      shouldPresent={shouldPresent}
      height={'60%'}
      enableDynamicSizing={true}
      storageKey={creatorRewardPromptKey}
      enableTouchThrough={false}
      onBackdropPress={hideGlobalPrompt}
      onCloseCallback={hideGlobalPrompt}
      withExtraShadow={true}
    >
      {globalData.creatorReward && (
        <CreatorRewardPromptContent creatorReward={globalData.creatorReward} />
      )}
    </Prompt>
  );
});

CreatorRewardPrompt.displayName = 'CreatorRewardPrompt';

const CreatorRewardPromptContent: React.FC<{
  creatorReward: {
    rewardCents: number;
    rewardDate: string;
    txHash: string;
    txChainId: number;
  };
}> = ({ creatorReward }) => {
  const insets = useSafeAreaInsets();
  const { trackEvent } = useTrackEvent();
  const t = useTheme();
  const { forceClose } = useBottomSheet();
  const { hideGlobalPrompt } = useGlobalPrompts();

  const closePrompt = React.useCallback(async () => {
    const transitionDuration = 200;

    forceClose({ duration: transitionDuration });
    hideGlobalPrompt();

    await sleep(transitionDuration);
  }, [forceClose, hideGlobalPrompt]);

  const exploreUrl = getTransactionExplorerUrl({
    type: 'tx',
    chainId: creatorReward.txChainId.toString(),
    hash: creatorReward.txHash,
  });

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
                backgroundColor: t.dark ? '#CBC1E6' : '#7C65C133',
              },
            ]}
          >
            <Octicons name="gift" size={28} color={t.colors.actionPrimary} />
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
            Top Caster Reward
          </Text>
          <Text2
            color="secondary"
            size="lg"
            style={[t.textCenter, t.mT2, t.pX8]}
          >
            Farcaster sent you{' '}
            <Text2 weight="semibold" size="lg">
              {Math.floor(creatorReward.rewardCents / 100)} USDC
            </Text2>{' '}
            for your casts on{' '}
            {dateFormatter.format(new Date(creatorReward.rewardDate))}.
          </Text2>
        </View>
        {exploreUrl && (
          <ButtonV2
            title="View transaction"
            margin={{ marginVertical: sizes.s6 }}
            IconRight={({ color }) => (
              <Octicons name="link-external" color={color} size={20} />
            )}
            textStyle={{ fontSize: 17, lineHeight: 20 }}
            onPress={async () => {
              trackEvent(AnalyticsEvent.ViewCreatorRewardInExplorer, {
                rewardCents: creatorReward.rewardCents,
                rewardDate: creatorReward.rewardDate,
                explorerUrl: exploreUrl,
              });

              await Linking.openURL(exploreUrl);
              await closePrompt();
            }}
          />
        )}
        <TextWithPress
          style={[t.texts.secondary, t.textBase, t.textCenter]}
          onPress={() => {
            Linking.openURL(getNotionLinkTarget({ to: 'creator-rewards' }));
          }}
        >
          Learn more
        </TextWithPress>
      </View>
    </BottomSheetView>
  );
};

export { CreatorRewardPrompt };
