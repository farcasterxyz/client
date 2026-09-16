const MILLIS_PER_DAY = 24 * 60 * 60 * 1000;

const FEATURE_PROMOTION_DISMISS_SUPPRESSION_MS = 30 * MILLIS_PER_DAY;

type FeaturePromotionSurface = 'home_feed';
type FeaturePromotionPlatform = 'web' | 'ios' | 'android';

type FeaturePromotionIcon = 'alert' | 'news';

type FeaturePromotionPostHogPayload = {
  id?: string;
  title: string;
  subtitle: string;
  alert?: boolean;
  icon?: FeaturePromotionIcon;
  iconBackgroundColor?: string;
  backgroundColor?: string;
};

type FeaturePromotion = {
  id: string;
  title: string;
  subtitle: string;
  alert: boolean;
  icon?: FeaturePromotionIcon;
  iconBackgroundColor?: string;
  backgroundColor?: string;
};

type FeaturePromotionClientState = {
  lastImpressedAt?: number;
  dismissedAt?: number;
  clickedAt?: number;
};

type FeaturePromotionClientStateById = Record<
  string,
  FeaturePromotionClientState | undefined
>;

function isFeaturePromotionEligible({
  clientState,
  now,
}: {
  clientState: FeaturePromotionClientState | undefined;
  now: number;
}): boolean {
  if (
    typeof clientState?.dismissedAt === 'number' &&
    now - clientState.dismissedAt < FEATURE_PROMOTION_DISMISS_SUPPRESSION_MS
  ) {
    return false;
  }

  return true;
}

function selectEligibleFeaturePromotion({
  promotions,
  clientStateById,
  now = Date.now(),
}: {
  promotions: FeaturePromotion[];
  clientStateById: FeaturePromotionClientStateById;
  now?: number;
}): FeaturePromotion | undefined {
  return promotions.find((promotion) =>
    isFeaturePromotionEligible({
      clientState: clientStateById[promotion.id],
      now,
    }),
  );
}

export {
  FEATURE_PROMOTION_DISMISS_SUPPRESSION_MS,
  isFeaturePromotionEligible,
  selectEligibleFeaturePromotion,
};
export type { FeaturePromotionClientState, FeaturePromotionClientStateById };
export type {
  FeaturePromotion,
  FeaturePromotionIcon,
  FeaturePromotionPlatform,
  FeaturePromotionPostHogPayload,
  FeaturePromotionSurface,
};
