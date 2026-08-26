import { useQuery } from '@tanstack/react-query';

import { buildFeaturePromotionsFetcher } from './buildFeaturePromotionsFetcher';
import { buildFeaturePromotionsKey } from './buildFeaturePromotionsKey';
import { featurePromotionsDefaultQueryOptions } from './featurePromotionsDefaultQueryOptions';

const useFeaturePromotions = ({ enabled = true }: { enabled?: boolean }) => {
  return useQuery({
    ...featurePromotionsDefaultQueryOptions,
    queryKey: buildFeaturePromotionsKey(),
    queryFn: buildFeaturePromotionsFetcher(),
    enabled,
  });
};

export { useFeaturePromotions };
