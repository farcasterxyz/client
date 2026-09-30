import { UnseenProvider } from 'farcaster-client-hooks';
import React, { FC, memo, ReactNode } from 'react';

import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { ResultReturnedNullError } from '~/types';
import { trackError } from '~/utils/ErrorUtils';

type MobileUnseenProviderProps = {
  children: ReactNode;
};

const MobileUnseenProvider: FC<MobileUnseenProviderProps> = memo(
  ({ children }) => {
    const user = useCurrentUser_UNSAFE();

    const onNullUnseenResponse = React.useCallback(() => {
      trackError(
        new ResultReturnedNullError({
          screenOrProviderId: 'MobileUnseenProvider',
        }),
      );
    }, []);

    // We should always be called in an authed context but make sure
    if (user && user.fid) {
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

MobileUnseenProvider.displayName = 'MobileUnseenProvider';

export { MobileUnseenProvider };
