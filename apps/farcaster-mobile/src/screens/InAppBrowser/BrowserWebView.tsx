import * as Crypto from 'expo-crypto';
import React, { forwardRef, useEffect, useMemo, useState } from 'react';
import { Linking } from 'react-native';
import {
  WebView,
  WebViewMessageEvent,
  WebViewNavigation,
} from 'react-native-webview';

import { createBrowserInjectedProviderBootstrap } from './BrowserInjectedProviderBootstrap';
import { isBlockedBrowserUrl } from './BrowserOriginController';
import { BrowserProviderRequest, BrowserSession } from './BrowserTypes';
import {
  parseBrowserBridgeMessage,
  sendBrowserBridgeInvalidation,
  sendBrowserBridgeResponse,
} from './BrowserWalletBridge';

const LINK_ROUTES = [
  { key: 'twitter', hosts: ['twitter.com', 'x.com'], scheme: 'twitter' },
  { key: 'instagram', hosts: ['instagram.com'], scheme: 'instagram' },
  { key: 'facebook', hosts: ['facebook.com'], scheme: 'fb' },
  { key: 'whatsapp', hosts: ['whatsapp.com', 'wa.me'], scheme: 'whatsapp' },
  { key: 'tg', hosts: ['telegram.org', 't.me'], scheme: 'tg' },
  { key: 'barcelona', hosts: ['threads.net'], scheme: 'barcelona' },
  { key: 'bsky', hosts: ['bsky.app'], scheme: 'bsky' },
  { key: 'youtube', hosts: ['youtube.com', 'youtu.be'], scheme: 'youtube' },
  { key: 'tiktok', hosts: ['tiktok.com'], scheme: 'tiktok' },
  { key: 'reddit', hosts: ['reddit.com'], scheme: 'reddit' },
  { key: 'spotify', hosts: ['spotify.com'], scheme: 'spotify' },
  { key: 'discord', hosts: ['discord.com', 'discord.gg'], scheme: 'discord' },
  { key: 'linkedin', hosts: ['linkedin.com'], scheme: 'linkedin' },
  { key: 'pinterest', hosts: ['pinterest.com'], scheme: 'pinterest' },
  { key: 'snapchat', hosts: ['snapchat.com'], scheme: 'snapchat' },
  { key: 'twitch', hosts: ['twitch.tv'], scheme: 'twitch' },
  { key: 'soundcloud', hosts: ['soundcloud.com'], scheme: 'soundcloud' },
  { key: 'vimeo', hosts: ['vimeo.com'], scheme: 'vimeo' },
  { key: 'medium', hosts: ['medium.com'], scheme: 'medium' },
  { key: 'substack', hosts: ['substack.com'], scheme: 'substack' },
  { key: 'patreon', hosts: ['patreon.com'], scheme: 'patreon' },
  { key: 'music', hosts: ['music.apple.com'], scheme: 'music' },
  { key: 'behance', hosts: ['behance.net', 'behance.com'], scheme: 'behance' },
  { key: 'dribbble', hosts: ['dribbble.com'], scheme: 'dribbble' },
  { key: 'flickr', hosts: ['flickr.com'], scheme: 'flickr' },
  { key: 'tumblr', hosts: ['tumblr.com'], scheme: 'tumblr' },
  { key: 'kick', hosts: ['kick.com'], scheme: 'kick' },
  { key: 'letterboxd', hosts: ['letterboxd.com'], scheme: 'letterboxd' },
  { key: 'mixcloud', hosts: ['mixcloud.com'], scheme: 'mixcloud' },
  { key: 'bandcamp', hosts: ['bandcamp.com'], scheme: 'bandcamp' },
  { key: 'giphy', hosts: ['giphy.com'], scheme: 'giphy' },
  { key: 'imgur', hosts: ['imgur.com'], scheme: 'imgur' },
] as const;

type AppKey = (typeof LINK_ROUTES)[number]['key'];
type InstalledApps = { [K in AppKey]: boolean };

function hostnameMatchesRouteHost(hostname: string, routeHost: string) {
  return hostname === routeHost || hostname.endsWith(`.${routeHost}`);
}

type BrowserWebViewProps = {
  url: string;
  session: BrowserSession;
  chainIdHex: string;
  injectWindowEthereum: boolean;
  blockedDomains: Set<string>;
  allowExternalAppRedirect: boolean;
  onNavigationStateChange: (state: WebViewNavigation) => void;
  onBlockedNavigation?: (url: string) => void;
  onProviderRequest: (request: BrowserProviderRequest) => Promise<{
    id: string;
    result?: unknown;
    error?: { code: number; message: string };
  }>;
};

