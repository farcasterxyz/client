import { useEffect } from 'react';

import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { installSnapWindowErrorListener } from '~/lib/snap/snapDataCloneTrap';

/**
 * Mounts once at app boot under `AnalyticsProvider`. Installs window-level
 * `error` + `unhandledrejection` listeners that emit
 * `AnalyticsEvent.ClientDataCloneError` (and the strict-subset
 * `SnapDataCloneError`) when the captured error matches the V8 structured-
 * clone deserialization symptom. NEYN-10935 — the original failure can
 * surface AFTER the snap renders, from an async path the synchronous
 * snap-renderer try/catch can't cover; this listener does.
 */
export function SnapWindowErrorListenerInstaller(): null {
  const { trackEvent } = useAnalytics();
  // Return the install fn's uninstaller as the effect's cleanup. Without
  // this, React strict mode's mount → unmount → remount cycle (and any
  // identity change to `trackEvent`) would leave a stale listener wired
  // up while the module-level guard inside `installSnapWindowErrorListener`
  // blocked re-installation, dropping every subsequent event.
  useEffect(() => {
    const uninstall = installSnapWindowErrorListener(trackEvent);
    return uninstall;
  }, [trackEvent]);
  return null;
}
