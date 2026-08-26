import { Ionicons, Octicons } from '@expo/vector-icons';
import {
  useBottomSheet,
  useBottomSheetTimingConfigs,
} from '@gorhom/bottom-sheet';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  CastReactionType,
  RecastError,
  UndoRecastError,
  useCreateRecast,
  useProcessCastAttachments,
  useSetCastAttachmentPreviewCache,
  useTrackCastReaction,
  useUndoRecast,
} from 'farcaster-client-hooks';
import { AtomsButton, useRootToast } from 'farcaster-expo';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '~/components/Text';
import { easing } from '~/constants/Animated';
import { castQuotePromptKey } from '~/constants/Storage';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import {
  ApiCastWithContext,
  useCastToTakeAction,
} from '~/contexts/CastToTakeActionProvider';
import { useOpenComposer } from '~/contexts/CreateCastComposerProvider';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { useHaptics } from '~/hooks/useHaptics';
import { createCastParamsWithIntent } from '~/utils/CastComposerIntentUtils';
import { trackError } from '~/utils/ErrorUtils';
import { sleep } from '~/utils/PromiseUtils';

import { Prompt } from './Prompt';

const iconColumnWidth = 52;

const QuoteCastPrompt: React.FC = () => {
  const { trackEvent } = useAnalytics();
  const { activePromptKey, promptNonce, hideGlobalPrompt } = useGlobalPrompts();

  const { cast, feed } = useCastToTakeAction();

  const shouldPresent = React.useCallback(() => {
    return (
      activePromptKey === castQuotePromptKey && typeof cast !== 'undefined'
    );
  }, [activePromptKey, cast]);

  React.useEffect(() => {
    if (activePromptKey === castQuotePromptKey) {
      trackEvent(AnalyticsEvent.ShowRecastOrQuoteCastPrompt, undefined);
    }
  }, [activePromptKey, trackEvent]);

  const animationConfigs = useBottomSheetTimingConfigs({
    duration: 200,
    easing,
  });

  return (
    <Prompt
      shouldPresent={shouldPresent}
      height={'30%'}
      storageKey={castQuotePromptKey}
      enableTouchThrough={false}
      withExtraShadow={true}
      onBackdropPress={hideGlobalPrompt}
      onCloseCallback={hideGlobalPrompt}
      animationConfigs={animationConfigs}
      dismissWhenShouldNotPresent={true}
      keepMounted={true}
      forcePresentSignal={promptNonce}
    >
      <QuoteCastPromptContent cast={cast!} feed={feed} />
    </Prompt>
  );
};

QuoteCastPrompt.displayName = 'QuoteCastPrompt';

type QuoteCastPromptContentProps = {
  cast: ApiCastWithContext;
  feed?: string;
};

