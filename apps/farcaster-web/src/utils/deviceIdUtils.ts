import { v4 } from 'uuid';

const deviceIdStorageKey = 'device-id';

// Module cache so every caller sees the same id within a page load even when
// localStorage is unavailable (private mode / storage blocked).
let cachedDeviceId: string | undefined;

/**
 * Stable, per-browser device id sent to the backend as the FC-DEVICE-ID header
 * (via apiClient meta, and set explicitly on the session-recovery mint which
 * bypasses the apiClient). The backend's one-token-per-device dedup on
 * auth-tokens:{fid} keys on this header, so re-minting in this browser
 * replaces its previous session instead of accumulating. Without it every web
 * mint takes the server's noDeviceId path and piles up until the per-user cap
 * trims (evicting the user's oldest — often still-active — session).
 *
 * Deliberately NOT PostHog's $device_id: posthog.reset() on sign-out
 * regenerates that id (breaking the dedup across logout/login), and it is
 * unavailable before analytics init or when the user opts out. A dedicated
 * persisted UUID mirrors mobile's DeviceProvider.
 */
const getPersistedDeviceId = (): string => {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  try {
    const existing = window.localStorage.getItem(deviceIdStorageKey);
    if (existing) {
      cachedDeviceId = existing;
      return existing;
    }

    const created = v4();
    window.localStorage.setItem(deviceIdStorageKey, created);
    cachedDeviceId = created;
    return created;
  } catch {
    // localStorage unavailable — fall back to a per-page-load id so requests
    // still carry a header. Dedup then only spans this load, which degrades
    // gracefully to the pre-patch behavior.
    cachedDeviceId = v4();
    return cachedDeviceId;
  }
};

export { getPersistedDeviceId };
