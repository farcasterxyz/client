import type { ApiReportCastReason } from 'farcaster-client-data';
import { useCallback, useMemo } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { getNotionLinkTarget } from '../../../utils';

export type ReportCastOption = {
  id: ApiReportCastReason;
  label: string;
  description: string;
};

const useReportCast = () => {
  const { apiClient } = useFarcasterApiClient();

  const learnMoreUrl = getNotionLinkTarget({ to: 'reporting-casts' });

  const reportCastOptions = useMemo<ReportCastOption[]>(() => {
    return [
      {
        id: 'spam',
        label: 'Spammy',
        description:
          "It's irrelevant, uninteresting or looks automatically generated.",
      },
      {
        id: 'offensive',
        label: 'Offensive',
        description:
          "It's disturbing or unpleasant and I don't want to see it.",
      },
      {
        id: 'fraudulent',
        label: 'Fraudulent',
        description:
          "It's misleading or deceiving users with incorrect information.",
      },
      {
        id: 'other',
        label: 'Child Safety Concern',
        description:
          "It involves a minor in a harmful or exploitative context, or otherwise endangers a child's well-being.",
      },
    ];
  }, []);

  const reportCast = useCallback(
    async ({
      castHash,
      reason,
    }: {
      castHash: string;
      reason: ApiReportCastReason;
    }) => {
      await apiClient.reportCast({ castHash, reason });
    },
    [apiClient],
  );
  return { reportCastOptions, reportCast, learnMoreUrl };
};

export { useReportCast };
