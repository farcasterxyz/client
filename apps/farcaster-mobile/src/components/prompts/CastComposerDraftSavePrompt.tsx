import { EvilIcons, Ionicons } from '@expo/vector-icons';
import { useBottomSheet } from '@gorhom/bottom-sheet';
import { AnalyticsEvent } from 'farcaster-analytics';
import { AtomsButton } from 'farcaster-expo';
import React from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '~/components/Text';
import { castComposerDraftSavePromptKey } from '~/constants/Storage';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useHaptics } from '~/hooks/useHaptics';

import { Prompt } from './Prompt';

type CastComposerSaveDraftPromptProps = {
  discardOrDeleteLabel: string;
  saveDraftLabel?: string;
  onDiscardDraftPress: () => void;
  onSaveDraftPress: () => Promise<void>;
  /** Called when the sheet is dismissed without discard/save (Cancel or backdrop). */
  onDismissWithoutCompleting?: () => void;
};

const iconColumnWidth = 52;

const CastComposerDraftSavePropmt: React.FC<
  CastComposerSaveDraftPromptProps
> = ({
  discardOrDeleteLabel,
  saveDraftLabel = 'Save draft',
  onDiscardDraftPress,
  onSaveDraftPress,
  onDismissWithoutCompleting,
}) => {
  const { trackEvent } = useAnalytics();

  const { activePromptKey, promptNonce, hideGlobalPrompt } = useGlobalPrompts();

  /** When true, the sheet is closing due to discard/save — skip onDismissWithoutCompleting. */
  const suppressDismissWithoutCompletingRef = React.useRef(false);

  const onSheetFullyClosed = React.useCallback(() => {
    if (!suppressDismissWithoutCompletingRef.current) {
      onDismissWithoutCompleting?.();
    }
    suppressDismissWithoutCompletingRef.current = false;
    hideGlobalPrompt();
  }, [hideGlobalPrompt, onDismissWithoutCompleting]);

  const shouldPresent = React.useCallback(() => {
    return activePromptKey === castComposerDraftSavePromptKey;
  }, [activePromptKey]);

  React.useEffect(() => {
    if (activePromptKey === castComposerDraftSavePromptKey) {
      trackEvent(AnalyticsEvent.ShowCastDraftPrompt, undefined);
    }
  }, [activePromptKey, trackEvent]);

  return (
    <Prompt
      shouldPresent={shouldPresent}
      height={'30%'}
      storageKey={castComposerDraftSavePromptKey}
      enableTouchThrough={false}
      onAfterPromptCleanup={onSheetFullyClosed}
      onCloseCallback={hideGlobalPrompt}
      dismissWhenShouldNotPresent={true}
      keepMounted={true}
      keyboardBlurBehavior="none"
      forcePresentSignal={promptNonce}
    >
      <CastComposerDraftSavePromptContent
        discardOrDeleteLabel={discardOrDeleteLabel}
        saveDraftLabel={saveDraftLabel}
        onDiscardDraftPress={onDiscardDraftPress}
        onSaveDraftPress={onSaveDraftPress}
        suppressDismissWithoutCompletingRef={
          suppressDismissWithoutCompletingRef
        }
      />
    </Prompt>
  );
};

CastComposerDraftSavePropmt.displayName = 'CastComposerDraftSavePropmt';

const CastComposerDraftSavePromptContent: React.FC<
  CastComposerSaveDraftPromptProps & {
    suppressDismissWithoutCompletingRef: React.MutableRefObject<boolean>;
  }
> = ({
  discardOrDeleteLabel,
  saveDraftLabel = 'Save draft',
  onDiscardDraftPress,
  onSaveDraftPress,
  suppressDismissWithoutCompletingRef,
}) => {
  const t = useTheme();
  const { hideGlobalPrompt } = useGlobalPrompts();
  const { close } = useBottomSheet();
  const { trackEvent } = useAnalytics();
  const { triggerImpactAsync } = useHaptics();

  // Use `close()` (NOT `forceClose()`) for an immediate visual dismiss.  The
  // sheet is kept mounted across opens (Prompt `keepMounted`), and `forceClose()`
  // corrupts gorhom's internal animated position/index state — making the next
  // open silently fail.  `close()` transitions the sheet state cleanly, starts
  // the dismiss animation synchronously, and fires `onClose` for cleanup;
  // `hideGlobalPrompt()` then clears the active prompt key.
  const onCancelPress = React.useCallback(() => {
    close();
    hideGlobalPrompt();
  }, [close, hideGlobalPrompt]);

  const onDiscardPress = React.useCallback(() => {
    triggerImpactAsync();

    trackEvent(AnalyticsEvent.DiscardCastDraft, undefined);

    suppressDismissWithoutCompletingRef.current = true;
    close();
    hideGlobalPrompt();

    onDiscardDraftPress();
  }, [
    close,
    hideGlobalPrompt,
    onDiscardDraftPress,
    suppressDismissWithoutCompletingRef,
    trackEvent,
    triggerImpactAsync,
  ]);

  const onSavePress = React.useCallback(async () => {
    triggerImpactAsync();

    trackEvent(AnalyticsEvent.SaveCastDraft, undefined);

    suppressDismissWithoutCompletingRef.current = true;
    close();
    hideGlobalPrompt();

    await onSaveDraftPress();
  }, [
    close,
    hideGlobalPrompt,
    onSaveDraftPress,
    suppressDismissWithoutCompletingRef,
    trackEvent,
    triggerImpactAsync,
  ]);

  return (
    <View style={[t.hFull, t.pX4, t.pB6]}>
      <View style={[t.flexGrow, t.justifyCenter]}>
        <Pressable
          style={[t.flexRow, t.itemsCenter, t.mB8]}
          onPress={onDiscardPress}
        >
          <View style={[t.itemsCenter, { width: iconColumnWidth }]}>
            <Ionicons name="trash-outline" size={20} style={[t.texts.danger]} />
          </View>
          <Text style={[t.texts.danger, t.textXl]}>{discardOrDeleteLabel}</Text>
        </Pressable>
        <Pressable style={[t.flexRow, t.itemsCenter]} onPress={onSavePress}>
          <View style={[t.itemsCenter, { width: iconColumnWidth }]}>
            <EvilIcons name="pencil" size={30} style={[t.texts.secondary]} />
          </View>
          <Text style={[t.texts.primary, t.textXl]}>{saveDraftLabel}</Text>
        </Pressable>
      </View>
      <AtomsButton onPress={onCancelPress} hierarchy="overlay" size="l">
        Cancel
      </AtomsButton>
    </View>
  );
};

export { CastComposerDraftSavePropmt };
