import { WebViewMessageEvent } from 'react-native-webview';

import {
  BrowserProviderEvent,
  BrowserProviderRequest,
  BrowserProviderResponse,
} from './BrowserTypes';

function normalizeOriginFromUrl(url: string): string | undefined {
  try {
    return new URL(url).origin.toLowerCase();
  } catch {
    return undefined;
  }
}

type WebViewLike = {
  injectJavaScript: (script: string) => void;
};

// Wire-level payload: BrowserProviderRequest plus the per-mount nonce token
// the bootstrap includes on every outbound message. Validated and stripped
// by parseBrowserBridgeMessage so the token never leaks to request handlers.
type BrowserBridgeRequestPayload = BrowserProviderRequest & { token?: string };

type BrowserBridgeEnvelope =
  | {
      channel: 'farcaster_browser_wallet';
      type: 'rpc_request';
      payload: BrowserBridgeRequestPayload;
    }
  | {
      channel: 'farcaster_browser_wallet';
      type: 'rpc_response';
      payload: BrowserProviderResponse;
    }
  | {
      channel: 'farcaster_browser_wallet';
      type: 'event';
      payload: BrowserProviderEvent;
    };

export function parseBrowserBridgeMessage(
  event: WebViewMessageEvent,
  expectedOrigin: string,
  expectedToken: string,
): BrowserProviderRequest | undefined {
  try {
    const parsed = JSON.parse(event.nativeEvent.data) as BrowserBridgeEnvelope;
    if (
      parsed.channel !== 'farcaster_browser_wallet' ||
      parsed.type !== 'rpc_request'
    ) {
      return undefined;
    }

    const nativeUrlOrigin = normalizeOriginFromUrl(event.nativeEvent.url);
    if (
      !nativeUrlOrigin ||
      nativeUrlOrigin !== expectedOrigin ||
      typeof parsed.payload.id !== 'string' ||
      typeof parsed.payload.method !== 'string'
    ) {
      return undefined;
    }

    // Reject envelopes whose token doesn't match the per-mount nonce issued
    // to the bootstrap IIFE closure. Cross-origin iframes can call
    // window.ReactNativeWebView.postMessage directly, but can't read the
    // top-frame closure where the nonce lives, so they can't forge a valid
    // envelope even when guessing the top-frame origin.
    if (
      typeof parsed.payload.token !== 'string' ||
      parsed.payload.token !== expectedToken
    ) {
      return undefined;
    }

    if (
      parsed.payload.origin &&
      parsed.payload.origin.toLowerCase() !== nativeUrlOrigin
    ) {
      return undefined;
    }

    if (
      parsed.payload.url &&
      normalizeOriginFromUrl(parsed.payload.url) !== nativeUrlOrigin
    ) {
      return undefined;
    }

    const { token: _token, ...rest } = parsed.payload;
    return {
      ...rest,
      origin: nativeUrlOrigin,
      url: parsed.payload.url ?? event.nativeEvent.url,
    };
  } catch {
    return undefined;
  }
}

export function sendBrowserBridgeResponse({
  webView,
  origin,
  response,
}: {
  webView: WebViewLike;
  origin: string;
  response: BrowserProviderResponse;
}) {
  const serialized = JSON.stringify(response);
  webView.injectJavaScript(`
    if (location.origin === ${JSON.stringify(origin)}) {
      if (window.__farcasterBrowserWalletDeliverResponse) {
        window.__farcasterBrowserWalletDeliverResponse(${JSON.stringify(serialized)});
      }
    }
    true;
  `);
}

export function sendBrowserBridgeInvalidation({
  webView,
  origin,
  message,
}: {
  webView: WebViewLike;
  origin: string;
  message: string;
}) {
  // 4001 ("user rejected the request") reads as a soft cancel — most dApps
  // treat it as "try again". 4100 ("unauthorized") makes them trigger a
  // full reconnect flow, which is wrong for nav/close/timeout rejections.
  const serialized = JSON.stringify({
    code: 4001,
    message,
  });
  webView.injectJavaScript(`
    if (location.origin === ${JSON.stringify(origin)}) {
      if (window.__farcasterBrowserWalletRejectAllPendingRequests) {
        window.__farcasterBrowserWalletRejectAllPendingRequests(${JSON.stringify(serialized)});
      }
    }
    true;
  `);
}

export function sendBrowserBridgeEvent({
  webView,
  origin,
  event,
}: {
  webView: WebViewLike;
  origin: string;
  event: BrowserProviderEvent;
}) {
  const serialized = JSON.stringify(event);
  webView.injectJavaScript(`
    if (location.origin === ${JSON.stringify(origin)}) {
      if (window.__farcasterBrowserWalletEmitEvent) {
        window.__farcasterBrowserWalletEmitEvent(${JSON.stringify(serialized)});
      }
    }
    true;
  `);
}

export function dismissBrowserWalletOverlays({
  webView,
}: {
  webView: WebViewLike;
}) {
  webView.injectJavaScript(`
    (() => {
      try {
        const active = document.activeElement;
        if (active && typeof active.blur === 'function') {
          active.blur();
        }

        const escEventInit = {
          key: 'Escape',
          code: 'Escape',
          keyCode: 27,
          which: 27,
          bubbles: true,
        };

        window.dispatchEvent(new KeyboardEvent('keydown', escEventInit));
        document.dispatchEvent(new KeyboardEvent('keydown', escEventInit));
        window.dispatchEvent(new KeyboardEvent('keyup', escEventInit));
        document.dispatchEvent(new KeyboardEvent('keyup', escEventInit));
      } catch {}
    })();
    true;
  `);
}
