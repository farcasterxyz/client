import { describe, expect, it } from 'vitest';

import { parseFeaturePromotionRegistryPayload } from '../parseFeaturePromotionRegistryPayload';

describe('parseFeaturePromotionRegistryPayload', () => {
  it('parses promo flag keys in payload order', () => {
    expect(
      parseFeaturePromotionRegistryPayload([
        'feature-promotion-news-v2',
        'feature-promotion-snap-v1',
      ]),
    ).toEqual(['feature-promotion-news-v2', 'feature-promotion-snap-v1']);
  });

  it('drops non-string flag keys', () => {
    expect(
      parseFeaturePromotionRegistryPayload([
        'feature-promotion-news-v2',
        null,
        1,
      ]),
    ).toEqual(['feature-promotion-news-v2']);
  });

  it('returns an empty list for malformed payloads', () => {
    expect(parseFeaturePromotionRegistryPayload({})).toEqual([]);
    expect(parseFeaturePromotionRegistryPayload(null)).toEqual([]);
  });
});
