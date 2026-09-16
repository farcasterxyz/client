import { Hex } from 'viem';

import { trackError } from '~/utils/ErrorUtils';
import { getStorage } from '~/utils/FastStorageUtils';

import { BrowserPermissionRecord } from './BrowserTypes';

const BROWSER_PERMISSION_STORAGE_KEY = 'browser_permissions.v1';

type BrowserPermissionMap = Record<string, BrowserPermissionRecord>;

function readAllPermissions(): BrowserPermissionMap {
  try {
    const raw = getStorage().getString(BROWSER_PERMISSION_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    return JSON.parse(raw) as BrowserPermissionMap;
  } catch (err) {
    // A corrupted or unparseable blob silently drops every trusted
    // site — surface it so we can tell if this starts firing in prod.
    trackError(err, { source: 'BrowserPermissionStore.readAllPermissions' });
    return {};
  }
}

function writeAllPermissions(next: BrowserPermissionMap) {
  getStorage().set(BROWSER_PERMISSION_STORAGE_KEY, JSON.stringify(next));
}

export function getBrowserPermission(origin: string) {
  return readAllPermissions()[origin];
}

export function upsertBrowserPermission(
  origin: string,
  update: Partial<BrowserPermissionRecord>,
) {
  const current = readAllPermissions();
  const now = Date.now();
  const existing = current[origin];

  current[origin] = {
    origin,
    connectGranted: update.connectGranted ?? existing?.connectGranted ?? false,
    trusted: update.trusted ?? existing?.trusted ?? false,
    connectedAddress: ('connectedAddress' in update
      ? update.connectedAddress
      : existing?.connectedAddress) as Hex | undefined,
    grantedAt: update.grantedAt ?? existing?.grantedAt ?? now,
    lastUsedAt: update.lastUsedAt ?? now,
    revokedAt: update.revokedAt ?? existing?.revokedAt,
  };

  writeAllPermissions(current);
  return current[origin];
}

export function revokeBrowserPermission(origin: string) {
  return upsertBrowserPermission(origin, {
    connectGranted: false,
    trusted: false,
    connectedAddress: undefined,
    revokedAt: Date.now(),
    lastUsedAt: Date.now(),
  });
}

export function listBrowserPermissions(): BrowserPermissionRecord[] {
  return Object.values(readAllPermissions()).sort(
    (a, b) => (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0),
  );
}
