import {
  buildSnapActivationAnalyticsProps,
  buildSnapHandlerAnalyticsProps,
  getSnapDomain,
  getSnapPaginatorChangeAnalytics,
  getSnapSourceBucket,
  snapUrlForAnalyticsEvent,
} from '../snapHandlerAnalytics';

describe('snapHandlerAnalytics', () => {
  describe('snapUrlForAnalyticsEvent', () => {
    it('removes query strings while preserving hashes', () => {
      expect(
        snapUrlForAnalyticsEvent('https://example.com/snap?a=1#state'),
      ).toBe('https://example.com/snap#state');
    });

    it('returns invalid URLs unchanged', () => {
      expect(snapUrlForAnalyticsEvent('not a url')).toBe('not a url');
    });
  });

  describe('getSnapSourceBucket', () => {
    it.each([
      ['https://poll.neynar.app/snap', 'generated'],
      [
        'https://snap-builder-api.REPLACE_ME.workers.dev/d/abc/',
        'generated',
      ],
      ['https://host.neynar.com/snap/app', 'host_neynar'],
      ['https://example.com/snap', 'self_hosted'],
      ['not a url', 'unknown'],
      [undefined, 'unknown'],
    ] as const)('classifies %s as %s', (url, expected) => {
      expect(getSnapSourceBucket(url)).toBe(expected);
    });
  });

  describe('buildSnapHandlerAnalyticsProps', () => {
    it('returns normalized URL, domain, and bucket', () => {
      expect(
        buildSnapHandlerAnalyticsProps('https://host.neynar.com/snap?a=1'),
      ).toEqual({
        snapDomain: 'host.neynar.com',
        snapSourceBucket: 'host_neynar',
        snapUrl: 'https://host.neynar.com/snap',
      });
    });

    it('omits URL and domain when invalid', () => {
      expect(buildSnapHandlerAnalyticsProps('not a url')).toEqual({
        snapSourceBucket: 'unknown',
        snapUrl: 'not a url',
      });
      expect(getSnapDomain('not a url')).toBeUndefined();
    });
  });

  describe('buildSnapActivationAnalyticsProps', () => {
    it('adds cast/feed attribution and normalized snap fields', () => {
      expect(
        buildSnapActivationAnalyticsProps(
          {
            snapUrl: 'https://poll.neynar.app/snap?state=1',
            surface: 'cast_embed_web',
            activationTrigger: 'lift',
            castHash: '0xabc',
            castAuthorFid: 123,
          },
          {
            feed: 'home',
            includeReason: 'snap-promoted',
            index: 4,
            homeFeedSnapBoostVariant: 'snap_boost_5pct',
          },
        ),
      ).toEqual({
        activationTrigger: 'lift',
        surface: 'cast_embed_web',
        castHash: '0xabc',
        castAuthorFid: 123,
        feed: 'home',
        reason: 'snap-promoted',
        includeReason: 'snap-promoted',
        position: 4,
        index: 4,
        homeFeedSnapBoostVariant: 'snap_boost_5pct',
        home_feed_snap_boost_variant: 'snap_boost_5pct',
        snapDomain: 'poll.neynar.app',
        snapSourceBucket: 'generated',
        snapUrl: 'https://poll.neynar.app/snap',
      });
    });
  });

  describe('getSnapPaginatorChangeAnalytics', () => {
    it.each([
      [0, 1, 'paginator_next'],
      [2, 1, 'paginator_prev'],
      [0, 3, 'paginator_go_to'],
    ] as const)(
      'classifies page change from %s to %s as %s',
      (previousPage, page, handler) => {
        expect(
          getSnapPaginatorChangeAnalytics({
            previousState: {
              ui: { paginator: { page: previousPage, pageCount: 4 } },
            },
            nextState: {
              ui: { paginator: { page, pageCount: 4 } },
            },
          }),
        ).toEqual({
          handler,
          previousPage,
          page,
          pageCount: 4,
        });
      },
    );

    it('uses page zero as the default previous page for first observed changes', () => {
      expect(
        getSnapPaginatorChangeAnalytics({
          previousState: undefined,
          nextState: { ui: { paginator: { page: 1, pageCount: 3 } } },
        }),
      ).toEqual({
        handler: 'paginator_next',
        previousPage: 0,
        page: 1,
        pageCount: 3,
      });
    });

    it('ignores non-pagination state changes', () => {
      expect(
        getSnapPaginatorChangeAnalytics({
          previousState: { ui: { paginator: { page: 0, pageCount: 3 } } },
          nextState: {
            ui: { paginator: { page: 0, pageCount: 3 } },
            inputs: { q: 'hello' },
          },
        }),
      ).toBeNull();
    });
  });
});
