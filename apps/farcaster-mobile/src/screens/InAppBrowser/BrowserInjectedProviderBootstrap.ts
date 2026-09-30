import { BrowserSession } from './BrowserTypes';

const FARCASTER_WALLET_ICON_DATA_URI =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2IiB2aWV3Qm94PSIwIDAgMjU2IDI1NiI+PHJlY3Qgd2lkdGg9IjI1NiIgaGVpZ2h0PSIyNTYiIHJ4PSI0OCIgZmlsbD0iIzg1NURDRCIvPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDQ4IDU4KSBzY2FsZSgyLjUpIj48cGF0aCBkPSJNNjQgMFY3LjU2MTY3SDU2LjQxMlYxNS4xMTY5SDU4LjczNjhWMTUuMTE5NUg2NFY1Nkg1MS4yODk4TDUxLjI4MjEgNTUuOTYyNkw0NC43OTY0IDI1LjM4MDVDNDQuMTc4MSAyMi40NjU0IDQyLjU1OTkgMTkuODI3NyA0MC4yNDAzIDE3Ljk1MTlDMzcuOTIwNyAxNi4wNzYxIDM0Ljk5ODcgMTUuMDQzNCAzMi4wMTMgMTUuMDQzNEgzMS45ODc2QzI5LjAwMTkgMTUuMDQzNCAyNi4wOCAxNi4wNzYxIDIzLjc2MDMgMTcuOTUxOUMyMS40NDA3IDE5LjgyNzcgMTkuODIyNSAyMi40NjYzIDE5LjIwNDIgMjUuMzgwNUwxMi43MTEyIDU2SDBWMTUuMTE4NUg1LjI2MzJWMTUuMTE2OUg3LjU4NzY2VjcuNTYxNjdIMFYwSDY0WiIgZmlsbD0id2hpdGUiLz48L2c+PC9zdmc+';

type BrowserProviderBootstrapArgs = {
  chainIdHex: string;
  injectWindowEthereum: boolean;
  session: BrowserSession;
  token: string;
};

export function createBrowserInjectedProviderBootstrap({
  chainIdHex,
  injectWindowEthereum,
  session,
  token,
}: BrowserProviderBootstrapArgs) {
  const bootstrapConfig = JSON.stringify({
    chainIdHex,
    injectWindowEthereum,
    injectEnabled: session.injectEnabled,
    origin: session.origin,
    icon: FARCASTER_WALLET_ICON_DATA_URI,
    token,
  });

  return `
  (function() {
    if (window !== window.top || window.location.protocol !== 'https:') {
      return;
    }
    if (window.__farcasterBrowserProviderInjected) {
      return;
    }
    window.__farcasterBrowserProviderInjected = true;

    const config = ${bootstrapConfig};
    if (!config.injectEnabled) {
      return;
    }

    // Bind the nonce into a closure-local so it never round-trips through
    // window. Cross-origin iframes that call ReactNativeWebView.postMessage
    // directly have no way to read this value.
    const bridgeToken = config.token;

    const listeners = new Map();
    const eventListeners = new Map();
    // The EIP-6963 info object is the canonical source of truth. We duplicate
    // its fields onto the provider itself so the (still-common) legacy pickers
    // that only inspect \`window.ethereum\` — Aerodrome's built-in list, older
    // wagmi/ethers injectors, a number of smaller dApps — have something to
    // read and label us correctly instead of falling back to "Browser Wallet".
    const providerInfo = {
      uuid: 'farcaster-mobile-browser-wallet',
      name: 'Farcaster Wallet',
      icon: config.icon,
      rdns: 'xyz.farcaster.mobile',
    };
    const provider = {
      isFarcaster: true,
      isMetaMask: false,
      name: providerInfo.name,
      providerInfo,
      info: providerInfo,
      request: ({ method, params }) => {
        return new Promise((resolve, reject) => {
          const id = String(Date.now()) + ':' + Math.random().toString(16).slice(2);
          listeners.set(id, { resolve, reject });
          window.ReactNativeWebView?.postMessage(
            JSON.stringify({
              channel: 'farcaster_browser_wallet',
              type: 'rpc_request',
              payload: {
                id,
                method,
                params,
                url: window.location.href,
                origin: window.location.origin,
                token: bridgeToken,
              },
            })
          );
        });
      },
      on: (eventName, callback) => {
        if (typeof eventName !== 'string' || typeof callback !== 'function') {
          return provider;
        }
        const existing = eventListeners.get(eventName);
        if (existing) {
          existing.push(callback);
        } else {
          eventListeners.set(eventName, [callback]);
        }
        return provider;
      },
      removeListener: (eventName, callback) => {
        if (typeof eventName !== 'string') {
          return provider;
        }
        const existing = eventListeners.get(eventName);
        if (!existing) {
          return provider;
        }
        const next = existing.filter((cb) => cb !== callback);
        if (next.length === 0) {
          eventListeners.delete(eventName);
        } else {
          eventListeners.set(eventName, next);
        }
        return provider;
      },
      _emit: ({ id, result, error }) => {
        const listener = listeners.get(id);
        if (!listener) return;
        listeners.delete(id);
        if (error) {
          listener.reject(Object.assign(new Error(error.message), error));
          return;
        }
        listener.resolve(result);
      },
      _rejectAll: (error) => {
        for (const [id, listener] of listeners.entries()) {
          listeners.delete(id);
          listener.reject(Object.assign(new Error(error.message), error));
        }
      },
      _dispatchEvent: (eventName, args) => {
        const callbacks = eventListeners.get(eventName);
        if (!callbacks) return;
        // Clone before iterating so a listener that calls removeListener
        // during dispatch doesn't skip siblings.
        const snapshot = callbacks.slice();
        for (const cb of snapshot) {
          try {
            cb(args);
          } catch {}
        }
      },
    };

    window.__farcasterBrowserWalletDeliverResponse = (rawPayload) => {
      try {
        const payload = JSON.parse(rawPayload);
        provider._emit(payload);
      } catch {}
    };

    window.__farcasterBrowserWalletRejectAllPendingRequests = (rawPayload) => {
      try {
        const payload = JSON.parse(rawPayload);
        provider._rejectAll(payload);
      } catch {}
    };

    window.__farcasterBrowserWalletEmitEvent = (rawPayload) => {
      try {
        const payload = JSON.parse(rawPayload);
        if (!payload || typeof payload.type !== 'string') return;
        provider._dispatchEvent(payload.type, payload.payload);
      } catch {}
    };

    const detail = Object.freeze({
      info: providerInfo,
      provider,
    });

    window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail }));
    window.addEventListener('eip6963:requestProvider', () => {
      window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail }));
    });

    if (config.injectWindowEthereum) {
      window.ethereum = provider;
    }

    // Fire EIP-1193 'connect' once so dApps that gate their init on it
    // (some older wagmi paths, a handful of bespoke dApps) proceed past
    // their "waiting for provider" state.
    provider._dispatchEvent('connect', { chainId: config.chainIdHex });

  })();
  true;
  `;
}
