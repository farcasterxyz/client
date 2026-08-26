import { SolanaCombinedTransaction } from '@farcaster/miniapp-core';
import {
  ApiChain,
  ApiSwapQuote,
  ApiWalletEvmScanAction200Response,
} from 'farcaster-client-data';
import { useUserPreferences } from 'farcaster-client-hooks';
import React, { useMemo } from 'react';
import { ScrollView, View } from 'react-native';

import { largeTransactionUsd } from '../../../../constants';
import { useTheme, useWalletSurface } from '../../../../contexts';
import { useAttemptBiometricAuth } from '../../../../hooks';
import {
  EvmPreviewRequest,
  SolanaSignAndSendTransactionPreviewRequest,
  SolanaSignTransactionPreviewRequest,
} from '../../../../types';
import { TransactionDetailsCard, TransactionSummaryCard } from '../cards';
import { ActionButtons } from '../common';

/**
 * Screen component for displaying verified/approved transactions ready for confirmation
 */
export function VerifiedTransactionScreen({
  onConfirm,
  onCancel,
  isConfirming,
  isCancelling,
  disabled,
  chain,
  request,
  data,
  gaslessQuote,
  estimatedFeeUsd,
  innerView,
  offChainSignatureLabel,
}: {
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
  isConfirming: boolean;
  isCancelling: boolean;
  disabled?: boolean;
  chain: ApiChain | undefined;
  request:
    | EvmPreviewRequest<
        | 'eth_sendTransaction'
        | 'eth_signTypedData_v4'
        | 'personal_sign'
        | 'wallet_sendCalls'
      >['request']
    | SolanaSignAndSendTransactionPreviewRequest
    | SolanaSignTransactionPreviewRequest<SolanaCombinedTransaction>;
  data?: ApiWalletEvmScanAction200Response['result'];
  gaslessQuote?: ApiSwapQuote | null;
  estimatedFeeUsd?: number;
  innerView?: React.ReactNode;
  offChainSignatureLabel?: string;
}) {
  const t = useTheme();
  useWalletSurface(); // Used in nested components

  const stateChanges = data?.stateChanges ?? [];
  const [firstOutChange] = stateChanges.filter(
    (change) => change.direction === 'OUT',
  );
  const usdValue = firstOutChange?.usdPrice ?? 0;

  const { data: prefsData } = useUserPreferences();
  const biometricAuthLargeTransactions =
    prefsData?.result?.preferences?.biometricAuthLargeTransactions ?? false;
  const attemptBiometricAuth = useAttemptBiometricAuth();

  const onPressConfirmWithBiometrics = React.useCallback(async () => {
    if (
      request.method === 'eth_sendTransaction' &&
      usdValue >= largeTransactionUsd &&
      biometricAuthLargeTransactions
    ) {
      const { success } = await attemptBiometricAuth();
      if (!success) {
        onCancel();
        return;
      }
    }
    onConfirm();
  }, [
    usdValue,
    biometricAuthLargeTransactions,
    attemptBiometricAuth,
    onCancel,
    onConfirm,
    request.method,
  ]);

  const rawData = useMemo(() => {
    if (
      request.method === 'eth_sendTransaction' &&
      typeof request.params[0] === 'object' &&
      request.params[0] &&
      'data' in request.params[0]
    ) {
      return request.params[0].data;
    } else if (
      request.method === 'eth_signTypedData_v4' &&
      typeof request.params[1] === 'string'
    ) {
      try {
        return JSON.stringify(JSON.parse(request.params[1]), null, 2);
      } catch {
        return request.params[1];
      }
    } else if (
      request.method === 'personal_sign' &&
      typeof request.params[0] === 'string'
    ) {
      return request.params[0];
    } else if (request.method === 'wallet_sendCalls') {
      return JSON.stringify(request.params[0], null, 2);
    }
    return null;
  }, [request]);

  const disclaimerText: string | undefined = useMemo(() => {
    if (data?.validation?.type === 'BENIGN') {
      return undefined;
    }
    return 'Only confirm if you trust this mini app.';
  }, [data]);

  const showFees =
    request.method === 'eth_sendTransaction' ||
    request.method === 'wallet_sendCalls' ||
    request.method === 'signAndSendTransaction' ||
    request.method === 'signTransaction';

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} nestedScrollEnabled>
      <View style={[t.flex1, t.flexCol, { gap: 12 }]}>
        <TransactionSummaryCard scanData={data} customContent={innerView} />

        <TransactionDetailsCard
          chain={chain}
          details={data?.details}
          stateChanges={data?.stateChanges}
          estimatedFeeUsd={estimatedFeeUsd}
          gaslessQuote={gaslessQuote}
          showFees={showFees}
          functionSignature={data?.details?.functionSignature}
          rawData={rawData}
          offChainSignatureLabel={offChainSignatureLabel}
          // Temporary hide advanced section for solana
          hasAdvanced={chain !== 'solana'}
        />

        <View style={{ flexGrow: 1 }} />

        <ActionButtons
          onConfirm={onPressConfirmWithBiometrics}
          onCancel={onCancel}
          isConfirming={isConfirming}
          isCancelling={isCancelling}
          confirmDisabled={disabled || isConfirming || isCancelling}
          disclaimerText={disclaimerText}
        />
      </View>
    </ScrollView>
  );
}
