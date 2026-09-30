import {
  useAddReactionToPlaintextDirectCast,
  useRemoveReactionFromPlaintextDirectCast,
} from 'farcaster-client-hooks';
import React, { type FC, memo, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import EmojiPicker, {
  type EmojisByCategory,
  type EmojiType,
  useRecentPicksPersistence,
} from 'rn-emoji-keyboard';
import { JsonEmoji } from 'rn-emoji-keyboard/lib/typescript/types';

import EmojisData from '~/assets/emojis.json';
import { directCastReactionPromptKey } from '~/constants/Storage';
import { useBlurOverlay } from '~/contexts/BlurOverlayProvider';
import { useDirectCastToTakeAction } from '~/contexts/DirectCastToTakeActionProvider';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';

const DirectCastReactionPrompt: FC = memo(() => {
  const t = useTheme();
  const { fid } = useCurrentUser_UNSAFE();
  const { hideGlobalPrompt } = useGlobalPrompts();
  const { setBlurOverlayChildren } = useBlurOverlay();
  const {
    directCast,
    setDirectCastToTakeAction,
    addToRecentReactions,
    recentReactions,
  } = useDirectCastToTakeAction();
  const { activePromptKey } = useGlobalPrompts();
  const addReactionToDirectCast = useAddReactionToPlaintextDirectCast();
  const removeDirectCastReaction = useRemoveReactionFromPlaintextDirectCast();
  const [isOpen, setIsOpen] = useState(false);

  const defaultHeight = Platform.OS === 'android' ? '80%' : '40%';

  const emojisByCategory = EmojisData as EmojisByCategory[];

  const useEmojiMap = useMemo(() => {
    const emojiMap = new Map();
    for (const category of emojisByCategory) {
      for (const emojiObj of category.data) {
        emojiMap.set(emojiObj.emoji, emojiObj);
      }
    }
    return emojiMap;
  }, [emojisByCategory]);

  useRecentPicksPersistence({
    initialization: async () => {
      return recentReactions
        .map((r: string) => useEmojiMap.get(r))
        .filter((e: JsonEmoji | undefined) => e !== undefined);
    },
    onStateChange: (_) => {},
  });

  useEffect(() => {
    setIsOpen(activePromptKey === directCastReactionPromptKey);
  }, [activePromptKey]);

  const handleOnClose = () => {
    setIsOpen(false);
    hideGlobalPrompt();
  };

  const [usedEmojis, setUsedEmojis] = useState(
    new Set(directCast?.viewerContext?.reactions),
  );

  useEffect(() => {
    setUsedEmojis(new Set(directCast?.viewerContext?.reactions));
  }, [directCast?.viewerContext?.reactions]);

  if (!directCast) {
    return <></>;
  }

  const handleOnEmojiSelected = (emoji: EmojiType) => {
    const reaction = emoji.emoji;
    if (usedEmojis.has(reaction)) {
      removeDirectCastReaction({
        fid,
        conversationId: directCast.conversationId,
        messageId: directCast.messageId,
        reaction,
      });
    } else {
      addToRecentReactions(reaction);
      addReactionToDirectCast({
        fid,
        conversationId: directCast.conversationId,
        messageId: directCast.messageId,
        reaction,
      });
    }
    setDirectCastToTakeAction(undefined);
    setBlurOverlayChildren();
  };

  return (
    <EmojiPicker
      styles={{
        container: {
          marginBottom: -50,
          paddingBottom: 50,
        },
      }}
      open={isOpen}
      onClose={handleOnClose}
      onEmojiSelected={handleOnEmojiSelected}
      enableSearchBar
      enableRecentlyUsed
      defaultHeight={defaultHeight}
      categoryPosition="bottom"
      emojisByCategory={emojisByCategory}
      theme={{
        knob: t.bgMuted.backgroundColor as string,
        header: t.texts.primary.color as string,
        skinTonesContainer: t.bgMuted.backgroundColor as string,
        container: (t.dark
          ? t.bgDefault.backgroundColor
          : t.bgDefault.backgroundColor) as string,
        category: {
          icon: t.texts.secondary.color as string,
          iconActive: t.texts.primary.color as string,
          container: t.bgDefault.backgroundColor as string,
          containerActive: t.bgPillActive.backgroundColor as string,
        },
        search: {
          text: t.texts.primary.color as string,
          placeholder: t.colors.text.tertiary as string,
          background: t.bgInput.backgroundColor as string,
        },
      }}
    />
  );
});

DirectCastReactionPrompt.displayName = 'DirectCastReactionPrompt';

export { DirectCastReactionPrompt };
