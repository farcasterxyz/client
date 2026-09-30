import { MILLIS_PER_DAY } from 'farcaster-client-hooks';
import { MMKV } from 'react-native-mmkv';

// Should not be used directly, use getStorage() instead.
let storage: MMKV | undefined;

export function getStorage() {
  if (!storage) {
    storage = new MMKV();
  }
  return storage;
}

function alreadyNudgedFramesHomeTab(): boolean {
  const alreadyNudgedStoredResult = getStorage().getBoolean(
    'already-nudged-frames-home-tab',
  );

  return (
    typeof alreadyNudgedStoredResult !== 'undefined' &&
    alreadyNudgedStoredResult
  );
}

function setFramesHomeTabNudged({ nudged }: { nudged: boolean }) {
  getStorage().set('already-nudged-frames-home-tab', nudged);
}

function alreadyNudgedWalletTab(): boolean {
  const alreadyNudgedStoredResult = getStorage().getBoolean(
    'already-nudged-wallet-tab',
  );

  return (
    typeof alreadyNudgedStoredResult !== 'undefined' &&
    alreadyNudgedStoredResult
  );
}

function setDismissedChannelUpdatesComposerNudge({
  dismissed,
}: {
  dismissed: boolean;
}) {
  getStorage().set('dismissed-channel-updates-composer-nudge', dismissed);
}

function dismissedChannelUpdatesComposerNudge(): boolean {
  const dismissedChannelUpdatesComposerNudge = getStorage().getBoolean(
    'dismissed-channel-updates-composer-nudge',
  );

  return (
    typeof dismissedChannelUpdatesComposerNudge !== 'undefined' &&
    dismissedChannelUpdatesComposerNudge
  );
}

function setDismissedFeedUpdatesDrawerNudge({
  dismissed,
}: {
  dismissed: boolean;
}) {
  getStorage().set('dismissed-feed-updates-drawer-nudge', dismissed);
}

function dismissedFeedUpdatesDrawerNudge(): boolean {
  const dismissed = getStorage().getBoolean(
    'dismissed-feed-updates-drawer-nudge',
  );

  return typeof dismissed !== 'undefined' && dismissed;
}

function setPromptedForPushes() {
  getStorage().set('prompt-for-pushes', Date.now());
}

function shouldPromptForPushes(): boolean {
  const promptForPushesTimestamp = getStorage().getNumber('prompt-for-pushes');

  return (
    typeof promptForPushesTimestamp === 'undefined' ||
    Date.now() - promptForPushesTimestamp > 30 * MILLIS_PER_DAY
  );
}

function setKeysAreFetched() {
  getStorage().set('fetched-keys', Date.now());
}

function shouldFetchKeys(): boolean {
  const shouldFetchKeysTimestamp = getStorage().getNumber('fetched-keys');

  return (
    typeof shouldFetchKeysTimestamp === 'undefined' ||
    Date.now() - shouldFetchKeysTimestamp > 30 * MILLIS_PER_DAY
  );
}

function setDeviceId({ deviceId }: { deviceId: string }) {
  getStorage().set('device-id', deviceId);
}

function getDeviceId() {
  return getStorage().getString('device-id');
}

function setDebugAppLoad({ enabled }: { enabled: boolean }) {
  getStorage().set('debug-app-load', enabled);
}

function debugAppLoadEnabled() {
  return (
    typeof getStorage().getBoolean('debug-app-load') !== 'undefined' &&
    getStorage().getBoolean('debug-app-load')
  );
}

function shouldBustFSCache(): boolean {
  const timestamp = getStorage().getNumber('should-bust-fs-cache');

  return (
    typeof timestamp === 'undefined' ||
    Date.now() - timestamp > 7 * MILLIS_PER_DAY
  );
}

function bustedFSCache() {
  getStorage().set('should-bust-fs-cache', Date.now());
}

function getAllImageLogs() {
  try {
    const raw = getStorage().getString('avatar_debug_urls');
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function setTrendingTokensViewed({ viewed = true }: { viewed?: boolean }) {
  getStorage().set('viewed-trending-tokens', viewed);
}

function shouldUpsellForPro(): boolean {
  const proUpsellDismissedTimestamp = getStorage().getNumber(
    'pro-upsell-dismissed',
  );

  return (
    typeof proUpsellDismissedTimestamp === 'undefined' ||
    Date.now() - proUpsellDismissedTimestamp > 30 * MILLIS_PER_DAY
  );
}

function setProUpsellDismissed() {
  getStorage().set('pro-upsell-dismissed', Date.now());
}

function isWalletLinksCollapsed(): boolean {
  const collapsed = getStorage().getBoolean('wallet-links-collapsed');
  return typeof collapsed !== 'undefined' && collapsed;
}

function setWalletLinksCollapsed({ collapsed }: { collapsed: boolean }) {
  getStorage().set('wallet-links-collapsed', collapsed);
}

function getSeenWalletLinkIds(): string[] {
  try {
    const raw = getStorage().getString('seen-wallet-link-ids');
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function setSeenWalletLinkIds({ ids }: { ids: string[] }) {
  getStorage().set('seen-wallet-link-ids', JSON.stringify(ids));
}

export {
  alreadyNudgedFramesHomeTab,
  alreadyNudgedWalletTab,
  bustedFSCache,
  debugAppLoadEnabled,
  dismissedChannelUpdatesComposerNudge,
  dismissedFeedUpdatesDrawerNudge,
  getAllImageLogs,
  getDeviceId,
  getSeenWalletLinkIds,
  isWalletLinksCollapsed,
  setDebugAppLoad,
  setDeviceId,
  setDismissedChannelUpdatesComposerNudge,
  setDismissedFeedUpdatesDrawerNudge,
  setFramesHomeTabNudged,
  setKeysAreFetched,
  setPromptedForPushes,
  setProUpsellDismissed,
  setSeenWalletLinkIds,
  setTrendingTokensViewed,
  setWalletLinksCollapsed,
  shouldBustFSCache,
  shouldFetchKeys,
  shouldPromptForPushes,
  shouldUpsellForPro,
};
