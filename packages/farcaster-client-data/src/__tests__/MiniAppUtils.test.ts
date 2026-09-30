import { preserveQueryParams } from '../utils/MiniAppUtils';

describe('MiniAppUtils', () => {
  describe('preserveQueryParams', () => {
    it('forwards a source param that the launch URL does not declare', () => {
      expect(
        preserveQueryParams({
          launchUrl: 'https://app.example/home',
          sourceUrl: 'https://cast.example/c?tab=settings',
        }),
      ).toBe('https://app.example/home?tab=settings');
    });

    it('forwards multiple source params', () => {
      const result = preserveQueryParams({
        launchUrl: 'https://app.example/home',
        sourceUrl: 'https://cast.example/c?tab=settings&ref=abc',
      });
      const params = new URL(result).searchParams;
      expect(params.get('tab')).toBe('settings');
      expect(params.get('ref')).toBe('abc');
    });

    it('lets the app-declared (launch) value win on conflict', () => {
      expect(
        preserveQueryParams({
          launchUrl: 'https://app.example/home?tab=home',
          sourceUrl: 'https://cast.example/c?tab=settings&ref=abc',
        }),
      ).toBe('https://app.example/home?tab=home&ref=abc');
    });

    it('keeps launch params untouched when the source has none', () => {
      expect(
        preserveQueryParams({
          launchUrl: 'https://app.example/home?tab=home',
          sourceUrl: 'https://cast.example/c',
        }),
      ).toBe('https://app.example/home?tab=home');
    });

    it('normalizes the launch URL (adds trailing slash) when nothing is merged', () => {
      expect(
        preserveQueryParams({
          launchUrl: 'https://app.example',
          sourceUrl: 'https://cast.example',
        }),
      ).toBe('https://app.example/');
    });

    it('collapses a repeated source key to its first value', () => {
      // forEach sets `a=1` first, then skips `a=2` because the key now exists.
      expect(
        preserveQueryParams({
          launchUrl: 'https://app.example/home',
          sourceUrl: 'https://cast.example/c?a=1&a=2',
        }),
      ).toBe('https://app.example/home?a=1');
    });

    it('copies only query params, not the source fragment', () => {
      expect(
        preserveQueryParams({
          launchUrl: 'https://app.example/home',
          sourceUrl: 'https://cast.example/c?a=1#section',
        }),
      ).toBe('https://app.example/home?a=1');
    });

    it('preserves the launch URL fragment', () => {
      expect(
        preserveQueryParams({
          launchUrl: 'https://app.example/home#top',
          sourceUrl: 'https://cast.example/c?a=1',
        }),
      ).toBe('https://app.example/home?a=1#top');
    });

    it('returns the launch URL unchanged when the source URL is invalid', () => {
      const launchUrl = 'https://app.example/home?x=1';
      expect(preserveQueryParams({ launchUrl, sourceUrl: 'not a url' })).toBe(
        launchUrl,
      );
    });

    it('returns the launch URL unchanged when the source URL is relative', () => {
      const launchUrl = 'https://app.example/home?x=1';
      expect(preserveQueryParams({ launchUrl, sourceUrl: '/foo?bar=1' })).toBe(
        launchUrl,
      );
    });

    it('returns the launch URL as-is (not normalized) when it is invalid', () => {
      const launchUrl = 'not a url';
      expect(
        preserveQueryParams({
          launchUrl,
          sourceUrl: 'https://cast.example/c?a=1',
        }),
      ).toBe(launchUrl);
    });

    // The `openMiniApp` SDK action resolves a caller-supplied URL to the app's
    // declared canonical launch URL (params stripped); these cases cover that
    // flow, where `launchUrl` is the resolved config URL and `sourceUrl` is the
    // URL the caller actually passed.
    describe('openMiniApp launch scenario', () => {
      it('forwards the caller URL params onto the resolved canonical URL', () => {
        expect(
          preserveQueryParams({
            launchUrl: 'https://app.example/', // resolved config.url
            sourceUrl: 'https://app.example/?ref=me&utm=x', // caller-supplied url
          }),
        ).toBe('https://app.example/?ref=me&utm=x');
      });

      it('retains params when resolution fell back to the caller URL', () => {
        // On resolve failure the caller URL is used as both launch and source,
        // so its params must survive unchanged.
        const callerUrl = 'https://app.example/x?ref=me';
        expect(
          preserveQueryParams({ launchUrl: callerUrl, sourceUrl: callerUrl }),
        ).toBe(callerUrl);
      });
    });
  });
});
