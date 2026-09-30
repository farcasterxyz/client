import { Octicons } from '@expo/vector-icons';
import { BottomSheetView, useBottomSheet } from '@gorhom/bottom-sheet';
import { AnalyticsEvent } from 'farcaster-analytics';
import { useRecordCastFeedback } from 'farcaster-client-hooks';
import { ButtonV2, useRootToast } from 'farcaster-expo';
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RecastLabel } from '~/components/casts/RecastLabel';
import { SourceLabel } from '~/components/casts/SourceLabel';
import { Text } from '~/components/Text';
import { castInfoPromptKey } from '~/constants/Storage';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import {
  ApiCastWithContext,
  useCastToTakeAction,
} from '~/contexts/CastToTakeActionProvider';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { sizes, useTheme } from '~/contexts/ThemeProvider';
import { shouldShowRecastLabel } from '~/utils/CastUtils';

import { Prompt } from './Prompt';

const CastInfoPrompt: React.FC = () => {
  const { activePromptKey, hideGlobalPrompt } = useGlobalPrompts();

  const { cast } = useCastToTakeAction();

  const shouldPresent = React.useCallback(() => {
    return activePromptKey === castInfoPromptKey && typeof cast !== 'undefined';
  }, [activePromptKey, cast]);

  return (
    <Prompt
      shouldPresent={shouldPresent}
      height={'30%'}
      enableDynamicSizing={true}
      storageKey={castInfoPromptKey}
      enableTouchThrough={false}
      onBackdropPress={hideGlobalPrompt}
      onCloseCallback={hideGlobalPrompt}
      withExtraShadow={true}
    >
      <CastInfoPromptContent cast={cast!} />
    </Prompt>
  );
};

CastInfoPrompt.displayName = 'CastInfoPrompt';

type CastInfoPromptContentProps = {
  cast: ApiCastWithContext;
};

const CastInfoPromptContent: React.FC<CastInfoPromptContentProps> = ({
  cast,
}) => {
  const t = useTheme();
  const { trackEvent } = useAnalytics();
  const toast = useRootToast();
  const { hideGlobalPrompt } = useGlobalPrompts();
  const { forceClose } = useBottomSheet();
  const { bottom } = useSafeAreaInsets();

  const recordCastFeedback = useRecordCastFeedback();

  const combinedReasons = React.useMemo(() => {
    const reasons = [];

    if (cast.author.viewerContext?.following) {
      reasons.push({
        Component: (
          <View
            style={[t.flex, t.flexRow, t.flexShrink, t.flexGrow, t.itemsCenter]}
          >
            <View
              style={[
                t.flex,
                t.itemsCenter,
                t.justifyCenter,
                t.bgMuted,
                t.roundedFull,
                t.w9,
                t.h9,
              ]}
            >
              <Octicons name={'people'} size={18} style={[t.texts.tertiary]} />
            </View>
            <Text
              style={[t.mL2, t.texts.secondary, t.textBase]}
              numberOfLines={2}
            >
              {'You are following the cast author'}
            </Text>
          </View>
        ),
      });
    }

    const recast = shouldShowRecastLabel({
      cast,
      isFocusedCast: false,
      omitRecastLabel: false,
      isPinned: false,
    });

    if (recast) {
      reasons.push({
        Component: (
          <RecastLabel
            recast={cast.recast}
            recasters={cast.recasts.recasters}
            isFocusedCast={false}
          />
        ),
      });
    }

    if (typeof cast.reason !== 'undefined') {
      reasons.push({
        Component: (
          <SourceLabel includeReason={cast.reason} channel={cast.channel} />
        ),
      });
    }

    if (reasons.length === 0) {
      reasons.push({
        Component: (
          <View
            style={[t.flex, t.flexRow, t.flexShrink, t.flexGrow, t.itemsCenter]}
          >
            <View
              style={[
                t.flex,
                t.itemsCenter,
                t.justifyCenter,
                t.bgMuted,
                t.roundedFull,
                t.w9,
                t.h9,
              ]}
            >
              <Octicons
                name="north-star"
                size={18}
                style={[t.texts.tertiary]}
              />
            </View>
            <Text
              style={[t.mL2, t.texts.secondary, t.textBase]}
              numberOfLines={2}
            >
              Suggested author
            </Text>
          </View>
        ),
      });
    }

    return reasons;
  }, [
    cast,
    t.bgMuted,
    t.flex,
    t.flexGrow,
    t.flexRow,
    t.flexShrink,
    t.h9,
    t.itemsCenter,
    t.justifyCenter,
    t.mL2,
    t.roundedFull,
    t.textBase,
    t.texts.tertiary,
    t.texts.secondary,
    t.w9,
  ]);

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
          { minHeight: 200 },
        ]}
      >
        <View style={[t.flex, t.flexCol, t.itemsStart, t.wFull]}>
          <View
            style={[
              t.wFull,
              t.mB3,
              t.itemsCenter,
              t.justifyStart,
              t.flex,
              t.flexRow,
            ]}
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
              Why is this cast here?
            </Text>
          </View>
          <View
            style={[
              t.flex,
              t.flexCol,
              t.wFull,
              t.mB5,
              t.itemsStart,
              { gap: 8 },
            ]}
          >
            {combinedReasons.map(({ Component }, index) => (
              <View
                style={[t.flex, t.wFull, t.itemsStart, t.justifyStart]}
                key={index}
              >
                {Component}
              </View>
            ))}
          </View>
        </View>
        <View style={[t.wFull, { marginBottom: Math.max(bottom, sizes.s2) }]}>
          <ButtonV2
            title="Return to feed"
            variant="primary"
            onPress={() => {
              hideGlobalPrompt();
              forceClose();
            }}
          />
          <ButtonV2
            title="Show fewer casts like this"
            variant="faint-text"
            onPress={async () => {
              await recordCastFeedback({ castHash: cast.hash });

              toast.show(
                'Fewer casts like this will appear in your home feed',
                {
                  placement: 'top',
                  type: 'normal',
                },
              );

              trackEvent(AnalyticsEvent.ClickShowFewerLikeThis, undefined);

              hideGlobalPrompt();
              forceClose();
            }}
          />
        </View>
      </View>
    </BottomSheetView>
  );
};

export { CastInfoPrompt };
