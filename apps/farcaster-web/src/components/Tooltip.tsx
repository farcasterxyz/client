// eslint-disable-next-line no-restricted-imports
import * as RadixTooltip from '@radix-ui/react-tooltip';
import React from 'react';

type TooltipProps = {
  trigger: React.ReactNode;
  content: React.ReactNode;
};

const Tooltip: React.FC<TooltipProps> = ({ trigger, content }) => {
  return (
    <RadixTooltip.Provider>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild={true}>{trigger}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            className="shadow-xs z-20 rounded bg-black/70"
            side="bottom"
            sideOffset={3}
          >
            {content}
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
};

Tooltip.displayName = 'Tooltip';

export { Tooltip };
