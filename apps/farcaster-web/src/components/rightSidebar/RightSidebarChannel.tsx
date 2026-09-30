import React, { FC, memo, Suspense } from 'react';

const RightSidebarChannel: FC<{ channelKey: string }> = memo(
  ({ channelKey: _ }) => {
    // Using a single suspense so that we don't flash individual items when switching between channels
    return (
      <>
        <Suspense></Suspense>
      </>
    );
  },
);

RightSidebarChannel.displayName = 'RightSidebarChannel';

export { RightSidebarChannel };
