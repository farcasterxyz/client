import data from '@emoji-mart/data';
import EmojiPicker from '@emoji-mart/react';
import * as Popover from '@radix-ui/react-popover';
import classNames from 'classnames';
import { getEmojiDataFromNative } from 'emoji-mart';
import React, { useEffect, useState } from 'react';

import { AnchoredPopover } from '~/components/popovers/AnchoredPopover';
import { CUSTOM_EMOJIS } from '~/constants/customEmojis';
import { popoverRootId } from '~/constants/popovers';

type EmojiPickerPopoverProps = Pick<Popover.PopoverProps, 'onOpenChange'> & {
  renderInAnchoredPopover?: boolean;
  trigger: React.ReactElement;
  skipEmojis?: string[];
  onEmojiPick: ({ emoji }: { emoji: string }) => void;
  contentClassName?: string;
  /**
   * If true, include app-specific custom emojis (e.g. warplet).
   * Defaults to false so we don't accidentally insert shortcodes into text composers.
   */
  includeCustomEmojis?: boolean;
};

type EmojiSelectPayload = {
  native?: string;
  shortcodes?: string[];
};

const EmojiPickerPopover: React.FC<EmojiPickerPopoverProps> = ({
  onOpenChange,
  onEmojiPick,
  trigger,
  skipEmojis,
  contentClassName,
  includeCustomEmojis = false,
  renderInAnchoredPopover = false,
}) => {
  const [exceptEmojis, setExceptEmojis] = useState<string[]>([]);

  useEffect(() => {
    skipEmojis?.map(async (emoji) => {
      const emojiData = await getEmojiDataFromNative(emoji);
      setExceptEmojis((prev) => [...prev, emojiData?.id]);
    });
  }, [skipEmojis]);

  const stopPropagation = React.useCallback((e: React.SyntheticEvent) => {
    // We need this otherwise it inteferes with the `EmojiPicker` wheel events internally.
    // We can remove this if/when we implement our own emoji selector internally.
    // See: https://github.com/radix-ui/primitives/issues/1159
    e.stopPropagation();
  }, []);

  const handleEmojiSelect = React.useCallback(
    (emoji: EmojiSelectPayload) => {
      // Native emojis have `native`; custom emojis use `shortcodes` (e.g. [':warplet:'])
      const selected = emoji.native ?? emoji.shortcodes?.[0];
      if (typeof selected === 'string') {
        onEmojiPick({ emoji: selected });
      }
    },
    [onEmojiPick],
  );
  const popoverPortalContainer =
    document.getElementById(popoverRootId) ?? undefined;

  const emojiPicker = (
    <EmojiPicker
      data={data}
      custom={includeCustomEmojis ? CUSTOM_EMOJIS : undefined}
      onEmojiSelect={handleEmojiSelect}
      exceptEmojis={exceptEmojis}
      perLine={8}
      rows={4}
      maxFrequentRows={1}
      previewPosition="none"
      color="#8a63d2"
      skinTonePosition={'none'}
      noResultsEmoji="shrug"
    />
  );

  if (renderInAnchoredPopover) {
    return (
      <AnchoredPopover
        contentClassName={classNames('outline-hidden z-20', contentClassName)}
        onOpenChange={onOpenChange}
        sideOffset={4}
        trigger={trigger}
      >
        <div onScroll={stopPropagation} onWheel={stopPropagation}>
          {emojiPicker}
        </div>
      </AnchoredPopover>
    );
  }

  return (
    <Popover.Root modal={true} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      <Popover.Portal container={popoverPortalContainer}>
        <Popover.Content
          className={classNames('outline-hidden z-20', contentClassName)}
          side="bottom"
          sideOffset={4}
          align="start"
          onScroll={stopPropagation}
          onWheel={stopPropagation}
          onClick={stopPropagation}
          onPointerDown={stopPropagation}
        >
          {emojiPicker}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

export { EmojiPickerPopover };
