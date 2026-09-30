import { describe, expect, it } from 'vitest';

import {
  FEATURE_PROMOTION_DISMISS_SUPPRESSION_MS,
  FeaturePromotion,
  selectEligibleFeaturePromotion,
} from '../featurePromotionEligibility';

const now = 1_000_000;

const basePromotion: FeaturePromotion = {
  id: 'feed-promo-1',
  title: 'Stay up to date',
  subtitle: 'Follow the latest conversations from people you know.',
  alert: false,
};

describe('selectEligibleFeaturePromotion', () => {
  it('chooses the first eligible promotion', () => {
    const older = { ...basePromotion, id: 'older' };
    const newer = { ...basePromotion, id: 'newer' };

    expect(
      selectEligibleFeaturePromotion({
        promotions: [newer, older],
        clientStateById: {},
        now,
      })?.id,
    ).toBe('newer');
  });

  it('only hides a promotion after dismissal', () => {
    expect(
      selectEligibleFeaturePromotion({
        promotions: [basePromotion],
        clientStateById: {
          [basePromotion.id]: {
            dismissedAt: now - FEATURE_PROMOTION_DISMISS_SUPPRESSION_MS + 1,
          },
        },
        now,
      }),
    ).toBeUndefined();

    const visibleAfterImpressionOrClick = selectEligibleFeaturePromotion({
      promotions: [basePromotion],
      clientStateById: {
        [basePromotion.id]: {
          lastImpressedAt: now - 1,
          clickedAt: now - 1,
        },
      },
      now,
    });

    expect(visibleAfterImpressionOrClick?.id).toBe(basePromotion.id);
  });

  it('does not suppress other promotions after an impression', () => {
    const older = { ...basePromotion, id: 'older' };
    const newer = { ...basePromotion, id: 'newer' };

    expect(
      selectEligibleFeaturePromotion({
        promotions: [newer, older],
        clientStateById: {
          older: {
            lastImpressedAt: now - 1,
          },
        },
        now,
      })?.id,
    ).toBe('newer');
  });

  it('allows an old dismissal to resurface', () => {
    expect(
      selectEligibleFeaturePromotion({
        promotions: [basePromotion],
        clientStateById: {
          [basePromotion.id]: {
            dismissedAt: now - FEATURE_PROMOTION_DISMISS_SUPPRESSION_MS - 1,
          },
        },
        now,
      })?.id,
    ).toBe(basePromotion.id);
  });
});
