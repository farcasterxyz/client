import { describe, expect, it } from 'vitest';

import {
  featurePromotionPostHogPayloadExamples,
  parseFeaturePromotionPayload,
} from '../parseFeaturePromotionPayload';

describe('parseFeaturePromotionPayload', () => {
  it('locks the PostHog payload examples to the parser output', () => {
    expect(
      parseFeaturePromotionPayload(
        featurePromotionPostHogPayloadExamples.informationalPromo,
        { fallbackId: 'feature-promotion-info-v1' },
      ),
    ).toEqual({
      id: 'feature-promotion-info-v1',
      title: 'Stay up to date',
      subtitle: 'Follow the latest conversations from people you know.',
      alert: false,
    });

    expect(
      parseFeaturePromotionPayload(
        featurePromotionPostHogPayloadExamples.defaultAlert,
        { fallbackId: 'wallet-alert-v1' },
      ),
    ).toEqual({
      id: 'wallet-alert-v1',
      title: 'Wallet activity is delayed',
      subtitle: 'Some transactions may take longer than usual to appear.',
      alert: true,
    });

    expect(
      parseFeaturePromotionPayload(
        featurePromotionPostHogPayloadExamples.styledPromo,
        { fallbackId: 'styled-promo-v1' },
      ),
    ).toEqual({
      id: 'styled-promo-v1',
      title: 'Explore the feed',
      subtitle: 'Discover more of what your community is discussing.',
      alert: false,
      icon: 'news',
      iconBackgroundColor: '#E0F2FE',
      backgroundColor: '#F0F9FF',
    });
  });

  it('parses an informational PostHog flag payload', () => {
    const promotion = parseFeaturePromotionPayload({
      id: 'feed-promo-1',
      title: 'Stay up to date',
      subtitle: 'Follow the latest conversations from people you know.',
    });

    expect(promotion).toEqual({
      id: 'feed-promo-1',
      title: 'Stay up to date',
      subtitle: 'Follow the latest conversations from people you know.',
      alert: false,
    });
  });

  it('uses the flag key as a fallback id', () => {
    const promotion = parseFeaturePromotionPayload(
      {
        title: 'Stay up to date',
        subtitle: 'Follow the latest conversations from people you know.',
      },
      { fallbackId: 'feature-promotion-info-v1' },
    );

    expect(promotion?.id).toBe('feature-promotion-info-v1');
  });

  it('suppresses the retired Builder action', () => {
    const promotion = parseFeaturePromotionPayload(
      {
        title: 'Create an interactive cast',
        subtitle: 'Turn an idea into a Snap in seconds.',
        action: 'open_snap_builder',
      },
      { fallbackId: 'retired-builder-promo-v1' },
    );

    expect(promotion).toBeNull();
  });

  it('parses unsupported actions as informational items and ignores unsupported icons', () => {
    const promotion = parseFeaturePromotionPayload(
      {
        title: 'Stay up to date',
        subtitle: 'Follow the latest conversations from people you know.',
        action: 'unsupported',
        icon: 'unknown',
        iconBackgroundColor: '#E0F2FE',
        backgroundColor: '#F0F9FF',
      },
      { fallbackId: 'informational-promo-v1' },
    );

    expect(promotion).toEqual({
      id: 'informational-promo-v1',
      title: 'Stay up to date',
      subtitle: 'Follow the latest conversations from people you know.',
      alert: false,
      iconBackgroundColor: '#E0F2FE',
      backgroundColor: '#F0F9FF',
    });
  });
});
