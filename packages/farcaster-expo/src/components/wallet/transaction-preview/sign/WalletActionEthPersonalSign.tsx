import { AnalyticsEvent } from 'farcaster-analytics';
import * as React from 'react';
import { Platform } from 'react-native';
import { hexToString } from 'viem';

import { useSharedTelemetry } from '../../../../contexts';
import { ConnectionContext, EvmPreviewRequest } from '../../../../types';
import { WalletActionSign } from './WalletActionSign';

export type WalletPendingRequest = EvmPreviewRequest<'personal_sign'>;

export function WalletActionEthPersonalSign({
  connectionContext,
  request,
}: {
  connectionContext: ConnectionContext;
  request: WalletPendingRequest;
}) {
  const { trackEvent } = useSharedTelemetry();

  // Track analytics when request is shown
  React.useEffect(() => {
    trackEvent(AnalyticsEvent.RequestWalletRpc, {
      method: request.request.method,
      protocol: 'ethereum',
      domain: connectionContext.domain,
      platform: Platform.OS,
    });
  }, [trackEvent, request.request.method, connectionContext.domain]);

  const handleApprove = React.useCallback(() => {
    trackEvent(AnalyticsEvent.ConfirmWalletRpc, {
      method: request.request.method,
      protocol: 'ethereum',
      domain: connectionContext.domain,
      platform: Platform.OS,
    });
    // approve() rejects through the outer preview Promise (consumed by
    // the dApp) when the underlying wallet provider throws. The dApp
    // sees the failure there; we explicitly swallow the resulting local
    // rejection so a fire-and-forget invocation cannot surface as an
    // unhandled promise rejection.
    request.approve().catch(() => {});
  }, [trackEvent, request, connectionContext.domain]);

  const handleReject = React.useCallback(() => {
    trackEvent(AnalyticsEvent.RejectWalletRpc, {
      method: request.request.method,
      protocol: 'ethereum',
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
      message={hexToString(request.request.params[0])}
    />
  );
}
