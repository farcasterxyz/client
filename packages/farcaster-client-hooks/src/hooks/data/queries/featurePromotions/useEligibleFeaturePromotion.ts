import { useMemo } from 'react';

import {
  FeaturePromotion,
  FeaturePromotionClientStateById,
  selectEligibleFeaturePromotion,
} from './featurePromotionEligibility';
import { hardcodedFeaturePromotions } from './hardcodedFeaturePromotions';

const useEligibleFeaturePromotion = ({
  clientStateById,
  promotions = hardcodedFeaturePromotions,
  enabled = true,
}: {
  clientStateById: FeaturePromotionClientStateById;
  promotions?: FeaturePromotion[];
  enabled?: boolean;
}) => {
  const promotion = useMemo(() => {
    if (!enabled) {
      return undefined;
    }

    return selectEligibleFeaturePromotion({
      promotions,
      clientStateById,
    });
  }, [clientStateById, enabled, promotions]);

  return {
    promotion,
    isPending: false,
    error: null,
  };
};

export { useEligibleFeaturePromotion };
