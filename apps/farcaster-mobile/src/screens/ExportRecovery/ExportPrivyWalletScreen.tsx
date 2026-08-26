import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  useEmbeddedWalletsQuery,
  useFetchWalletResource,
  useReportProfileActivity,
} from 'farcaster-client-hooks';
import { useCurrentUserFid } from 'farcaster-expo';
import React, { useEffect, useRef, useState } from 'react';
import { InteractionManager, View } from 'react-native';
import {
  WebView,
  WebViewMessageEvent,
  WebViewNavigation,
} from 'react-native-webview';
import { z } from 'zod';

import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useWallet } from '~/contexts/WalletProvider';
import { useSiwf } from '~/hooks/data/useSiwf';
import { usePop } from '~/hooks/navigation/usePop';
import { trackError } from '~/utils/ErrorUtils';

const RECOVERY_WEBAPP_URL = 'https://wallet-export.farcaster.xyz/';
const WEBVIEW_ORIGIN_WHITELIST = [
  'https://wallet-export.farcaster.xyz',
  'https://auth.privy.io',
];
const DOMAIN_WHITELIST = ['wallet-export.farcaster.xyz', 'auth.privy.io'];

// TEMP native-side tracing for the secondary-export hang. Redacted: never log
// shard/SIWE values; addresses truncated. Appears in Metro logs. Remove after.
const SEC_LOG = '[sec-export-native]';
const secLog = (msg: string) => {
  // eslint-disable-next-line no-console
  console.log(`${SEC_LOG} ${msg}`);
  // Mirror to RUM so a released (OTA) build surfaces this trace on real
  // devices. Query: @type:action @action.target.name:sec_export → @context.line
  try {
    DdRum.addAction(RumActionType.CUSTOM, 'sec_export', {
      line: msg.slice(0, 440),
    });
  } catch {
    // telemetry must never throw into the export flow
  }
};
const shortAddr = (a?: string | null) =>
  !a ? String(a) : a.length <= 12 ? a : `${a.slice(0, 6)}…${a.slice(-4)}`;
const presence = (v?: string | null) =>
  v === undefined || v === null ? String(v) : `present(len=${v.length})`;

const ExportRequestSchema = z.object({
  type: z.literal('requestExport'),
  nonce: z.string(),
  expiresAt: z.string(),
});

const RequestCloseRequestSchema = z.object({
  type: z.literal('requestClose'),
});

const RequestSecondaryExportSchema = z.object({
  type: z.literal('requestSecondaryExport'),
  address: z.string(),
  protocol: z.enum(['ethereum', 'solana']).optional(),
});

const ClientRequestSchema = z.discriminatedUnion('type', [
  ExportRequestSchema,
  RequestCloseRequestSchema,
  RequestSecondaryExportSchema,
]);
type ClientRequest = z.infer<typeof ClientRequestSchema>;

const WalletManifestEntrySchema = z.object({
  walletId: z.string(),
  address: z.string(),
  protocol: z.enum(['ethereum', 'solana']),
  displayName: z.string().optional(),
  isPrimary: z.boolean(),
  // Identifies which Privy app the wallet lives in. Tells the
  // export webapp which recovery shard + Privy session to use for export.
  privyAppNamespace: z.enum(['primary', 'secondary']).optional(),
});

const ExportResponseSchema = z.object({
  type: z.literal('exportResponse'),
  siwe: z.object({
    message: z.string(),
    signature: z.string(),
    fid: z.number(),
  }),
  recoveryShard: z.string(),
  secondaryRecoveryShard: z.string().optional(),
  address: z.string(),
  wallets: z.array(WalletManifestEntrySchema).optional(),
});

