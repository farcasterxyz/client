import { AnalyticsEvent } from 'farcaster-analytics';
import * as React from 'react';
import { Platform } from 'react-native';

import { useSharedTelemetry } from '../../../../contexts';
import {
  ConnectionContext,
  SolanaSignMessagePreviewRequest,
} from '../../../../types';
import { WalletActionSign } from './WalletActionSign';

export function WalletActionSolanaSignMessage({
  connectionContext,
  request,
}: {
  connectionContext: ConnectionContext;
  request: SolanaSignMessagePreviewRequest;
}) {
  const { trackEvent } = useSharedTelemetry();

  // Track analytics when request is shown
  React.useEffect(() => {
    trackEvent(AnalyticsEvent.RequestWalletRpc, {
      method: request.method,
      protocol: 'solana',
      domain: connectionContext.domain,
      platform: Platform.OS,
    });
  }, [trackEvent, request.method, connectionContext.domain]);

  const handleApprove = React.useCallback(() => {
    trackEvent(AnalyticsEvent.ConfirmWalletRpc, {
      method: request.method,
      protocol: 'solana',
      domain: connectionContext.domain,
      platform: Platform.OS,
    });
    request.approve();
  }, [trackEvent, request, connectionContext.domain]);

  const handleReject = React.useCallback(() => {
    trackEvent(AnalyticsEvent.RejectWalletRpc, {
      method: request.method,
      protocol: 'solana',
      domain: connectionContext.domain,
      platform: Platform.OS,
    });
    request.reject();
  }, [trackEvent, request, connectionContext.domain]);

  return (
    <WalletActionSign
      connectionContext={connectionContext}
      approve={handleApprove}
      reject={handleReject}
      message={request.params.message}
    />
  );
}
