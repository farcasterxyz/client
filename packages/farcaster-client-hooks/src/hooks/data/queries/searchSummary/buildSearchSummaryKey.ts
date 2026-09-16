import { ApiFid } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

export const buildSearchSummaryKey = ({
  q,
  maxChannels,
  maxUsers,
  maxMiniApps,
  maxTokens,
  addFollowersYouKnowContext,
  intent,
  contextFid,
}: {
  q: string | undefined;
  maxChannels: number;
  maxUsers: number;
  maxMiniApps: number;
  maxTokens: number;
  addFollowersYouKnowContext: boolean;
  intent?: 'typeahead' | 'submit';
  contextFid?: ApiFid;
}) =>
  compactQueryKey([
    'searchSummary',
    q,
    maxChannels,
    maxUsers,
    maxMiniApps,
    maxTokens,
    addFollowersYouKnowContext,
    intent,
    contextFid,
  ]);
