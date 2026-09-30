/**
 * Local (device-side) blocklist for the in-app browser.
 *
 * Users can block any hostname from the share sheet. Blocked domains are
 * persisted in MMKV so they survive app restarts. The list is merged with the
 * server-side frame blocklist in InAppBrowserScreen before rendering.
 */

import { trackError } from '~/utils/ErrorUtils';
import { getStorage } from '~/utils/FastStorageUtils';

const STORAGE_KEY = 'browser_user_blocklist.v1';

function readBlockedDomains(): string[] {
  try {
    const raw = getStorage().getString(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return Array.from(
      new Set(
        parsed
          .filter((domain): domain is string => typeof domain === 'string')
          .map(normalizeHostname)
          .filter(Boolean),
      ),
    );
  } catch (err) {
    trackError(err, { source: 'BrowserUserBlocklistStore.readBlockedDomains' });
    return [];
  }
}

function writeBlockedDomains(domains: string[]) {
  getStorage().set(STORAGE_KEY, JSON.stringify(domains));
}

function normalizeHostname(hostname: string) {
  return hostname.trim().toLowerCase();
}

/** Returns all user-blocked hostnames. */
export function getUserBlockedDomains(): string[] {
  return readBlockedDomains();
}

/** Adds a hostname to the user blocklist. Idempotent. */
export function blockDomain(hostname: string) {
  const normalizedHostname = normalizeHostname(hostname);
  if (!normalizedHostname) {
    return;
  }
  const current = readBlockedDomains();
  if (!current.includes(normalizedHostname)) {
    writeBlockedDomains([...current, normalizedHostname]);
  }
}

/** Removes a hostname from the user blocklist. */
export function unblockDomain(hostname: string) {
  const blockedDomain = getUserBlockedDomainForHostname(hostname);
  if (!blockedDomain) {
    return;
  }
  const current = readBlockedDomains();
  writeBlockedDomains(current.filter((d) => d !== blockedDomain));
}

/** Returns the matching user-blocked domain for a hostname, including parent domain matches. */
export function getUserBlockedDomainForHostname(hostname: string) {
  const normalizedHostname = normalizeHostname(hostname);
  return readBlockedDomains().find(
    (blockedDomain) =>
      normalizedHostname === blockedDomain ||
      normalizedHostname.endsWith(`.${blockedDomain}`),
  );
}

/** Returns true if the given hostname is user-blocked. */
export function isDomainUserBlocked(hostname: string): boolean {
  return Boolean(getUserBlockedDomainForHostname(hostname));
}