const QuoteCastPromptContent: React.FC<QuoteCastPromptContentProps> = ({
  cast,
  feed,
}) => {
  const t = useTheme();
  const openComposer = useOpenComposer();
  const toast = useRootToast();
  const currentUser = useCurrentUser_UNSAFE();
  const { triggerImpactAsync } = useHaptics();
  const { hideGlobalPrompt } = useGlobalPrompts();
  const { close } = useBottomSheet();

  const trackCastReaction = useTrackCastReaction();

  const processCastAttachment = useProcessCastAttachments();
  const setCastAttachmentPreviewCache = useSetCastAttachmentPreviewCache();

  const createRecast = useCreateRecast();
  const undoRecast = useUndoRecast();
  const includeReasonType = cast.reason?.type;

  const isRecasted = !!cast.viewerContext?.recast;

  const quoteCastHash = React.useMemo(() => {
    return cast.hash;
  }, [cast.hash]);

  const prefetchCastAssetAttachmentPreview = React.useCallback(async () => {
    const data = await processCastAttachment({
      text: '',
      embeds: [quoteCastHash],
    });
    setCastAttachmentPreviewCache({
      embeds: data.result.embeds,
    });
  }, [processCastAttachment, quoteCastHash, setCastAttachmentPreviewCache]);

  const closePrompt = React.useCallback(async () => {
    const transitionDuration = 350;

    close({ duration: transitionDuration });
    hideGlobalPrompt();

    await sleep(transitionDuration);
  }, [close, hideGlobalPrompt]);

  const onRecastPress = React.useCallback(() => {
    triggerImpactAsync();

    try {
      trackCastReaction({
        castHash: cast.hash,
        type: CastReactionType.Recast,
        undo: isRecasted,
        castFid: cast.author.fid,
        feed,
        ...(includeReasonType ? { includeReason: includeReasonType } : {}),
      });

      if (isRecasted) {
        undoRecast({
          cast,
          viewerFid: currentUser.fid,
        }).catch((error) => {
          toast.show('Failed to undo recast', { type: 'danger' });

          const undoRecastError = new UndoRecastError({
            error,
            hash: cast.hash,
          });

          trackError(undoRecastError);
        });
      } else {
        createRecast({
          cast,
          viewerFid: currentUser.fid,
          viewerUsername: currentUser.username,
          viewerDisplayName: currentUser.displayName,
        }).catch((error) => {
          toast.show('Failed to recast', { type: 'danger' });

          const createRecastError = new RecastError({
            error,
            castHash: cast.hash,
            fid: currentUser.fid,
          });

          trackError(createRecastError);
        });
      }
    } catch (error) {
      toast.show(isRecasted ? 'Failed to undo recast' : 'Failed to recast', {
        type: 'danger',
      });
      trackError(error);
    }

    closePrompt();
  }, [
    cast,
    closePrompt,
    createRecast,
    undoRecast,
    currentUser.displayName,
    currentUser.fid,
    currentUser.username,
    toast,
    trackCastReaction,
    triggerImpactAsync,
    isRecasted,
    feed,
    includeReasonType,
  ]);

  const onQuotePress = React.useCallback(async () => {
    triggerImpactAsync();

    await closePrompt();

    openComposer(
      createCastParamsWithIntent({
        embeds: [quoteCastHash],
        feed,
        includeReason: includeReasonType,
      }),
    );
  }, [
    closePrompt,
    feed,
    openComposer,
    quoteCastHash,
    triggerImpactAsync,
    includeReasonType,
  ]);

  React.useEffect(() => {
    prefetchCastAssetAttachmentPreview();
  }, [prefetchCastAssetAttachmentPreview]);

  const { bottom } = useSafeAreaInsets();

  return (
    <View
      style={[
        t.hFull,
        t.pX2,
        { paddingBottom: bottom + 10 },
        t.flex,
        t.flexCol,
        t.justifyBetween,
        { marginTop: '0.5%' },
      ]}
    >
      <TouchableOpacity
        style={[t.flexRow, t.itemsCenter, t.h12]}
        onPress={onRecastPress}
        activeOpacity={0.75}
      >
        <View style={[t.itemsCenter, { width: iconColumnWidth }]}>
          <Ionicons
            name="repeat-outline"
            size={24}
            style={[t.texts.tertiary, t.mL1]}
          />
        </View>
        <Text style={[t.texts.primary, t.textLg, { marginLeft: 6 }]}>
          {isRecasted ? 'Undo recast' : 'Recast'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[t.flexRow, t.itemsCenter, t.h12]}
        onPress={onQuotePress}
        activeOpacity={0.75}
      >
        <View style={[t.itemsCenter, { width: iconColumnWidth }]}>
          <Octicons name="pencil" size={20} style={[t.texts.tertiary]} />
        </View>
        <Text style={[t.texts.primary, t.textLg, { marginLeft: 6 }]}>
          Quote
        </Text>
      </TouchableOpacity>
      <AtomsButton
        onPress={closePrompt}
        hierarchy="overlay"
        size="l"
        style={[t.mX4, t.mT2]}
      >
        Cancel
      </AtomsButton>
    </View>
  );
};

export { QuoteCastPrompt };
