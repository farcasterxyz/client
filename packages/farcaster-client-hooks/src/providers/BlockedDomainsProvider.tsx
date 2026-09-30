import React, {
  createContext,
  FC,
  memo,
  ReactNode,
  useContext,
  useMemo,
} from 'react';

import { useFrameBlocklist } from '../hooks/data/queries/frameBlocklist';
import { useSnapBlocklist } from '../hooks/data/queries/snapBlocklist';

function normalizeHostname(raw: string): string {
  const lowered = raw.toLowerCase();
  return lowered.endsWith('.') ? lowered.slice(0, -1) : lowered;
}

function parseBlocklistEntry(entry: string): string {
  // Trim before the scheme check and before URL parsing — `new URL()` throws on
  // surrounding whitespace, so e.g. " https://evil.com " would otherwise fall to
  // the catch branch and get stored as `https://evil.com`, which never matches
  // hostnames extracted from embed URLs.
  const trimmed = entry.trim();
  if (trimmed.includes('://')) {
    try {
      return normalizeHostname(new URL(trimmed).hostname);
    } catch {
      return normalizeHostname(trimmed);
    }
  }
  return normalizeHostname(trimmed);
}

const EMPTY_SET = new Set<string>();

const BlockedDomainsContext = createContext<Set<string>>(EMPTY_SET);
const BlockedSnapUrlsContext = createContext<Set<string>>(EMPTY_SET);

type BlockedDomainsProviderProps = {
  children: ReactNode;
  enabled?: boolean;
};

const BlockedDomainsProvider: FC<BlockedDomainsProviderProps> = memo(
  ({ children, enabled }) => {
    const { data: blocklist } = useFrameBlocklist({ enabled });
    const { data: snapBlocklist } = useSnapBlocklist({ enabled });

    const blockedDomains = useMemo(() => {
      if (!blocklist) return EMPTY_SET;
      return new Set(blocklist.map(parseBlocklistEntry));
    }, [blocklist]);

    const blockedSnapUrls = useMemo(() => {
      if (!snapBlocklist) return EMPTY_SET;
      return new Set(snapBlocklist);
    }, [snapBlocklist]);

    return (
      <BlockedDomainsContext.Provider value={blockedDomains}>
        <BlockedSnapUrlsContext.Provider value={blockedSnapUrls}>
          {children}
        </BlockedSnapUrlsContext.Provider>
      </BlockedDomainsContext.Provider>
    );
  },
);

BlockedDomainsProvider.displayName = 'BlockedDomainsProvider';

const useBlockedDomains = (): Set<string> => useContext(BlockedDomainsContext);
const useBlockedSnapUrls = (): Set<string> =>
  useContext(BlockedSnapUrlsContext);

export { BlockedDomainsProvider, useBlockedDomains, useBlockedSnapUrls };
