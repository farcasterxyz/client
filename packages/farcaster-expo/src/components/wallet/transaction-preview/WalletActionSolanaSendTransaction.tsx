import { SolanaCombinedTransaction } from '@farcaster/miniapp-core';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiSolSendTransactionRequest,
  ApiWalletActionValidationType,
} from 'farcaster-client-data';
import { sleep, useSolScanAction } from 'farcaster-client-hooks';
import * as React from 'react';
import { Platform, View } from 'react-native';

import {
  useEmbeddedWallet,
  useRootToast,
  useSharedTelemetry,
  useTheme,
  useWalletSurface,
} from '../../../contexts';
import {
  useExpiringApproval,
  useSolanaBalance,
  useSolanaFeeEstimate,
  useWalletLinkTransactionTracker,
  useWalletRefresh,
} from '../../../hooks';
import {
  ConnectionContext,
  SolanaSignAndSendTransactionPreviewRequest,
  SolanaSignTransactionPreviewRequest,
} from '../../../types';
import { serializeSolanaTransaction } from '../../../utils/SolanaUtils';
import { AutoDisplayingBottomSheetModal } from '../../bottom-sheet';
import {
  MaliciousScanSection,
  WarningScanSection2,
} from './common/StateChangesView';
import {
  MALICIOUS_TRANSACTION_MESSAGE,
  VALIDATION_FAILURE_MESSAGE,
} from './PreviewEthSendTransactionRouter';
import {
  ErrorDisplayScreen,
  TransactionValidationLoadingScreen,
  ValidationAssertionScreen,
  VerifiedTransactionScreen,
} from './screens';
import { TRANSACTION_TTL_MS } from './WalletActionEthSendTransaction';
import { WalletActionPreviewHeader } from './WalletActionPreviewHeader';
import { WebWalletTransactionOverlay } from './WebWalletTransactionOverlay';

const SOLANA_NETWORK_MESSAGE =
  "We haven't implemented safety checks for Solana yet. Proceed at your own risk.";

