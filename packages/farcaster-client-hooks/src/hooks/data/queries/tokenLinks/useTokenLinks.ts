import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { ApiChain, ApiFid } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useBatchMergeIntoGloballyCachedTokens } from '../globallyCachedToken';
import { buildTokenLinksFetcher } from './buildTokenLinksFetcher';
import { buildTokenLinksKey } from './buildTokenLinksKey';

const useTokenLinks = ({
  ticker,
  chain,
  intent = 'submit',
  contextFid,
}: {
  ticker: string;
  chain?: ApiChain;
  intent?: 'typeahead' | 'submit';
  contextFid?: ApiFid;
}) => {
  const { apiClient } = useFarcasterApiClient();

  const batchMergeIntoGloballyCachedTokens =
    useBatchMergeIntoGloballyCachedTokens();

  return useSuspenseQuery({
    queryKey: buildTokenLinksKey({ ticker, chain, intent, contextFid }),
    queryFn: buildTokenLinksFetcher({
      apiClient,
      ticker,
      chain,
      intent,
      contextFid,
      batchMergeIntoGloballyCachedTokens,
    }),
  });
};

const useNonSuspenseTokenLinks = ({
  ticker,
  chain,
  intent = 'submit',
  contextFid,
  enabled = true,
}: {
  ticker: string;
  chain?: ApiChain;
  intent?: 'typeahead' | 'submit';
  contextFid?: ApiFid;
  enabled?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();

  const batchMergeIntoGloballyCachedTokens =
    useBatchMergeIntoGloballyCachedTokens();

  return useQuery({
    queryKey: buildTokenLinksKey({ ticker, chain, intent, contextFid }),
    queryFn: buildTokenLinksFetcher({
      apiClient,
      ticker,
      chain,
      intent,
      contextFid,
      batchMergeIntoGloballyCachedTokens,
    }),
    enabled,
  });
};

export { useNonSuspenseTokenLinks, useTokenLinks };
