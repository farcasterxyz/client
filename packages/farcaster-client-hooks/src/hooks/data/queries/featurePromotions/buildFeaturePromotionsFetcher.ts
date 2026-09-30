import { hardcodedFeaturePromotions } from './hardcodedFeaturePromotions';

const buildFeaturePromotionsFetcher = () => async () => {
  return hardcodedFeaturePromotions;
};

export { buildFeaturePromotionsFetcher };
