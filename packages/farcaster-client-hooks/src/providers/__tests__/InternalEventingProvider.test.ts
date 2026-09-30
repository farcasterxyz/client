import { describe, expect, test } from 'vitest';

import { getCastInteractionAttribution } from '../../utils/CastInteractionAttributionUtils';
import { getHomeFeedSnapActionProperties } from '../../utils/SnapActionAnalyticsUtils';
import {
  castViewTrackingDataToApiData,
  minimalCastViewEventToTrackingData,
  trackedCastViewEventToMinimalCastViewEvent,
} from '../InternalEventingProvider';

describe('InternalEventingProvider cast view attribution', () => {
  test('preserves snap promotion attribution in analytics cast-view payloads', () => {
    expect(
      castViewTrackingDataToApiData({
        castHash: '0xabc',
        on: 'feed',
        channel: 'home',
        feed: 'home',
        includeReason: 'snap-promoted',
        index: 24,
        homeFeedSnapBoostVariant: 'snap_boost_5pct',
      }),
    ).toEqual({
      castHash: '0xabc',
      on: 'feed',
      channel: 'home',
      feed: 'home',
      reason: 'snap-promoted',
      position: 24,
      homeFeedSnapBoostVariant: 'snap_boost_5pct',
    });
  });

  test('preserves snap promotion attribution in minimal feed cast-view payloads', () => {
    expect(
      trackedCastViewEventToMinimalCastViewEvent({
        type: 'cast-view',
        ts: 123,
        data: {
          castHash: '0xabc',
          feed: 'home',
          includeReason: 'snap-promoted',
          index: 24,
          homeFeedSnapBoostVariant: 'snap_boost_5pct',
        },
      }),
    ).toEqual(
      expect.objectContaining({
        ts: 123,
        hash: '0xabc',
        feed: 'home',
        reason: 'snap-promoted',
        position: 24,
        homeFeedSnapBoostVariant: 'snap_boost_5pct',
      }),
    );
  });

  test('rehydrates minimal feed cast-view payloads for retry', () => {
    expect(
      minimalCastViewEventToTrackingData({
        ts: 123,
        hash: '0xabc',
        feed: 'home',
        reason: 'snap-promoted',
        position: 24,
        homeFeedSnapBoostVariant: 'snap_boost_5pct',
      }),
    ).toEqual(
      expect.objectContaining({
        castHash: '0xabc',
        feed: 'home',
        includeReason: 'snap-promoted',
        index: 24,
        homeFeedSnapBoostVariant: 'snap_boost_5pct',
      }),
    );
  });
});

describe('cast interaction attribution', () => {
  test('maps snap promotion context to backend interaction attribution fields', () => {
    expect(
      getCastInteractionAttribution(
        {},
        {
          includeReason: 'snap-promoted',
          index: 24,
          homeFeedSnapBoostVariant: 'snap_boost_5pct',
        },
      ),
    ).toEqual({
      reason: 'snap-promoted',
      position: 24,
      homeFeedSnapBoostVariant: 'snap_boost_5pct',
    });
  });

  test('allows explicit interaction attribution to override cast view defaults', () => {
    expect(
      getCastInteractionAttribution(
        {
          includeReason: 'popular',
          index: 7,
        },
        {
          includeReason: 'snap-promoted',
          index: 24,
          homeFeedSnapBoostVariant: 'snap_boost_5pct',
        },
      ),
    ).toEqual({
      reason: 'popular',
      position: 7,
      homeFeedSnapBoostVariant: 'snap_boost_5pct',
    });
  });

  test('does not add optional attribution fields when no context is available', () => {
    expect(getCastInteractionAttribution({}, {})).toEqual({});
  });
});

describe('home feed snap action analytics', () => {
  test('builds client-side snap action properties for promoted snap clicks', () => {
    expect(
      getHomeFeedSnapActionProperties(
        {
          actionGroup: 'click',
          actionType: 'ext link',
          interactionType: 'click-ext-link',
          castHash: '0xabc',
          feed: 'home',
        },
        {
          includeReason: 'snap-promoted',
          index: 24,
          homeFeedSnapBoostVariant: 'snap_boost_5pct',
        },
      ),
    ).toEqual({
      action_group: 'click',
      action_type: 'ext link',
      interaction_type: 'click-ext-link',
      castHash: '0xabc',
      feed: 'home',
      reason: 'snap-promoted',
      includeReason: 'snap-promoted',
      index: 24,
      position: 24,
      homeFeedSnapBoostVariant: 'snap_boost_5pct',
      home_feed_snap_boost_variant: 'snap_boost_5pct',
    });
  });

  test('builds client-side snap action properties for promoted snap reactions', () => {
    expect(
      getHomeFeedSnapActionProperties(
        {
          actionGroup: 'reaction',
          actionType: 'like',
          interactionType: 'like',
          castHash: '0xabc',
          includeReason: 'snap-promoted',
          undo: false,
        },
        {},
      ),
    ).toEqual({
      action_group: 'reaction',
      action_type: 'like',
      interaction_type: 'like',
      castHash: '0xabc',
      reason: 'snap-promoted',
      includeReason: 'snap-promoted',
      undo: false,
    });
  });

  test('does not fire for non-snap-promoted casts', () => {
    expect(
      getHomeFeedSnapActionProperties(
        {
          actionGroup: 'click',
          actionType: 'cast',
          includeReason: 'popular',
        },
        {},
      ),
    ).toBeUndefined();
  });
});
