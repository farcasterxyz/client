import { DdRum, RumActionType } from '@datadog/mobile-react-native';

/**
 * Milestones in the mini-app launch waterfall, in order. Each is recorded as a
 * RUM custom action carrying `sinceLaunchMs` (elapsed since the user tapped to
 * launch), so a launch can be decomposed into phases:
 *
 *   tap ─▶ content_mounted ─▶ webview_load_start ─▶ webview_load_end ─▶ ready
 *
 * Phase durations are the successive differences of `sinceLaunchMs`:
 *   - content_mounted:    manifest fetch + bottom-sheet sleep + Suspense
 *   - webview_load_start: RN → WebView handoff
 *   - webview_load_end:   mini-app HTML loaded + parsed
 *   - ready:              mini-app SDK signalled interactive
 *
 * `webview_load_error` is the terminal-failure branch off the happy path: the
 * WebView fires `onError` (not `onLoadEnd`) when the document load fails, so a
 * failed launch emits `webview_load_error` instead of `webview_load_end`/`ready`.
 * Without it, failed launches would silently drop out of the `webview_load_end`
 * aggregation and bias the phase percentiles toward successful loads.
 *
 * The launch-tap timestamp originates in `useLaunchFrame` (`launchConfig.timestamp`)
 * and is threaded down as the `timestamp` prop, so every milestone shares one t0.
 *
 * Each action also carries a `domain`. All milestones for a single launch are
 * expected to report the SAME canonical (www-stripped) domain so they aggregate
 * under one value in RUM — pass the normalized `formDomain`, never the raw URL
 * hostname or the manifest `appDomain`, which can diverge by a `www.` prefix and
 * split one launch across two domain buckets.
 *
 * Recorded via `addAction` (not a manual RUM view, which would conflict with the
 * navigation-based view tracking) — we carry the elapsed time ourselves rather
 * than relying on RUM's action loading_time.
 */
export type MiniAppLaunchMilestone =
  | 'content_mounted'
  | 'webview_load_start'
  | 'webview_load_end'
  | 'webview_load_error'
  | 'ready';

export const MINI_APP_LAUNCH_ACTION = 'miniapp_launch';

/**
 * Dev-only console trace of the launch waterfall. Prints `[miniapp-launch]
 * +<elapsed>ms <phase> (<domain>)` so a local repro in the simulator shows,
 * in Metro's console, exactly how long each phase took since the tap (t0 =
 * `launchConfig.timestamp`). Compiled out of release builds via `__DEV__`.
 *
 * Covers both the RUM milestones (wired through `recordMiniAppLaunchMilestone`)
 * and the pre-`content_mounted` phases that RUM doesn't track (bottom-sheet
 * mount, sleep(150), bar reveal, sheet settle), so the whole tap→ready timeline
 * is visible in one stream.
 */
export function logMiniAppLaunchPhase({
  phase,
  launchTimestamp,
  domain,
}: {
  phase: string;
  launchTimestamp: number;
  domain?: string;
}): void {
  if (!__DEV__) {
    return;
  }
  const elapsedMs = Date.now() - launchTimestamp;
  // eslint-disable-next-line no-console
  console.log(
    `[miniapp-launch] +${String(elapsedMs).padStart(5)}ms ${phase}` +
      (domain ? ` (${domain})` : ''),
  );
}

export function recordMiniAppLaunchMilestone({
  milestone,
  launchTimestamp,
  domain,
}: {
  milestone: MiniAppLaunchMilestone;
  launchTimestamp: number;
  domain: string;
}): void {
  logMiniAppLaunchPhase({ phase: milestone, launchTimestamp, domain });
  DdRum.addAction(RumActionType.CUSTOM, MINI_APP_LAUNCH_ACTION, {
    milestone,
    domain,
    sinceLaunchMs: Date.now() - launchTimestamp,
  });
}

/**
 * Per-launch dedup state: which milestones have already fired for the current
 * launch `timestamp`. Mini-app components are reused (not remounted) across a
 * same-domain relaunch, so this guard must re-arm when the launch changes.
 */
export type LaunchMilestoneGuard = {
  timestamp: number | undefined;
  fired: Set<MiniAppLaunchMilestone>;
};

export function createLaunchMilestoneGuard(): LaunchMilestoneGuard {
  return { timestamp: undefined, fired: new Set() };
}

/**
 * Returns true exactly once per (launch `timestamp`, `milestone`), mutating
 * `guard` to record the fire. A new `timestamp` (relaunch) re-arms every
 * milestone. Keeps the "fire once per launch" invariant out of the call sites
 * and unit-testable in isolation.
 */
export function shouldFireLaunchMilestone(
  guard: LaunchMilestoneGuard,
  timestamp: number,
  milestone: MiniAppLaunchMilestone,
): boolean {
  if (guard.timestamp !== timestamp) {
    guard.timestamp = timestamp;
    guard.fired = new Set();
  }
  if (guard.fired.has(milestone)) {
    return false;
  }
  guard.fired.add(milestone);
  return true;
}
