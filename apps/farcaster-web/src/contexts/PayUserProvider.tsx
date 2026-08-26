import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUser } from 'farcaster-client-data';
import { useTrackEvent } from 'farcaster-client-hooks';
import React, { useCallback, useMemo, useState } from 'react';

import { PayUserDialog } from '~/lazy/components';
import { createUUID } from '~/utils/uuidUtils';

import { useWallet } from './WalletProvider';

type PayUserParams = {
  user: ApiUser;
  via: 'profile' | 'direct-cast-conversation' | 'cast';
};

type PayUserContextValue = {
  launchPayUser: (params: PayUserParams) => void;
};

const PayUserContext = React.createContext<PayUserContextValue>({
  launchPayUser: () => {
    throw new Error('Must be called in PayUserContext');
  },
});

export const usePayUser = () => React.useContext(PayUserContext);

type PayUserProviderProps = {
  children: React.ReactNode;
};

export const PayUserProvider: React.FC<PayUserProviderProps> = React.memo(
  ({ children }) => {
    const [params, setParams] = useState<
      (PayUserParams & { payUserId: string }) | null
    >(null);
    const { trackEvent } = useTrackEvent();
    const { address, preferredWallet, openConnectModal } = useWallet();

    const launchPayUser = useCallback(
      async (params: PayUserParams) => {
        if (!preferredWallet || !address) {
          openConnectModal();
          return;
        }

        const payUserId = createUUID();
        setParams({ ...params, payUserId });

        trackEvent(AnalyticsEvent.ClickPayUser, {
          payUserId: payUserId,
          targetFid: params.user.fid,
          via: params.via,
        });
      },
      [trackEvent, preferredWallet, address, openConnectModal],
    );

    const close = () => {
      setParams(null);
    };

    const contextValue = useMemo(
      () => ({
        launchPayUser,
      }),
      [launchPayUser],
    );

    return (
      <PayUserContext.Provider value={contextValue}>
        {children}
        {params && <PayUserDialog {...params} close={close} />}
      </PayUserContext.Provider>
    );
  },
);

PayUserProvider.displayName = 'PayUserProvider';