export const BrowserWebView = forwardRef<WebView, BrowserWebViewProps>(
  (
    {
      url,
      session,
      chainIdHex,
      injectWindowEthereum,
      blockedDomains,
      allowExternalAppRedirect,
      onNavigationStateChange,
      onBlockedNavigation,
      onProviderRequest,
    },
    ref,
  ) => {
    const [installedApps, setInstalledApps] = useState<InstalledApps>(
      () =>
        Object.fromEntries(
          LINK_ROUTES.map((r) => [r.key, false]),
        ) as InstalledApps,
    );

    useEffect(() => {
      if (!allowExternalAppRedirect) {
        return;
      }

      const checkApps = async () => {
        const results = await Promise.all(
          LINK_ROUTES.map((r) =>
            Linking.canOpenURL(`${r.scheme}://`).catch(() => false),
          ),
        );
        setInstalledApps((prev) => {
          const next = { ...prev };
          LINK_ROUTES.forEach((r, i) => {
            next[r.key] = results[i];
          });
          return next;
        });
      };
      void checkApps();
    }, [allowExternalAppRedirect]);

    const customSchemePattern = useMemo(
      () =>
        new RegExp(`^(${LINK_ROUTES.map((r) => r.scheme).join('|')})://`, 'i'),
      [],
    );

    // Per-mount nonce bound into the bootstrap IIFE closure. The bridge
    // requires this token on every inbound envelope, so cross-origin
    // iframes (which can call ReactNativeWebView.postMessage but can't read
    // the top-frame closure) cannot forge requests claiming the top-frame
    // origin.
    const bridgeToken = useMemo(() => Crypto.randomUUID(), []);

    const injectedBootstrap = useMemo(
      () =>
        createBrowserInjectedProviderBootstrap({
          chainIdHex,
          injectWindowEthereum,
          session,
          token: bridgeToken,
        }),
      [chainIdHex, injectWindowEthereum, session, bridgeToken],
    );

    const handleMessage = async (event: WebViewMessageEvent) => {
      if (!session.origin) {
        return;
      }
      const request = parseBrowserBridgeMessage(
        event,
        session.origin,
        bridgeToken,
      );
      if (!request || !ref || typeof ref === 'function' || !ref.current) {
        return;
      }

      // Always send a response back to the WebView, even when the handler
      // throws. If we don't, the dApp's window.ethereum promise stays
      // unresolved and the page gets stuck on "pending approval"
      // (RainbowKit / wagmi / etc. all surface this message). This most
      // commonly happens when the user dismisses the native confirm sheet
      // without tapping Confirm/Cancel: the embedded wallet rejects, which
      // bubbles up as a thrown error rather than a { id, error } payload.
      let response: {
        id: string;
        result?: unknown;
        error?: { code: number; message: string };
      };
      try {
        response = await onProviderRequest(request);
      } catch (err) {
        const code = (err as { code?: number })?.code ?? 4001;
        const message = (err as Error)?.message ?? 'User rejected the request';
        response = { id: request.id, error: { code, message } };
      }
      sendBrowserBridgeResponse({
        webView: ref.current,
        origin: session.origin,
        response,
      });
    };

    const handleShouldStartLoadWithRequest = (request: WebViewNavigation) => {
      const isTopFrame = (
        request as WebViewNavigation & { isTopFrame?: boolean }
      ).isTopFrame;

      if (isTopFrame === false) {
        return true;
      }

      if (request.url === 'about:blank') {
        return true;
      }

      if (allowExternalAppRedirect && customSchemePattern.test(request.url)) {
        void Linking.canOpenURL(request.url)
          .then((canOpen) => {
            if (canOpen) {
              void Linking.openURL(request.url);
            }
          })
          .catch(() => {});
        return false;
      }

      if (!request.url.startsWith('https://')) {
        onBlockedNavigation?.(request.url);
        return false;
      }

      if (allowExternalAppRedirect) {
        try {
          const parsedUrl = new URL(request.url);
          const hostname = parsedUrl.hostname.toLowerCase();

          const entry = LINK_ROUTES.find((r) =>
            r.hosts.some((h) => hostnameMatchesRouteHost(hostname, h)),
          );
          if (entry && installedApps[entry.key]) {
            void Linking.openURL(request.url);
            return false;
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }

      if (isBlockedBrowserUrl({ url: request.url, blockedDomains })) {
        onBlockedNavigation?.(request.url);
        return false;
      }

      return true;
    };

    return (
      <WebView
        ref={ref}
        source={{ uri: url }}
        originWhitelist={[
          'https://*',
          'http://*',
          ...(allowExternalAppRedirect
            ? LINK_ROUTES.map((r) => `${r.scheme}://*`)
            : []),
        ]}
        injectedJavaScriptBeforeContentLoaded={injectedBootstrap}
        onMessage={handleMessage}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        onNavigationStateChange={onNavigationStateChange}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="never"
        allowsBackForwardNavigationGestures
        allowsInlineMediaPlayback={false}
        mediaPlaybackRequiresUserAction
        javaScriptCanOpenWindowsAutomatically={false}
        setSupportMultipleWindows={false}
        nestedScrollEnabled
        bounces={false}
        overScrollMode="never"
      />
    );
  },
);

export function invalidateBrowserWebViewRequests({
  webView,
  origin,
  message,
}: {
  webView: WebView | null;
  origin: string | undefined;
  message: string;
}) {
  if (!webView || !origin) {
    return;
  }
  sendBrowserBridgeInvalidation({
    webView,
    origin,
    message,
  });
}
