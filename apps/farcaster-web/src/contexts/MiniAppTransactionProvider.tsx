import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiMiniAppWalletActionRequest } from 'farcaster-client-data';
import {
  TransactionFailureReason,
  useSetUserPreferences,
  useUserPreferences,
} from 'farcaster-client-hooks';
import React, { ReactNode, useCallback, useState } from 'react';

import { FrameTransactionErrorModal } from '~/components/modals/FrameTransactionErrorModal';
import { FrameTransactionSuccessModal } from '~/components/modals/FrameTransactionSuccessModal';
import { FrameTransactionAlertModal } from '~/components/modals/FrameTransactionTransitionalModal';
import { MiniAppTransactionModal } from '~/components/modals/MiniAppTransactionModal';

import { useAnalytics } from './AnalyticsProvider';
import { useWallet } from './WalletProvider';

type MiniAppTransactionParams = {
  transactionRequest: ApiMiniAppWalletActionRequest;
  requestId: string | number | null;
  appUrl: string;
  onTransaction: (args: {
    transactionHash: string;
    address: string;
    correlationId: string | undefined;
  }) => void;
  onTransactionError: (reason: string) => void;
  onTransactionCancel: () => void;
};

export type MiniAppTransactionContextValue = {
  launchTransaction: (params: MiniAppTransactionParams) => Promise<void>;
};

const useAckRisks = () => {
  const { trackEvent } = useAnalytics();
  const { data: userPrefs } = useUserPreferences();
  const setUserPreferences = useSetUserPreferences();

  const ackRisks = useCallback(async () => {
    trackEvent(AnalyticsEvent.AckExerciseCaution, undefined);

    void setUserPreferences({
      preferences: {
        ackFrameTransactionRisks: true,
      },
    });
  }, [setUserPreferences, trackEvent]);

  return {
    hasAckedRisks: userPrefs?.result.preferences.ackFrameTransactionRisks,
    ackRisks,
  };
};

const MiniAppTransactionContext =
  React.createContext<MiniAppTransactionContextValue>({
    launchTransaction: async () => {
      throw new Error('Must be called in MiniAppTransactionContext provider');
    },
  });

export const useMiniAppTransaction = () =>
  React.useContext(MiniAppTransactionContext);

export function MiniAppTransactionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [params, setParams] = useState<MiniAppTransactionParams | null>(null);
  const [showTransactionModal, setShowTransactionModal] =
    React.useState<boolean>(false);
  const [
    showAckFrameTransactionRisksModal,
    setShowAckFrameTransactionRisksModal,
  ] = React.useState<boolean>(false);
  const [showTransactionSucceededModal, setShowTransactionSucceededModal] =
    React.useState<
      { transactionHash: string; transactionChainId: string } | undefined
    >(undefined);
  const [showTransactionFailedModal, setShowTransactionFailedModal] =
    React.useState<TransactionFailureReason | undefined>(undefined);

  const {
    address,
    preferredWallet,
    openConnectModal: connectWallet,
  } = useWallet();
  const { hasAckedRisks, ackRisks } = useAckRisks();
  // Deprecated: report transaction removed

  const presentTransactionModalWithAddress = useCallback(() => {
    if (!preferredWallet || !address) {
      connectWallet();
      return;
    }

    setShowTransactionModal(true);
  }, [connectWallet, preferredWallet, address]);

  const launchTransaction = useCallback(
    async (params: MiniAppTransactionParams) => {
      setParams(params);

      if (!hasAckedRisks) {
        setShowAckFrameTransactionRisksModal(true);
        return;
      }

      presentTransactionModalWithAddress();
    },
    [hasAckedRisks, presentTransactionModalWithAddress],
  );

  const handleAck = useCallback(async () => {
    await ackRisks();
    setShowAckFrameTransactionRisksModal(false);
    presentTransactionModalWithAddress();
  }, [ackRisks, presentTransactionModalWithAddress]);

  const handleTransactionSuccess = useCallback(
    async ({
      transactionHash,
      chainId,
      address,
      correlationId,
      method,
    }: {
      transactionHash: string;
      chainId?: string;
      address: string;
      correlationId: string | undefined;
      method: string;
    }) => {
      if (method === 'eth_sendTransaction' && chainId) {
        setShowTransactionSucceededModal({
          transactionHash: transactionHash,
          transactionChainId: chainId,
        });
      }
      params?.onTransaction({ transactionHash, address, correlationId });
    },
    [params],
  );

  const handleTransactionError = useCallback(
    ({
      reason,
    }: {
      correlationId: string | undefined;
      reason: TransactionFailureReason;
    }) => {
      // No-op

      params?.onTransactionError(reason);
      setShowTransactionFailedModal(reason);
    },
    [params],
  );

  const handleTransactionCancel = useCallback(() => {
    params?.onTransactionCancel();
  }, [params]);

  const handleSwitchWallet = useCallback(async () => {
    connectWallet();
  }, [connectWallet]);

  return (
    <MiniAppTransactionContext.Provider value={{ launchTransaction }}>
      {children}

      {showAckFrameTransactionRisksModal && (
        <FrameTransactionAlertModal
          onAck={handleAck}
          onClose={() => {
            setShowAckFrameTransactionRisksModal(false);
          }}
        />
      )}
      {showTransactionModal &&
        params &&
        address &&
        !showAckFrameTransactionRisksModal && (
          <MiniAppTransactionModal
            tx={params.transactionRequest}
            appUrl={params.appUrl}
            onTransactionSuccess={handleTransactionSuccess}
            onTransactionFailure={handleTransactionError}
            onTransactionCancel={handleTransactionCancel}
            onClose={() => {
              setShowTransactionModal(false);
            }}
            onSwitchWallet={handleSwitchWallet}
          />
        )}
      {showTransactionSucceededModal && (
        <FrameTransactionSuccessModal
          transactionHash={showTransactionSucceededModal.transactionHash}
          transactionChainId={showTransactionSucceededModal.transactionChainId}
          onClose={() => {
            setShowTransactionSucceededModal(undefined);
          }}
        />
      )}
      {showTransactionFailedModal && (
        <FrameTransactionErrorModal
          reason={showTransactionFailedModal}
          onClose={() => {
            setShowTransactionFailedModal(undefined);
          }}
        />
      )}
    </MiniAppTransactionContext.Provider>
  );
}
