import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildArticleKey } from './buildArticleKey';

const useInvalidateArticle = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ publicId }: { publicId: string }) => {
      return queryClient.invalidateQueries({
        queryKey: buildArticleKey({ publicId }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateArticle };
