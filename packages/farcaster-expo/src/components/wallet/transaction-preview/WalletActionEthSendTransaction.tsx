import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiChainId, chainIdToChainOrThrow } from 'farcaster-client-data';
import { sleep } from 'farcaster-client-hooks';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  useWalletLinkTransactionTracker,
  useWalletRefresh,
} from '../../../hooks';
import { ConnectionContext, EvmPreviewRequest } from '../../../types';
import { AutoDisplayingBottomSheetModal } from '../../bottom-sheet';
import { PreviewEthSendTransactionRouter } from './PreviewEthSendTransactionRouter';
import { WalletActionPreviewHeader } from './WalletActionPreviewHeader';
import { WebWalletTransactionOverlay } from './WebWalletTransactionOverlay';

type WalletTransactionRequest = EvmPreviewRequest<
  | 'eth_sendTransaction'
  | 'eth_signTypedData_v4'
  | 'personal_sign'
  | 'wallet_sendCalls'
>;

export const TRANSACTION_TTL_MS = 90_000; // 1.5 minutes

/**
 * Parent component that handles the modal/overlay display and transaction confirmation/rejection
 */
export function WalletActionEthSendTransaction({
  connectionContext,
  request,
  blockNumber,
  previewRequestId,
}: {
  connectionContext: ConnectionContext;
  request: WalletTransactionRequest;
  blockNumber?: number;
  previewRequestId: string;
}) {
  const modalRef = useRef<{ dismiss: () => void }>(null);
  const [transactionSubmitted, setTransactionSubmitted] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const refreshWallet = useWalletRefresh();
  const [chainId, setChainId] = useState<ApiChainId | undefined>(undefined);
  const { trackEvent } = useSharedTelemetry();
  const toast = useRootToast();
  // No-ops unless this transaction traces back to a wallet-links card
  // (NEYN-12452).
  const walletLinkTx = useWalletLinkTransactionTracker({
    connectionContext,
    method: request.request.method,
    protocol: 'ethereum',
    transactionId: previewRequestId,
  });

  // Synchronous sentinels guaranteeing request.approve / request.reject fire
  // at most once. React state (isConfirming / isCancelling /
  // transactionSubmitted) flushes asynchronously, and bottom-sheet callbacks
  // can observe stale render state during programmatic dismissal.
  const resolvedRef = useRef(false);
  const approvalInFlightRef = useRef(false);

  const t = useTheme();

  // Track analytics when request is shown
  useEffect(() => {
    trackEvent(AnalyticsEvent.RequestWalletRpc, {
      method: request.request.method,
      protocol: 'ethereum',
      domain: connectionContext.domain,
      platform: Platform.OS,
    });
    walletLinkTx.trackRequested();
  }, [
    trackEvent,
    request.request.method,
    connectionContext.domain,
    walletLinkTx,
  ]);

  // clearPreviewRequests unmounts this preview without the cancel/dismiss
  // handlers; emit the rejected terminal on unmount if the flow never resolved.
  const walletLinkTxRef = useRef(walletLinkTx);
  useEffect(() => {
    walletLinkTxRef.current = walletLinkTx;
  }, [walletLinkTx]);
  useEffect(
    () => () => {
      if (!resolvedRef.current && !approvalInFlightRef.current) {
        // Claim the resolution so a modal onDismiss firing during teardown
        // (enableDismissOnClose) can't emit a second rejected for this request.
        resolvedRef.current = true;
        walletLinkTxRef.current.trackRejected();
      }
    },
    [],
  );

  // Handle cancellation of transaction
  const handleCancel = useCallback(() => {
    // approvalInFlightRef guards the window where approve() is awaiting but
    // resolvedRef is not yet set: a TTL timeout (rejectFn) or stale cancel here
    // must not emit `rejected` and then let approve() emit `succeeded`/`failed`,
    // double-terminating the funnel. Mirrors onConfirm/onDismiss (NEYN-12452).
    if (resolvedRef.current || approvalInFlightRef.current) {
      modalRef.current?.dismiss();
      return;
    }
    resolvedRef.current = true;
    setIsCancelling(true);

    trackEvent(AnalyticsEvent.RejectWalletRpc, {
      method: request.request.method,
      protocol: 'ethereum',
      domain: connectionContext.domain,
      platform: Platform.OS,
    });
    walletLinkTx.trackRejected();

    request.reject();
    modalRef.current?.dismiss();
  }, [request, trackEvent, connectionContext.domain, walletLinkTx]);

  // Handle confirmation of transaction
  const { scanResultsMap } = useEmbeddedWallet();
  const onConfirm = useCallback(async () => {
    if (
      isConfirming ||
      transactionSubmitted ||
      !chainId ||
      resolvedRef.current ||
      approvalInFlightRef.current
    ) {
      return;
    }

    approvalInFlightRef.current = true;
    setIsConfirming(true);
    setTransactionSubmitted(true);

    // approve() resolving already emits the success terminal, so a later throw
    // from post-broadcast cleanup must not also emit the failure terminal.
    let broadcasted = false;
    try {
      trackEvent(AnalyticsEvent.ConfirmWalletRpc, {
        method: request.request.method,
        protocol: 'ethereum',
        domain: connectionContext.domain,
        platform: Platform.OS,
      });
      walletLinkTx.trackConfirmed();

      await request.approve();
      // Mark resolved immediately on success so any subsequent dismiss
      // (manual or via the auto-dismiss effect) cannot double-resolve.
      resolvedRef.current = true;
      broadcasted = true;
      // approve() resolves once the transaction is broadcast (and, for the
      // legacy path, its receipt awaited) — the funnel's success terminal.
      walletLinkTx.trackSucceeded();

      const requestFingerprint = JSON.stringify(request.request);
      const scanResults = scanResultsMap.get(requestFingerprint);
      if (!scanResults?.scanResponse?.stateChanges || !chainId) {
        return;
      }

      const tokens = scanResults.scanResponse.stateChanges.map((c) => ({
        chain:
          c.assetMetadata.chain ?? chainIdToChainOrThrow(chainId.toString()),
        ca: c.assetMetadata.ca,
        decimals: c.assetMetadata.decimals,
      }));

      await sleep(3000);

      // Refresh balances after successful transaction
      await refreshWallet(tokens);
    } catch (error) {
      resolvedRef.current = true;
      // Handle approval failure without console.error
      trackEvent(AnalyticsEvent.ErrorWalletRpc, {
        method: request.request.method,
        protocol: 'ethereum',
        domain: connectionContext.domain,
        platform: Platform.OS,
      });
      if (!broadcasted) {
        walletLinkTx.trackFailed();
      }
      setIsConfirming(false);
      setTransactionSubmitted(false);
      modalRef.current?.dismiss();
    } finally {
      approvalInFlightRef.current = false;
    }
  }, [
    isConfirming,
    request,
    transactionSubmitted,
    refreshWallet,
    scanResultsMap,
    chainId,
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
    approveFn: onConfirm,
    rejectFn: handleCancel,
    timeoutMs: TRANSACTION_TTL_MS,
    onTimeout,
  });

  // Auto-dismiss the modal when the transaction is submitted
  useEffect(() => {
    if (transactionSubmitted || (isCancelling && !isConfirming)) {
      modalRef.current?.dismiss();
    }
  }, [transactionSubmitted, isCancelling, isConfirming]);

  // Prepare the content with the router
  const content = (
    <>
      <WalletActionPreviewHeader
        connectionContext={connectionContext}
        title="Confirm transaction"
      />
      <View style={[t.flex1]}>
        <PreviewEthSendTransactionRouter
          connectionContext={connectionContext}
          request={request}
          blockNumber={blockNumber}
          onConfirmTransaction={approveFn}
          onCancelTransaction={handleCancel}
          isTopLevelConfirming={isConfirming}
          isTopLevelCancelling={isCancelling}
          setTopLevelChainId={setChainId}
          setTransactionSubmitted={setTransactionSubmitted}
        />
      </View>
    </>
  );

  const onDismiss = React.useCallback(() => {
    // Swipe-to-dismiss / programmatic dismiss fallback. Two layered gates:
    //   1. resolvedRef — synchronous; flipped by cancel and by approve
    //      success or failure. Prevents the React-state race that previously
    //      let this callback reject a second time after handleCancel already did.
    //   2. approvalInFlightRef / isConfirming / transactionSubmitted — the auto-dismiss useEffect
    //      tears the sheet down as soon as transactionSubmitted flips true
    //      (set optimistically before `await request.approve()`), so
    //      onDismiss can legitimately fire while approve is still pending. The
    //      ref covers stale callbacks that do not see the latest React state.
    if (
      resolvedRef.current ||
      approvalInFlightRef.current ||
      isConfirming ||
      transactionSubmitted
    ) {
      return;
    }
    resolvedRef.current = true;
    trackEvent(AnalyticsEvent.RejectWalletRpc, {
      method: request.request.method,
      protocol: 'ethereum',
      domain: connectionContext.domain,
      platform: Platform.OS,
    });
    walletLinkTx.trackRejected();
    request.reject();
  }, [
    isConfirming,
    transactionSubmitted,
    trackEvent,
    request,
    connectionContext.domain,
    walletLinkTx,
  ]);

  // Handle different UI surfaces (modal vs overlay)
  const { surface } = useWalletSurface();
  if (surface === 'mini_app_modal') {
    return (
      <WebWalletTransactionOverlay cancel={onDismiss}>
        {content}
      </WebWalletTransactionOverlay>
    );
  }

  return (
    <AutoDisplayingBottomSheetModal
      ref={modalRef}
      name="PreviewEthSendTransaction"
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
      {content}
    </AutoDisplayingBottomSheetModal>
  );
}
