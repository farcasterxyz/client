import * as HoverCard from '@radix-ui/react-hover-card';
import classNames from 'classnames';
import React, { useCallback, useState } from 'react';

type HoverCardTooltipProps = {
  className: string;
  trigger: React.ReactNode;
  content: React.ReactNode;
  triggerWrapper?: 'span' | 'div';
};

const HoverCardTooltip: React.FC<HoverCardTooltipProps> = ({
  trigger,
  content,
  className,
  triggerWrapper: TriggerWrapper = 'span',
}) => {
  const [open, setOpen] = useState(false);
  const [suppressHoverOpen, setSuppressHoverOpen] = useState(false);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen && suppressHoverOpen) {
        return;
      }

      setOpen(nextOpen);
    },
    [suppressHoverOpen],
  );

  return (
    <HoverCard.Root open={open} onOpenChange={handleOpenChange}>
      <HoverCard.Trigger asChild>
        <TriggerWrapper
          className={classNames('relative', className)}
          onMouseDown={() => {
            setSuppressHoverOpen(true);
            setOpen(false);
          }}
          onMouseLeave={() => {
            setSuppressHoverOpen(false);
          }}
        >
          {trigger}
        </TriggerWrapper>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          className="HoverCardContent z-50"
          side="bottom"
          onClick={(e) => {
            // We are blocking click events to be propagated down to the components below
            // the hover card.
            e.stopPropagation();
          }}
        >
          <span className="w-300 relative">
            <React.Suspense>{content}</React.Suspense>
          </span>
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
};

HoverCardTooltip.displayName = 'HoverCardTooltip';

export { HoverCardTooltip };
