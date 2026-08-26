import { ChevronDownIcon } from '@primer/octicons-react';
import React from 'react';

import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';

const ChannelSelectorSuspenseFallback: React.FC = React.memo(() => {
  return (
    <div className="flex w-max cursor-pointer flex-row items-center rounded-md border p-1 text-sm text-muted bg-faint border-default hover:bg-overlay-light">
      <span className="flex size-[20px] items-center justify-center">
        <LoadingIndicator size="sm" />
      </span>
      <ChevronDownIcon className="text-muted" />
    </div>
  );
});

ChannelSelectorSuspenseFallback.displayName =
  'ChannelSelectorSuspenseFallback ';

export { ChannelSelectorSuspenseFallback };
