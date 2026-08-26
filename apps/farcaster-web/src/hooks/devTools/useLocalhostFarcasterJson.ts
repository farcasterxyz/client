import { ApiDomainManifest } from 'farcaster-client-data';
import { useCallback } from 'react';

const buildLocalhostFarcasterJsonFetcher = (domain: string) => async () => {
  const response = await fetch(`http://${domain}/.well-known/farcaster.json`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch farcaster.json');
  }

  const data = await response.json().catch(() => null);
  return data as ApiDomainManifest | null;
};

export const useFetchLocalhostFarcasterJson = () => {
  return useCallback(async ({ domain }: { domain: string | undefined }) => {
    if (!domain) {
      return null;
    }

    const result = await buildLocalhostFarcasterJsonFetcher(domain)();

    if (!result) {
      return null;
    }

    return result;
  }, []);
};