export function WalletActionSolanaSendTransaction({
  connectionContext,
  request,
  previewRequestId,
}: {
  connectionContext: ConnectionContext;
  request:
    | SolanaSignAndSendTransactionPreviewRequest
    | SolanaSignTransactionPreviewRequest<SolanaCombinedTransaction>;
  previewRequestId: string;
}) {
  const { approve, reject } = request;
  const { transaction } = request.params;

  const encodedTransaction = React.useMemo(
    () => serializeSolanaTransaction(transaction),
    [transaction],
  );

  const action: ApiSolSendTransactionRequest | undefined = React.useMemo(() => {
    if (request.method === 'signAndSendTransaction') {
      return {
        method: 'sol_signAndSendTransaction',
        params: {
          transactions: [encodedTransaction],
        },
      };
    } else if (request.method === 'signTransaction') {
      return {
        method: 'sol_signAllTransactions',
        params: {
          transactions: [encodedTransaction],
        },
      };
    }
    return undefined;
  }, [request, encodedTransaction]);

  const { data: solScanActionData, isLoading: solScanActionLoading } =
    useSolScanAction({
      account: request.solanaAddress,
      action,
      domain: connectionContext.domain,
      enabled: !!action,
    });

  const scanResultsReported = React.useRef(false);
  const { scanResultsMap } = useEmbeddedWallet();
  React.useEffect(() => {
    if (solScanActionData && !scanResultsReported.current && action) {
      scanResultsMap.set(transaction, {
        scanResponse: solScanActionData,
        action,
      });
      scanResultsReported.current = true;
    }
  }, [solScanActionData, action, scanResultsMap, transaction]);

  const t = useTheme();
  const { trackEvent } = useSharedTelemetry();
  // No-ops unless this transaction traces back to a wallet-links card
  // (NEYN-12452).
  const walletLinkTx = useWalletLinkTransactionTracker({
    connectionContext,
    method: request.method,
    protocol: 'solana',
    transactionId: previewRequestId,
  });
  const toast = useRootToast();
  const modalRef = React.useRef<{ dismiss: () => void }>(null);
  const [status, setStatus] = React.useState<
    'pending' | 'approved' | 'rejected'
  >('pending');
  // Synchronous sentinel so the tx resolves at most once. `status` flushes
  // async, so a stale dismiss can't reject after confirm. Mirrors EVM.
  const resolvedRef = React.useRef(false);

  // Track analytics when request is shown
  React.useEffect(() => {
    trackEvent(AnalyticsEvent.RequestWalletRpc, {
      method: request.method,
      protocol: 'solana',
      domain: connectionContext.domain,
      platform: Platform.OS,
    });
    walletLinkTx.trackRequested();
  }, [trackEvent, request.method, connectionContext.domain, walletLinkTx]);

  // clearPreviewRequests unmounts this preview without the dismiss/cancel
  // handlers; emit the rejected terminal on unmount if the flow never resolved.
  const walletLinkTxRef = React.useRef(walletLinkTx);
  React.useEffect(() => {
    walletLinkTxRef.current = walletLinkTx;
  }, [walletLinkTx]);
  React.useEffect(
    () => () => {
      if (!resolvedRef.current) {
        // Claim the resolution so a dismiss firing during teardown can't emit
        // a second rejected for this request.
        resolvedRef.current = true;
        walletLinkTxRef.current.trackRejected();
      }
    },
    [],
  );

  const onDismiss = React.useCallback(() => {
    if (!resolvedRef.current && status === 'pending') {
      resolvedRef.current = true;
      trackEvent(AnalyticsEvent.RejectWalletRpc, {
        method: request.method,
        protocol: 'solana',
        domain: connectionContext.domain,
        platform: Platform.OS,
      });
      walletLinkTx.trackRejected();
      reject();
      setStatus('rejected');
    }
  }, [
    status,
    reject,
    trackEvent,
    request.method,
    connectionContext.domain,
    walletLinkTx,
  ]);

  const onCancelTransaction = React.useCallback(() => {
    if (!resolvedRef.current && status === 'pending') {
      resolvedRef.current = true;
      trackEvent(AnalyticsEvent.RejectWalletRpc, {
        method: request.method,
        protocol: 'solana',
        domain: connectionContext.domain,
        platform: Platform.OS,
      });
      walletLinkTx.trackRejected();
      reject();
      setStatus('rejected');
      modalRef.current?.dismiss();
    }
  }, [
    status,
    reject,
    trackEvent,
    request.method,
    connectionContext.domain,
    walletLinkTx,
  ]);

  const refreshWallet = useWalletRefresh();
  const onConfirmTransaction = React.useCallback(async () => {
    if (resolvedRef.current || status !== 'pending') {
      return;
    }
    // Claim the resolution synchronously *before* dismissing so a stale
    // onDismiss can't reject the transaction we're about to approve.
    resolvedRef.current = true;
    setStatus('approved');
    modalRef.current?.dismiss();

    walletLinkTx.trackConfirmed();
    try {
      await approve();
    } catch (error) {
      walletLinkTx.trackFailed();
      throw error;
    }
    trackEvent(AnalyticsEvent.ConfirmWalletRpc, {
      method: request.method,
      protocol: 'solana',
      domain: connectionContext.domain,
      platform: Platform.OS,
    });
    // approve() resolves once the Solana transaction is confirmed — the
    // funnel's success terminal.
    walletLinkTx.trackSucceeded();

    if (request.method !== 'signAndSendTransaction') {
      return;
    }

    const scanResults = scanResultsMap.get(transaction);
    if (!scanResults?.scanResponse?.stateChanges) {
      return;
    }

    const tokens = scanResults.scanResponse.stateChanges.map((c) => ({
      chain: c.assetMetadata.chain ?? 'solana',
      ca: c.assetMetadata.ca,
      decimals: c.assetMetadata.decimals,
    }));

    await sleep(3000);

    // Refresh balances after successful transaction
    await refreshWallet(tokens);
  }, [
    status,
    approve,
    request.method,
    scanResultsMap,
    transaction,
    refreshWallet,
    trackEvent,
    connectionContext.domain,
    walletLinkTx,
  ]);

  const onTimeout = React.useCallback(() => {
    toast.show('Transaction expired. Please try again.', {
      type: 'generic',
    });
  }, [toast]);

  const { approveFn } = useExpiringApproval({
    approveFn: onConfirmTransaction,
    rejectFn: onCancelTransaction,
    timeoutMs: TRANSACTION_TTL_MS,
    onTimeout,
  });

  const {
    estimatedFee,
    estimatedFeeUsd,
    isLoading: feeEstimateLoading,
  } = useSolanaFeeEstimate({ transaction });

  const { data: solanaBalanceData, isLoading: solanaBalanceLoading } =
    useSolanaBalance({
      address: request.solanaAddress,
    });
  const solanaBalance = solanaBalanceData?.value;

  const hasEnoughFees =
    request.method === 'signAndSendTransaction'
      ? estimatedFee && solanaBalance && estimatedFee <= solanaBalance
      : true;

  const screenCommonProps = {
    onCancel: onCancelTransaction,
    isCancelling: status === 'rejected',
    isConfirming: status === 'approved',
  };

  const [ignoreValidation, setIgnoreValidation] = React.useState(false);

  const validationResult: ApiWalletActionValidationType | undefined =
    solScanActionData?.validation?.type;
  const isLoading =
    solanaBalanceLoading ||
    feeEstimateLoading ||
    solScanActionLoading ||
    !validationResult;
  let content;
  if (solScanActionData?.error) {
    content = (
      <ErrorDisplayScreen
        {...screenCommonProps}
        connectionContext={connectionContext}
        chain="solana"
        type={solScanActionData.error.type}
        message={solScanActionData.error.message}
      />
    );
  } else if (isLoading) {
    content = (
      <TransactionValidationLoadingScreen
        {...screenCommonProps}
        onConfirm={approveFn}
        disabled={status !== 'pending'}
      />
    );
  } else if (!hasEnoughFees) {
    content = (
      <ErrorDisplayScreen
        {...screenCommonProps}
        connectionContext={connectionContext}
        chain="solana"
        type="INSUFFICIENT_GAS"
        message="Not enough gas for this transaction."
        details={{
          address: request.solanaAddress,
          assetMetadata: {
            assetType: 'NATIVE',
            symbol: 'SOL',
            decimals: 9,
          },
        }}
      />
    );
  } else if (validationResult === 'BENIGN' || ignoreValidation === true) {
    const innerView =
      validationResult !== 'BENIGN' ? (
        <WarningScanSection2
          message={
            solScanActionData?.validation?.description ||
            VALIDATION_FAILURE_MESSAGE
          }
        />
      ) : undefined;
    content = (
      <VerifiedTransactionScreen
        {...screenCommonProps}
        onConfirm={approveFn}
        disabled={status !== 'pending'}
        request={request}
        chain="solana"
        innerView={innerView}
        estimatedFeeUsd={estimatedFeeUsd}
        data={solScanActionData}
      />
    );
  } else if (validationResult === 'WARNING') {
    content = (
      <VerifiedTransactionScreen
        {...screenCommonProps}
        onConfirm={approveFn}
        disabled={status !== 'pending'}
        request={request}
        chain="solana"
        innerView={
          <WarningScanSection2
            message={
              solScanActionData?.validation?.description ||
              VALIDATION_FAILURE_MESSAGE
            }
          />
        }
        estimatedFeeUsd={estimatedFeeUsd}
        data={solScanActionData}
      />
    );
  } else if (validationResult === 'MALICIOUS') {
    content = (
      <ValidationAssertionScreen
        {...screenCommonProps}
        onContinue={() => setIgnoreValidation(true)}
        onCancel={onCancelTransaction}
        innerView={
          <MaliciousScanSection
            message={
              solScanActionData?.validation?.description ||
              MALICIOUS_TRANSACTION_MESSAGE
            }
          />
        }
      />
    );
  } else {
    content = (
      <VerifiedTransactionScreen
        {...screenCommonProps}
        onConfirm={approveFn}
        disabled={status !== 'pending'}
        request={request}
        chain="solana"
        innerView={<WarningScanSection2 message={SOLANA_NETWORK_MESSAGE} />}
        estimatedFeeUsd={estimatedFeeUsd}
        data={solScanActionData}
      />
    );
  }

  const contentWithHeader = (
    <>
      <WalletActionPreviewHeader
        connectionContext={connectionContext}
        title="Confirm transaction"
      />
      <View style={[t.flex]}>{content}</View>
    </>
  );

  // Handle different UI surfaces (modal vs overlay)
  const { surface } = useWalletSurface();
  if (surface === 'mini_app_modal') {
    return (
      <WebWalletTransactionOverlay cancel={onDismiss}>
        {contentWithHeader}
      </WebWalletTransactionOverlay>
    );
  }

  return (
    <AutoDisplayingBottomSheetModal
      ref={modalRef}
      name="WalletActionSolanaSendTransaction"
      onDismiss={onDismiss}
      handleComponent={null}
      enableContentPanningGesture={Platform.OS !== 'web'}
      backgroundStyle={[
        t.borderHairline,
        t.borderDefault,
        t.bgDefault,
        { borderRadius: 24 },
      ]}
      animationConfigs={undefined}
    >
      {contentWithHeader}
    </AutoDisplayingBottomSheetModal>
  );
}
