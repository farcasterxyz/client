import { useCallback } from 'react';

import { useNavigate } from '~/hooks/navigation/useNavigate';

const useNavigateToDirectCastsInbox = () => {
  const navigate = useNavigate();

  return useCallback(() => {
    return navigate({
      to: 'directCastsInbox',
      params: {},
      searchParams: {},
    });
  }, [navigate]);
};

export { useNavigateToDirectCastsInbox };
