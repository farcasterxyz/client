import { setProUpsellDismissed, shouldUpsellForPro } from 'farcaster-expo';
import { MMKV } from 'react-native-mmkv';

// Hard-coding these instead of importing from package to keep this
// specific unit import free as much as possible.
const MILLIS_PER_SECOND = 1000;
const MILLIS_PER_MINUTE = 60 * MILLIS_PER_SECOND;
const MILLIS_PER_HOUR = 60 * MILLIS_PER_MINUTE;
const MILLIS_PER_DAY = 24 * MILLIS_PER_HOUR;

// Should not be used directly, use getStorage() instead.
let storage: MMKV | undefined;

export function getStorage() {
  if (!storage) {
    storage = new MMKV();
  }
  return storage;
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

function setWalletTabNudged({ nudged }: { nudged: boolean }) {
  getStorage().set('already-nudged-wallet-tab', nudged);
}

// Whether a sign-out could not confirm the mini app WebView wipe, so the next
// sign-in must be gated (see AuthTokenProvider's account-isolation gate). Kept
// in synchronous MMKV rather than async SecureStore for two reasons: it is read
// in the initial render (no cold-start window where the gate is briefly down),
// and it can be written ahead of sign-out teardown (no kill window between
// clearing the token and recording that the wipe still owes completion).
function getWebViewWipePending(): boolean {
  const stored = getStorage().getBoolean('webview-wipe-pending');
  return typeof stored !== 'undefined' && stored;
}

function setWebViewWipePending({ pending }: { pending: boolean }) {
  getStorage().set('webview-wipe-pending', pending);
}

function shouldNudgeExploreTab(): boolean {
  const shouldNudgeStoredResult = getStorage().getBoolean(
    'should-nudge-explore-tab-v2',
  );

  return (
    typeof shouldNudgeStoredResult !== 'undefined' && shouldNudgeStoredResult
  );
}

function setExploreTabShouldBeNudged({ nudged }: { nudged: boolean }) {
  getStorage().set('should-nudge-explore-tab-v2', nudged);
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

function setInlinePromptedForPushes() {
  getStorage().set('prompt-for-pushes-inline', Date.now());
}

function shouldInlinePromptForPushes(): boolean {
  const promptForPushesTimestamp = getStorage().getNumber(
    'prompt-for-pushes-inline',
  );

  return (
    typeof promptForPushesTimestamp === 'undefined' ||
    Date.now() - promptForPushesTimestamp > 15 * MILLIS_PER_DAY
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
  getStorage().set('debug-app-load-v2', enabled);
}

function debugAppLoadEnabled() {
  return (
    typeof getStorage().getBoolean('debug-app-load-v2') !== 'undefined' &&
    getStorage().getBoolean('debug-app-load-v2')
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

function shouldBustExpoImageCache(): boolean {
  const timestamp = getStorage().getNumber('should-bust-img-cache-v2');

  return (
    typeof timestamp === 'undefined' ||
    Date.now() - timestamp > 14 * MILLIS_PER_DAY
  );
}

function bustedExpoImageCache() {
  getStorage().set('should-bust-img-cache-v2', Date.now());
}

function getAllImageLogs() {
  try {
    const raw = getStorage().getString('avatar_debug_urls');
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function alreadyNudgedVerifications(): boolean {
  const alreadyNudgedStoredResult = getStorage().getBoolean(
    'already-nudged-verifications',
  );

  return (
    typeof alreadyNudgedStoredResult !== 'undefined' &&
    alreadyNudgedStoredResult
  );
}

function setVerificationsNudged({ nudged }: { nudged: boolean }) {
  getStorage().set('already-nudged-verifications', nudged);
}

function setMiniAppLastPressedTimestamp({
  miniAppId,
  timestamp,
}: {
  miniAppId: string;
  timestamp: number;
}) {
  getStorage().set(`miniapp:lastPressed:${miniAppId}`, timestamp);
}

function getMiniAppLastPressedTimestamp({
  miniAppId,
}: {
  miniAppId?: string;
}): number | undefined {
  if (!miniAppId) {
    return undefined;
  }
  return getStorage().getNumber(`miniapp:lastPressed:${miniAppId}`);
}

function shouldOpenAppOnExploreTab({ fid }: { fid: number }): boolean {
  const timestamp = getStorage().getNumber(`should-open-on-explore-tab:${fid}`);

  return typeof timestamp === 'undefined';
}

function openedExploreTab({ fid }: { fid: number }) {
  getStorage().set(`should-open-on-explore-tab:${fid}`, Date.now());
}

function getChartTypePreference() {
  return getStorage().getString('chart-type-preference');
}

function setChartTypePreference({
  chartType,
}: {
  chartType: 'line' | 'candlestick';
}) {
  getStorage().set('chart-type-preference', chartType);
}

function getCandlestickPeriodPreference() {
  return getStorage().getString('candlestick-period-preference');
}

function setCandlestickPeriodPreference({
  candlestickPeriod,
}: {
  candlestickPeriod: '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w';
}) {
  getStorage().set('candlestick-period-preference', candlestickPeriod);
}

export {
  alreadyNudgedVerifications,
  alreadyNudgedWalletTab,
  bustedExpoImageCache,
  bustedFSCache,
  debugAppLoadEnabled,
  dismissedChannelUpdatesComposerNudge,
  dismissedFeedUpdatesDrawerNudge,
  getAllImageLogs,
  getCandlestickPeriodPreference,
  getChartTypePreference,
  getDeviceId,
  getMiniAppLastPressedTimestamp,
  getWebViewWipePending,
  openedExploreTab,
  setCandlestickPeriodPreference,
  setChartTypePreference,
  setDebugAppLoad,
  setDeviceId,
  setDismissedChannelUpdatesComposerNudge,
  setDismissedFeedUpdatesDrawerNudge,
  setExploreTabShouldBeNudged,
  setInlinePromptedForPushes,
  setKeysAreFetched,
  setMiniAppLastPressedTimestamp,
  setPromptedForPushes,
  setProUpsellDismissed,
  setVerificationsNudged,
  setWalletTabNudged,
  setWebViewWipePending,
  shouldBustExpoImageCache,
  shouldBustFSCache,
  shouldFetchKeys,
  shouldInlinePromptForPushes,
  shouldNudgeExploreTab,
  shouldOpenAppOnExploreTab,
  shouldPromptForPushes,
  shouldUpsellForPro,
};
