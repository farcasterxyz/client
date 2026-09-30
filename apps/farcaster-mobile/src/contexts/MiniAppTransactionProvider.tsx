import { BottomSheetView } from '@gorhom/bottom-sheet';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiMiniAppWalletActionRequest } from 'farcaster-client-data';
import {
  useSetUserPreferences,
  useUserPreferences,
} from 'farcaster-client-hooks';
import React, { ReactNode, useCallback, useRef, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BottomSheetModal,
  useBottomSheetModalRef,
} from '~/components/BottomSheet';
import { FrameTransactionAckRisks } from '~/components/frameTransactions/FrameTransactionAckRisks';
import { LoadingIndicator } from '~/components/LoadingIndicator';
import { Text } from '~/components/Text';
import {
  ConnectedWalletProvider,
  useConnectedWallet,
} from '~/contexts/ConnectWalletProvider';
import { trackError } from '~/utils/ErrorUtils';

import { useAnalytics } from './AnalyticsProvider';
import { useTheme } from './ThemeProvider';

type MiniAppTransactionParams = {
  transactionRequest: ApiMiniAppWalletActionRequest;
  requestId: string | number | null;
  appUrl: string;
  onTransaction?: (args: {
    requestId?: string | number | null;
    transactionHash: string;
    address: string;
    correlationId: string | undefined;
  }) => void;
  onTransactionCancelled?: (requestId: string | number | null) => void;
};

export type MiniAppTransactionContextValue = {
  launchTransaction: (
    params: MiniAppTransactionParams,
  ) => Promise<{ hash: string }>;
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
    }).catch(trackError);
  }, [setUserPreferences, trackEvent]);

  return {
    hasAckedRisked: userPrefs?.result.preferences.ackFrameTransactionRisks,
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
  return (
    <ConnectedWalletProvider>
      <InnerMiniAppTransactionProvider>
        {children}
      </InnerMiniAppTransactionProvider>
    </ConnectedWalletProvider>
  );
}

export function InnerMiniAppTransactionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [params, setParams] = useState<MiniAppTransactionParams | null>(null);

  const { wallet, connect } = useConnectedWallet();
  const { hasAckedRisked, ackRisks } = useAckRisks();

  const transactionModalRef = useBottomSheetModalRef();
  const ackRisksRef = useBottomSheetModalRef();

  const checkConnect = useCallback(async () => {
    if (!wallet.address) {
      await connect();
    }

    if (!hasAckedRisked) {
      ackRisksRef.current?.present();
      return;
    }

    transactionModalRef.current?.present();
  }, [
    ackRisksRef,
    connect,
    wallet.address,
    hasAckedRisked,
    transactionModalRef,
  ]);

  const launchTransactionPromiseCallbacks = useRef<{
    resolve: (params: { hash: string }) => void;
    reject: (error: Error) => void;
  }>(undefined);

  const launchTransaction = useCallback(
    (params: MiniAppTransactionParams) => {
      return new Promise<{ hash: string }>((resolve, reject) => {
        launchTransactionPromiseCallbacks.current = {
          resolve,
          reject,
        };

        setParams(params);
        void checkConnect();
      });
    },
    [checkConnect],
  );

  const handleAck = useCallback(async () => {
    await ackRisks();

    // delay closing the ack risks modal until after the next modal has been
    // shown to get smooth animations
    setTimeout(() => {
      ackRisksRef.current?.dismiss();
    }, 350);

    transactionModalRef.current?.present();
  }, [ackRisks, ackRisksRef, transactionModalRef]);

  return (
    <MiniAppTransactionContext.Provider value={{ launchTransaction }}>
      {children}

      <BottomSheetModal name="ackFrameTransactionRisks" ref={ackRisksRef}>
        <FrameTransactionAckRisks
          onAck={handleAck}
          onCancel={() => {
            ackRisksRef.current?.dismiss();
          }}
        />
      </BottomSheetModal>
      <BottomSheetModal name="frameTransaction" ref={transactionModalRef}>
        {!!params && wallet.address && <MiniAppTransactionBottomSheet />}
      </BottomSheetModal>
    </MiniAppTransactionContext.Provider>
  );
}

export function MiniAppTransactionBottomSheet() {
  const t = useTheme();
  const { bottom } = useSafeAreaInsets();
  return (
    <BottomSheetView>
      <View
        style={[
          t.flex,
          t.justifyCenter,
          t.itemsCenter,
          { minHeight: 100, paddingBottom: bottom },
          t.pX4,
          t.pY8,
        ]}
      >
        <LoadingIndicator />
        <Text style={[t.texts.primary, t.texts.secondary, t.textLg, t.mT3]}>
          Simulating transaction
        </Text>
      </View>
    </BottomSheetView>
  );
}
