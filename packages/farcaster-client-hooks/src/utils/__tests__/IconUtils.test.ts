import { vi } from 'vitest';

import { getLikeIconType } from '../IconUtils';

describe('IconUtils', () => {
  describe('getLikeIconType', () => {
    it('detects prefix-based icons', () => {
      expect(getLikeIconType('gm everyone')).toEqual('gm');
      expect(getLikeIconType('GA builders')).toEqual('ga');
      expect(getLikeIconType('gn all')).toEqual('gn');
    });

    it('detects phrase-based icons', () => {
      expect(getLikeIconType('⌐◨-◨ forever')).toEqual('noggles');
      expect(getLikeIconType('nouns forever')).toEqual('noggles');
      expect(getLikeIconType('wowow what a post')).toEqual('wowow');
      expect(getLikeIconType('rainbow mode')).toEqual('rainbow-wallet');
      expect(getLikeIconType('🌈 in bio')).toEqual('rainbow-wallet');
      expect(getLikeIconType('long live $degen')).toEqual('degen');
      expect(getLikeIconType('farcaster is great')).toEqual('farcaster');
      expect(getLikeIconType('ask @farcaster about this')).toEqual('farcaster');
      expect(getLikeIconType('shoutout @clanker')).toEqual('clanker');
      expect(getLikeIconType('this got clanked')).toEqual('clanker');
      expect(getLikeIconType('we are clanking today')).toEqual('clanker');
      expect(getLikeIconType('clank clank lets ship it')).toEqual('clanker');
    });

    it('does not restore the warpcast icon', () => {
      expect(getLikeIconType('warpcast mention')).toEqual('default');
      expect(getLikeIconType('https://warpcast.com')).toEqual('default');
    });

    it('does not match keyword icons inside urls', () => {
      expect(getLikeIconType('https://farcaster.xyz')).toEqual('default');
      expect(getLikeIconType('farcaster.xyz')).toEqual('default');
      expect(getLikeIconType('www.farcaster.xyz')).toEqual('default');
      expect(getLikeIconType('farcaster://profile')).toEqual('default');
      expect(getLikeIconType('https://neynar.com')).toEqual('default');
      expect(getLikeIconType('neynar.com')).toEqual('default');
      expect(getLikeIconType('https://www.clanker.world/clanker/123')).toEqual(
        'default',
      );
      expect(getLikeIconType('clanker.world/clanker/123')).toEqual('default');
      expect(getLikeIconType('https://rainbow.me')).toEqual('default');
      expect(getLikeIconType('https://wowow.example')).toEqual('default');
      expect(getLikeIconType('https://example.com/$degen')).toEqual('default');
    });

    it('does not match inside larger words', () => {
      expect(getLikeIconType('rainbowwallet')).toEqual('default');
      expect(getLikeIconType('wowowzers')).toEqual('default');
      expect(getLikeIconType('$degens')).toEqual('default');
    });

    it('returns the earliest matching icon when multiple triggers are present', () => {
      expect(getLikeIconType('gm farcaster')).toEqual('gm');
      expect(getLikeIconType('farcaster gm')).toEqual('farcaster');
      expect(getLikeIconType('wowow $degen')).toEqual('wowow');
      expect(getLikeIconType('$degen wowow')).toEqual('degen');
      expect(getLikeIconType('clanker farcaster')).toEqual('clanker');
      expect(getLikeIconType('farcaster clanker')).toEqual('farcaster');
    });

    it('keeps rule order as the tie-breaker for same-index matches', () => {
      const originalSearch = String.prototype.search;

      const searchSpy = vi
        .spyOn(String.prototype, 'search')
        .mockImplementation(function (this: string, regex: RegExp) {
          if (this === 'tie-break case') {
            if (
              regex.toString() === '/^gm\\b/' ||
              regex.toString() === '/^ga\\b/'
            ) {
              return 0;
            }

            return -1;
          }

          return originalSearch.call(this, regex);
        });

      try {
        expect(getLikeIconType('tie-break case')).toEqual('gm');
      } finally {
        searchSpy.mockRestore();
      }
    });

    it('falls back to default', () => {
      expect(getLikeIconType('neynar made this easier')).toEqual('default');
      expect(getLikeIconType('rm')).toEqual('default');
      expect(getLikeIconType('fm')).toEqual('default');
      expect(getLikeIconType('ordinary cast text')).toEqual('default');
    });
  });
});