export function ExportPrivyWalletScreen() {
  const {
    mutate: reportProfileActivity,
    isSuccess,
    isPending,
    isIdle,
  } = useReportProfileActivity();
  const t = useTheme();
  const fetchWalletResource = useFetchWalletResource();
  const siwf = useSiwf();
  const { account: custodyWallet } = useWallet();
  const fid = useCurrentUserFid();
  const { data: embeddedWalletsData } = useEmbeddedWalletsQuery({
    params: { includePrivate: true },
    scopeKey: fid,
    enabled: !!fid,
  });
  const webViewRef = useRef<WebView>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [hasValidatedTrustedOrigin, setHasValidatedTrustedOrigin] =
    useState(false);
  const [secondaryOverlayUrl, setSecondaryOverlayUrl] = useState<string | null>(
    null,
  );
  const [secondaryValidatedOrigin, setSecondaryValidatedOrigin] =
    useState(false);
  const secondaryWebViewRef = useRef<WebView>(null);
  const pop = usePop();
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      DdRum.addViewLoadingTime(true);
    });
  }, []);

  useEffect(() => {
    if (isClosing) {
      pop();
    }
  }, [isClosing, pop]);

  useEffect(() => {
    if (trackEvent && isSuccess) {
      trackEvent(AnalyticsEvent.ShowPrivyWalletExport, {});
    }
  }, [isSuccess, trackEvent]);

  useEffect(() => {
    reportProfileActivity({ activityType: 'walletSeedExported' });
  }, [reportProfileActivity]);

  const onWebViewRequest = async (request: ClientRequest) => {
    secLog(`onWebViewRequest type=${request.type}`);
    if (request.type === 'requestClose') {
      secLog('requestClose → closing screen');
      setIsClosing(true);
      return;
    }

    if (request.type === 'requestSecondaryExport') {
      const protocolParam = request.protocol
        ? `&protocol=${request.protocol}`
        : '';
      const url = `${RECOVERY_WEBAPP_URL}?app=secondary&export=${encodeURIComponent(request.address)}${protocolParam}`;
      secLog(
        `requestSecondaryExport addr=${shortAddr(request.address)} protocol=${request.protocol ?? 'ethereum'} → opening secondary overlay WebView`,
      );
      setSecondaryOverlayUrl(url);
      setSecondaryValidatedOrigin(false);
      return;
    }

    if (request.type !== 'requestExport') {
      throw new Error('Invalid request type');
    }
    const { expiresAt, nonce } = request;
    const forSecondaryOverlay = !!secondaryOverlayUrl;
    secLog(
      `requestExport received (forSecondaryOverlay=${forSecondaryOverlay}) → fetching primary shard`,
    );

    trackEvent(AnalyticsEvent.ExportPrivyWallet, {});

    // Fetch primary recovery shard
    const resource = await fetchWalletResource(
      'warpcast_wallet_recovery_encryption_key',
    );

    if (!resource.resource.value) {
      secLog('ERROR: primary recovery shard missing');
      throw new Error('No recovery shard found');
    }
    secLog(`primary shard fetched: ${presence(resource.resource.value)}`);

    // Sign the SIWE message
    if (!custodyWallet) {
      secLog('ERROR: no custody wallet found');
      throw new Error('No custody wallet found');
    }

    const siwe = await siwf({
      nonce,
      expirationTime: new Date(expiresAt),
      uri: RECOVERY_WEBAPP_URL,
    });
    secLog(`SIWE signed (custody=${shortAddr(custodyWallet.address)})`);

    const wallets = embeddedWalletsData?.wallets.map((wallet) => ({
      walletId: wallet.id,
      address: wallet.address,
      protocol: wallet.protocol,
      displayName: wallet.displayName,
      isPrimary: wallet.isPrimary,
      privyAppNamespace: wallet.privyAppNamespace,
    }));

    secLog(
      `manifest: count=${wallets?.length ?? 0} entries=[${(wallets ?? [])
        .map(
          (w) =>
            `${w.protocol}:${shortAddr(w.address)}:${w.privyAppNamespace ?? 'primary'}`,
        )
        .join(', ')}]`,
    );

    // if a secondary-app wallet exists in the manifest, also
    // fetch its recovery shard. Webapp will use this to recover the
    // secondary Privy app's wallet and export its (distinct) mnemonic.
    const hasSecondaryWallet = wallets?.some(
      (w) => w.privyAppNamespace === 'secondary',
    );
    secLog(`hasSecondaryWallet=${!!hasSecondaryWallet}`);

    let secondaryRecoveryShard: string | undefined;
    if (hasSecondaryWallet) {
      try {
        const secondaryResource = await fetchWalletResource(
          'secondary_warpcast_wallet_recovery_encryption_key',
        );
        secondaryRecoveryShard = secondaryResource.resource.value ?? undefined;
        secLog(`secondary shard fetched: ${presence(secondaryRecoveryShard)}`);
      } catch (e) {
        secLog(`ERROR fetching secondary shard: ${(e as Error).message}`);
        trackError(e);
      }
    }

    const response = ExportResponseSchema.parse({
      type: 'exportResponse',
      siwe,
      recoveryShard: resource.resource.value,
      secondaryRecoveryShard,
      address: custodyWallet.address,
      wallets: wallets && wallets.length > 0 ? wallets : undefined,
    });

    const isSecondary = !!secondaryOverlayUrl;
    const targetRef = isSecondary ? secondaryWebViewRef : webViewRef;
    const payload = isSecondary ? { ...response, recoveryShard: '' } : response;
    secLog(
      `posting exportResponse → ${isSecondary ? 'SECONDARY overlay' : 'PRIMARY'} webview ` +
        `(recoveryShard=${presence(payload.recoveryShard)} secondaryRecoveryShard=${presence(payload.secondaryRecoveryShard)})`,
    );
    targetRef.current?.postMessage(JSON.stringify(payload));
    secLog('exportResponse posted');
  };

  const handleWebViewMessage = (event: WebViewMessageEvent) => {
    if (!hasValidatedTrustedOrigin) {
      return;
    }

    const originUrl = event.nativeEvent.url;
    try {
      const msgOrigin = new URL(originUrl).origin;
      const allowedOrigin = new URL(RECOVERY_WEBAPP_URL).origin;
      if (msgOrigin !== allowedOrigin) {
        trackError(
          new Error(
            '[ExportPrivyWalletScreen] received message from disallowed origin',
          ),
          { url: originUrl },
        );
        return;
      }
    } catch {
      return;
    }

    const data = JSON.parse(event.nativeEvent.data);
    const clientRequest = ClientRequestSchema.parse(data);
    secLog(`primary webview → message type=${clientRequest.type}`);
    onWebViewRequest(clientRequest);
  };

  const handleShouldStartLoadWithRequest = (request: WebViewNavigation) => {
    try {
      const url = request.url;
      const domain = new URL(url).hostname;
      // Allow requests only to recovery webapp + privy
      if (url === 'about:blank' || DOMAIN_WHITELIST.includes(domain)) {
        return true;
      }
      // Block navigation to disallowed domains
      trackError(
        new Error(
          '[ExportPrivyWalletScreen] blocked request to disallowed domain',
        ),
        { url },
      );
      return false;
    } catch (e) {
      trackError(e);
      return false;
    }
  };

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    const navUrl = navState.url;

    try {
      const parsed = new URL(navUrl);
      const allowed = new URL(RECOVERY_WEBAPP_URL);
      if (parsed.origin !== allowed.origin) {
        setIsClosing(true);
        alert('Navigation to external sites disallowed');
        setHasValidatedTrustedOrigin(false);
        return;
      }
    } catch {
      setIsClosing(true);
      setHasValidatedTrustedOrigin(false);
      return;
    }

    secLog('primary webview origin validated, ready to receive messages');
    setHasValidatedTrustedOrigin(true);
  };

  if (isPending || isIdle) {
    return <FullScreenLoadingIndicator />;
  }

  const handleSecondaryMessage = (event: WebViewMessageEvent) => {
    if (!secondaryValidatedOrigin) return;

    const originUrl = event.nativeEvent.url;
    try {
      if (new URL(originUrl).origin !== new URL(RECOVERY_WEBAPP_URL).origin)
        return;
    } catch {
      return;
    }

    const data = JSON.parse(event.nativeEvent.data);
    const clientRequest = ClientRequestSchema.parse(data);
    secLog(`secondary overlay → message type=${clientRequest.type}`);

    if (clientRequest.type === 'requestClose') {
      secLog('secondary overlay → requestClose, tearing down overlay');
      setSecondaryOverlayUrl(null);
      setSecondaryValidatedOrigin(false);
      return;
    }

    if (clientRequest.type === 'requestExport') {
      onWebViewRequest(clientRequest);
    }
  };

  const handleSecondaryNavStateChange = (navState: WebViewNavigation) => {
    try {
      if (
        new URL(navState.url).origin === new URL(RECOVERY_WEBAPP_URL).origin
      ) {
        secLog('secondary overlay origin validated, ready to receive messages');
        setSecondaryValidatedOrigin(true);
      }
    } catch {
      // ignore
    }
  };

  if (isSuccess) {
    return (
      <View>
        <View style={[t.flex, t.flexCol, t.hFull, t.wFull]}>
          <WebView
            ref={webViewRef}
            originWhitelist={WEBVIEW_ORIGIN_WHITELIST}
            source={{ uri: RECOVERY_WEBAPP_URL }}
            style={[t.flex1, t.hFull, t.wFull]}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
            onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
            onNavigationStateChange={handleNavigationStateChange}
            javaScriptCanOpenWindowsAutomatically={false} // Prevent opening new windows
            allowsInlineMediaPlayback={false} // Prevent inline media playback
            mediaPlaybackRequiresUserAction={true} // Require user action for media
            domStorageEnabled={true} // Needed for most web apps
            mixedContentMode="never" // Only allow HTTPS
            allowsBackForwardNavigationGestures={false} // Disable navigation gestures
            allowsLinkPreview={false} // Disable link previews
            textInteractionEnabled={true} // Enable text selection
            sharedCookiesEnabled={false} // Don't share cookies with system browser
            thirdPartyCookiesEnabled={false} // Disable third-party cookies
            cacheEnabled={false} // Disable caching
            // For iOS
            allowFileAccess={false}
            allowFileAccessFromFileURLs={false}
            allowUniversalAccessFromFileURLs={false}
            incognito={true}
          />
        </View>

        {secondaryOverlayUrl && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10,
            }}
          >
            <WebView
              ref={secondaryWebViewRef}
              originWhitelist={WEBVIEW_ORIGIN_WHITELIST}
              source={{ uri: secondaryOverlayUrl }}
              style={[t.flex1, t.hFull, t.wFull]}
              onMessage={handleSecondaryMessage}
              javaScriptEnabled={true}
              onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
              onNavigationStateChange={handleSecondaryNavStateChange}
              javaScriptCanOpenWindowsAutomatically={false}
              allowsInlineMediaPlayback={false}
              mediaPlaybackRequiresUserAction={true}
              domStorageEnabled={true}
              mixedContentMode="never"
              allowsBackForwardNavigationGestures={false}
              allowsLinkPreview={false}
              textInteractionEnabled={true}
              sharedCookiesEnabled={false}
              thirdPartyCookiesEnabled={true}
              cacheEnabled={false}
              allowFileAccess={false}
              allowFileAccessFromFileURLs={false}
              allowUniversalAccessFromFileURLs={false}
              incognito={true}
            />
          </View>
        )}
      </View>
    );
  }

  return null;
}
