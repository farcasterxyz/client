/**
 * Tracks sync-channel identifiers that have already been used to complete an
 * authentication / wallet hand-off on this device.
 *
 * `OnboardingSignInAnotherDevice` and `WalletSignInAnotherDevice` are
 * registered in BOTH the authed and unauthed navigators (see
 * `UnauthedStack.tsx` and `CommonScreens.tsx`) so that an unauthenticated user
 * who scans a QR can be shown an explanatory message. Because the route name
 * exists in both stacks, React Navigation can preserve a previously-completed
 * instance across an auth ↔ unauth transition, which surfaces as either:
 *   1. After logout: the screen re-mounts in the unauthed stack and shows the
 *      misleading "you need to sign in with this device" copy.
 *   2. After signing back in: the screen re-mounts in the authed stack with
 *      the same (now stale) `channelId` and re-runs the handshake, which
 *      either spins forever or now (with the handshake timeout) fails after
 *      ~3 minutes.
 *
 * Recording the `channelId` here on the success path lets the screen pop
 * itself the next time it is focused so neither stale UI is ever shown.
 *
 * Bounded via FIFO eviction (same pattern as
 * `directCastUrlEmbedHiddenStorage.ts`) so a long-lived session with many QR
 * attempts can't grow the cache without bound. The cap is intentionally well
 * above any realistic per-session usage.
 */
const MAX_CONSUMED_CHANNEL_IDS = 64;

const consumedChannelIds = new Set<string>();

const markSyncChannelIdConsumed = (channelId: string): void => {
  if (!channelId || consumedChannelIds.has(channelId)) {
    return;
  }

  if (consumedChannelIds.size >= MAX_CONSUMED_CHANNEL_IDS) {
    const oldest = consumedChannelIds.values().next().value;
    if (typeof oldest !== 'undefined') {
      consumedChannelIds.delete(oldest);
    }
  }

  consumedChannelIds.add(channelId);
};

const wasSyncChannelIdConsumed = (channelId: string): boolean =>
  Boolean(channelId) && consumedChannelIds.has(channelId);

export { markSyncChannelIdConsumed, wasSyncChannelIdConsumed };
