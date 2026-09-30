import { SmileyIcon } from '@primer/octicons-react';
import classNames from 'classnames';
import { AnalyticsEvent } from 'farcaster-analytics';
import type React from 'react';

import { EmojiPickerPopover } from '~/components/popovers/EmojiPickerPopover';
import { useAnalytics } from '~/contexts/AnalyticsProvider';

type EmojiComposerPickerProps = {
  onEmojiPick: ({ emoji }: { emoji: string }) => void;
  className?: string;
  iconClassName?: string;
  popoverClassName?: string;
};

const EmojiComposerPicker: React.FC<EmojiComposerPickerProps> = ({
  onEmojiPick,
  className,
  iconClassName,
  popoverClassName,
}) => {
  const { trackEvent } = useAnalytics();

  return (
    <EmojiPickerPopover
      renderInAnchoredPopover
      onEmojiPick={({ emoji }) => {
        trackEvent(AnalyticsEvent.CastComposerEmojiSelected, {});
        onEmojiPick({ emoji });
      }}
      contentClassName={popoverClassName}
      trigger={
        <div
          className={classNames(
            'flex cursor-pointer flex-row items-center rounded-md p-1 px-4 py-2',
            className,
          )}
          onClick={() => {
            trackEvent(AnalyticsEvent.CastComposerEmojiPressed, {});
          }}
        >
          <SmileyIcon size={16} className={iconClassName} />
        </div>
      }
    />
  );
};

export { EmojiComposerPicker };
