import { AnalyticsEvent } from 'farcaster-analytics';
import { useCallback, useMemo } from 'react';
import { Platform } from 'react-native';

import { useSharedTelemetry } from '../contexts';
import { ConnectionContext } from '../types';

/**
 * Wallet-link -> transaction funnel tracking (NEYN-12452). No-ops unless
 * `connectionContext.walletLinkAttribution` is set; props mirror `click wallet
 * link` (id/name/url/index) plus method/protocol/domain/platform.
 */
export function useWalletLinkTransactionTracker({
  connectionContext,
  method,
  protocol,
  transactionId,
}: {
  connectionContext: ConnectionContext;
  method: string;
  protocol: 'ethereum' | 'solana';
  /**
   * Stable id for this preview/transaction attempt (the PreviewRequest id), so
   * PostHog can correlate the requested -> confirmed -> succeeded/rejected/
   * failed steps of a single attempt rather than relying on person-level order.
   */
  transactionId: string;
}) {
  const { trackEvent } = useSharedTelemetry();
  const attribution = connectionContext.walletLinkAttribution;

  const baseProps = useMemo(() => {
    if (!attribution) {
      return undefined;
    }
    return {
      id: attribution.id,
      name: attribution.name,
      url: attribution.url,
      ...(attribution.index !== undefined ? { index: attribution.index } : {}),
      method,
      protocol,
      domain: connectionContext.domain,
      platform: Platform.OS,
      transaction_id: transactionId,
    };
  }, [attribution, method, protocol, connectionContext.domain, transactionId]);

  const track = useCallback(
    (event: AnalyticsEvent) => {
      if (!baseProps) {
        return;
      }
      trackEvent(event, baseProps);
    },
    [baseProps, trackEvent],
  );

  return useMemo(
    () => ({
      /** Fired when a wallet-link-attributed transaction preview is shown. */
      trackRequested: () =>
        track(AnalyticsEvent.WalletLinkTransactionRequested),
      /** Fired when the user approves (before broadcast resolves). */
      trackConfirmed: () =>
        track(AnalyticsEvent.WalletLinkTransactionConfirmed),
      /** Fired once approve() resolves (broadcast / receipt success). */
      trackSucceeded: () =>
        track(AnalyticsEvent.WalletLinkTransactionSucceeded),
      /** Fired when the user rejects / cancels / dismisses the preview. */
      trackRejected: () => track(AnalyticsEvent.WalletLinkTransactionRejected),
      /** Fired when approve() throws. */
      trackFailed: () => track(AnalyticsEvent.WalletLinkTransactionFailed),
    }),
    [track],
  );
}
