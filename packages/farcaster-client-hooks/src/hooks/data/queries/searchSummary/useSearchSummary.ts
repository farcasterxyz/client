import { useQuery } from '@tanstack/react-query';
import { ApiFid } from 'farcaster-client-data';

import { MILLIS_PER_MINUTE } from '../../../..';
import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useBatchMergeIntoGloballyCachedChannels } from '../globallyCachedChannel';
import { useBatchMergeIntoGloballyCachedUsers } from '../globallyCachedUser';
import { buildSearchSummaryFetcher } from './buildSearchSummaryFetcher';
import { buildSearchSummaryKey } from './buildSearchSummaryKey';

const gcTime = MILLIS_PER_MINUTE;

const useSearchSummary = ({
  q,
  maxUsers,
  maxChannels,
  maxMiniApps,
  maxTokens,
  addFollowersYouKnowContext = false,
  intent = 'typeahead',
  contextFid,
}: {
  q: string;
  maxUsers: number;
  maxChannels: number;
  maxMiniApps: number;
  maxTokens: number;
  addFollowersYouKnowContext?: boolean;
  intent?: 'typeahead' | 'submit';
  contextFid?: ApiFid;
}) => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedChannels =
    useBatchMergeIntoGloballyCachedChannels();
  const batchMergeIntoGloballyCachedUsers =
    useBatchMergeIntoGloballyCachedUsers();

  return useQuery({
    queryKey: buildSearchSummaryKey({
      q,
      maxChannels,
      maxUsers,
      maxMiniApps,
      maxTokens,
      addFollowersYouKnowContext,
      intent,
      contextFid,
    }),

    queryFn: buildSearchSummaryFetcher({
      q,
      maxChannels,
      maxUsers,
      maxMiniApps,
      maxTokens,
      addFollowersYouKnowContext,
      intent,
      contextFid,
      apiClient,
      batchMergeIntoGloballyCachedChannels,
      batchMergeIntoGloballyCachedUsers,
    }),

    gcTime,
    enabled: !!q,
  });
};

export { useSearchSummary };
