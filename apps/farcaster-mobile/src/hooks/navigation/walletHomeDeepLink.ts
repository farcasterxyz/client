export type WalletHomeDeepLinkOptions = {
  limitOrderId?: string;
};

export type WalletHomeDeepLinkHandler = (
  options: WalletHomeDeepLinkOptions,
) => void;

let handler: WalletHomeDeepLinkHandler | null = null;
let deepLinkPending = false;

const MAX_DEEP_LINK_RETRIES = 30;

const registerWalletHomeDeepLinkHandler = (
  next: WalletHomeDeepLinkHandler | null,
) => {
  handler = next;
};

const markWalletOrdersDeepLinkPending = () => {
  deepLinkPending = true;
};

const clearWalletOrdersDeepLinkPending = () => {
  deepLinkPending = false;
};

const shouldSuppressWalletHomeFocusResync = () => deepLinkPending;

const triggerWalletHomeDeepLink = (
  options: WalletHomeDeepLinkOptions,
  retriesLeft = MAX_DEEP_LINK_RETRIES,
) => {
  if (handler) {
    handler(options);
    return;
  }

  if (retriesLeft > 0) {
    requestAnimationFrame(() =>
      triggerWalletHomeDeepLink(options, retriesLeft - 1),
    );
    return;
  }

  clearWalletOrdersDeepLinkPending();
};

export {
  clearWalletOrdersDeepLinkPending,
  markWalletOrdersDeepLinkPending,
  registerWalletHomeDeepLinkHandler,
  shouldSuppressWalletHomeFocusResync,
  triggerWalletHomeDeepLink,
};
