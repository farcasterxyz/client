import { UnseenProvider } from 'farcaster-client-hooks';
import React, { FC, memo, ReactNode } from 'react';

import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';

type WebUnseenProviderProps = {
  children: ReactNode;
};

const WebUnseenProvider: FC<WebUnseenProviderProps> = memo(
  ({ children }: WebUnseenProviderProps) => {
    const isSignedIn = useIsSignedIn();
    const user = useCurrentUser();

    const onNullUnseenResponse = React.useCallback(() => {}, []);

    // We should always be called in an authed context but make sure
    if (isSignedIn && user && user.fid) {
      return (
        <UnseenProvider
          fid={user.fid}
          onNullUnseenResponse={onNullUnseenResponse}
        >
          {children}
        </UnseenProvider>
      );
    } else {
      return <>{children}</>;
    }
  },
);
WebUnseenProvider.displayName = 'WebUnseenProvider';

export { WebUnseenProvider };
