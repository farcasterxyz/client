import type { ApiReportUserReason } from 'farcaster-client-data';
import { useCallback, useMemo } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

export type ReportUserOption = {
  id: ApiReportUserReason;
  label: string;
  description: string;
};

const useReportUser = () => {
  const { apiClient } = useFarcasterApiClient();

  const reportUserOptions = useMemo<ReportUserOption[]>(() => {
    return [
      {
        id: 'spam',
        label: 'Spammy',
        description: 'Their content is irrelevant, uninteresting and unwanted.',
      },
      {
        id: 'inappropriate',
        label: 'Inappropriate',
        description: 'Their content is disturbing or unpleasant.',
      },
      {
        id: 'child-safety-concern',
        label: 'Child Safety Concern',
        description:
          "Their content involves a minor in a harmful or exploitative context, or otherwise endangers a child's well-being.",
      },
      {
        id: 'impersonation',
        label: 'Impersonation',
        description:
          'They are falsely presenting as another person or identity.',
      },
      {
        id: 'other',
        label: 'Other',
        description: 'Some other reason.',
      },
    ];
  }, []);

  const reportUser = useCallback(
    async ({
      reportedFid,
      reason,
    }: {
      reportedFid: number;
      reason: ApiReportUserReason;
    }) => {
      await apiClient.reportUser({ reportedFid, reason });
    },
    [apiClient],
  );

  return { reportUserOptions, reportUser };
};

export { useReportUser };
