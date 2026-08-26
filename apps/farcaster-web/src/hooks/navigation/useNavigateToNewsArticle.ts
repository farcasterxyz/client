import { useCallback } from 'react';

import { useNavigate } from '~/hooks/navigation/useNavigate';

const useNavigateToNewsArticle = () => {
  const navigate = useNavigate();

  return useCallback(
    ({ articlePublicId }: { articlePublicId: string }) => {
      return navigate({
        to: 'news',
        params: { id: articlePublicId },
      });
    },
    [navigate],
  );
};

export { useNavigateToNewsArticle };
