import { useSuspenseQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildArticleFetcher } from './buildArticleFetcher';
import { buildArticleKey } from './buildArticleKey';

const useArticle = ({ publicId }: { publicId: string }) => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildArticleKey({ publicId }),
    queryFn: buildArticleFetcher({ apiClient, publicId }),
  });
};

export { useArticle };
