import React, { FC, memo, ReactNode } from 'react';

import { useAuthToken } from '~/contexts/AuthTokenProvider';

import { AuthedInitializers } from './AuthedInitializers';
import { FullScreenLoadingIndicator } from './FullScreenLoadingIndicator';
import { UnauthedInitializers } from './UnauthedInitializers';
import { WebViewWipeBlockingScreen } from './WebViewWipeBlockingScreen';

type AuthedOrUnauthedInitializersProps = {
  children: ReactNode;
};

const AuthedOrUnauthedInitializers: FC<AuthedOrUnauthedInitializersProps> =
  memo(({ children }) => {
    const { isSignedIn, wipePending } = useAuthToken();

    if (isSignedIn === undefined) {
      return (
        <FullScreenLoadingIndicator debugName="AuthedOrUnauthedInitializers" />
      );
    }

    // Account-isolation gate — only when signed out. The boundary exists to
    // stop a *new* account inheriting the previous account's mini app sessions,
    // so it must block the signed-out → sign-in transition. An authenticated
    // user is the same account (e.g. a sign-out interrupted after the write-
    // ahead flag but before the token was cleared, so the token survived) —
    // blocking them would be wrong and, if the wipe can't complete, lock them
    // out of their own valid session. The pending wipe re-runs on their next
    // real sign-out, before any different account can sign in.
    if (wipePending && !isSignedIn) {
      return <WebViewWipeBlockingScreen />;
    }

    return isSignedIn ? (
      <AuthedInitializers>{children}</AuthedInitializers>
    ) : (
      <UnauthedInitializers>{children}</UnauthedInitializers>
    );
  });

AuthedOrUnauthedInitializers.displayName = 'AuthedOrUnauthedInitializers';

export { AuthedOrUnauthedInitializers };
