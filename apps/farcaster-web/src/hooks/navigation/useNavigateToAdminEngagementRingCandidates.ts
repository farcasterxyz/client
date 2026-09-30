import { useCallback } from 'react';

import { useNavigate } from '~/hooks/navigation/useNavigate';

const useNavigateToAdminEngagementRingCandidates = () => {
  const navigate = useNavigate();

  return useCallback(
    ({ fid }: { fid: number }) => {
      navigate({
        to: 'adminEngagementRingCandidates',
        params: {},
        searchParams: { fid: fid.toString() },
      });
    },
    [navigate],
  );
};

export { useNavigateToAdminEngagementRingCandidates };
