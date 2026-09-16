import {
  isValidHttpsUrl,
  resolveUnauthedUniversalLink,
  resolveUniversalLink,
} from '../DeepLinkUtils';

describe('DeepLinkUtils', () => {
  describe('isValidHttpsUrl', () => {
    it('accepts https URLs', () => {
      expect(isValidHttpsUrl('https://example.com')).toBe(true);
      expect(isValidHttpsUrl('https://example.com/path?q=1')).toBe(true);
    });

    it('rejects http URLs', () => {
      expect(isValidHttpsUrl('http://example.com')).toBe(false);
    });

    it('rejects javascript: URLs', () => {
      expect(isValidHttpsUrl('javascript:alert(1)')).toBe(false);
    });

    it('rejects data: URLs', () => {
      expect(isValidHttpsUrl('data:text/html,<script>alert(1)</script>')).toBe(
        false,
      );
    });

    it('rejects malformed URLs', () => {
      expect(isValidHttpsUrl('not-a-url')).toBe(false);
      expect(isValidHttpsUrl('')).toBe(false);
    });
  });

  describe('resolveUniversalLink', () => {
    it('should resolve universal feed', () => {
      const parsedUrl = new URL('https://farcaster.xyz');
      expect(
        resolveUniversalLink({
          url: parsedUrl.href,
          pathname: parsedUrl.pathname,
          searchParams: parsedUrl.searchParams,
        }),
      ).toEqual({
        name: 'Feed',
        params: {},
        type: 'navigate',
      });
    });

    it('should resolve compose intent', () => {
      const parsedUrl = new URL(
        'https://farcaster.xyz/~/compose?text=testing&embeds[]=yellow&embeds[]=red&channelKey=test-channel',
      );
      expect(
        resolveUniversalLink({
          url: parsedUrl.href,
          pathname: parsedUrl.pathname,
          searchParams: parsedUrl.searchParams,
        }),
      ).toEqual({
        name: 'Feed',
        params: {
          castComposerIntent: {
            text: 'testing',
            embeds: ['yellow', 'red'],
            mentions: [],
            channelKey: 'test-channel',
          },
        },
        type: 'navigate',
      });
    });

    it('should resolve universal profile with username', () => {
      const parsedUrl = new URL('https://farcaster.xyz/dwr');
      expect(
        resolveUniversalLink({
          url: parsedUrl.href,
          pathname: parsedUrl.pathname,
          searchParams: parsedUrl.searchParams,
        }),
      ).toEqual({
        name: 'DeeplinkOnlyUserV2',
        params: { username: 'dwr' },
        type: 'push',
      });
    });

    it('should resolve universal profile without username', () => {
      const parsedUrl = new URL('https://farcaster.xyz/~/profiles/1');
      expect(
        resolveUniversalLink({
          url: parsedUrl.href,
          pathname: parsedUrl.pathname,
          searchParams: parsedUrl.searchParams,
        }),
      ).toEqual({
        name: 'UserV2',
        params: { fid: 1 },
        type: 'push',
      });
    });

    it('should resolve universal conversation with username', () => {
      const parsedUrl = new URL('https://farcaster.xyz/dwr/123');
      expect(
        resolveUniversalLink({
          url: parsedUrl.href,
          pathname: parsedUrl.pathname,
          searchParams: parsedUrl.searchParams,
        }),
      ).toEqual({
        name: 'Cast',
        params: { username: 'dwr', castHashPrefix: '123' },
        type: 'push',
      });
    });

    it('should resolve universal conversation without username', () => {
      const parsedUrl = new URL('https://farcaster.xyz/~/conversations/123456');
      expect(
        resolveUniversalLink({
          url: parsedUrl.href,
          pathname: parsedUrl.pathname,
          searchParams: parsedUrl.searchParams,
        }),
      ).toEqual({
        name: 'Cast',
        params: { castHash: '123456' },
        type: 'push',
      });
    });

    it('should resolve universal conversation reactions with username', () => {
      const parsedUrl = new URL('https://farcaster.xyz/dwr/123/reactions');
      expect(
        resolveUniversalLink({
          url: parsedUrl.href,
          pathname: parsedUrl.pathname,
          searchParams: parsedUrl.searchParams,
        }),
      ).toEqual({
        name: 'CastReactionUsers',
        params: {
          username: 'dwr',
          castHashPrefix: '123',
          headerTitle: 'Cast reactions',
        },
        type: 'push',
      });
    });

    it('should resolve universal conversation reactions without username', () => {
      const parsedUrl = new URL(
        'https://farcaster.xyz/~/conversations/123456/reactions',
      );
      expect(
        resolveUniversalLink({
          url: parsedUrl.href,
          pathname: parsedUrl.pathname,
          searchParams: parsedUrl.searchParams,
        }),
      ).toEqual({
        name: 'CastReactionUsers',
        params: {
          castHash: '123456',
          headerTitle: 'Cast reactions',
        },
        type: 'push',
      });
    });

    it('should resolve universal conversation recasts with username', () => {
      const parsedUrl = new URL('https://farcaster.xyz/dwr/123/recasts');
      expect(
        resolveUniversalLink({
          url: parsedUrl.href,
          pathname: parsedUrl.pathname,
          searchParams: parsedUrl.searchParams,
        }),
      ).toEqual({
        name: 'CastRecastUsers',
        params: {
          username: 'dwr',
          castHashPrefix: '123',
        },
        type: 'push',
      });
    });

    it('should resolve universal conversation recasts without username', () => {
      const parsedUrl = new URL(
        'https://farcaster.xyz/~/conversations/123456/recasts',
      );
      expect(
        resolveUniversalLink({
          url: parsedUrl.href,
          pathname: parsedUrl.pathname,
          searchParams: parsedUrl.searchParams,
        }),
      ).toEqual({
        name: 'CastRecastUsers',
        params: {
          castHash: '123456',
        },
        type: 'push',
      });
    });
  });

  it('should resolve universal followers with username', () => {
    const parsedUrl = new URL('https://farcaster.xyz/dwr/followers');
    expect(
      resolveUniversalLink({
        url: parsedUrl.href,
        pathname: parsedUrl.pathname,
        searchParams: parsedUrl.searchParams,
      }),
    ).toEqual({
      name: 'Follows',
      params: {
        username: 'dwr',
        initialTab: 'followers',
      },
      type: 'push',
    });
  });

  it('should resolve universal followers without username', () => {
    const parsedUrl = new URL('https://farcaster.xyz/~/profiles/3/followers');
    expect(
      resolveUniversalLink({
        url: parsedUrl.href,
        pathname: parsedUrl.pathname,
        searchParams: parsedUrl.searchParams,
      }),
    ).toEqual({
      name: 'Follows',
      params: {
        fid: 3,
        initialTab: 'followers',
      },
      type: 'push',
    });
  });

  it('should resolve universal storage settings', () => {
    const parsedUrl = new URL('https://farcaster.xyz/~/settings/storage');
    expect(
      resolveUniversalLink({
        url: parsedUrl.href,
        pathname: parsedUrl.pathname,
        searchParams: parsedUrl.searchParams,
      }),
    ).toEqual({
      name: 'Storage',
      params: {},
      type: 'push',
    });
  });

  it('should resolve universal following with username', () => {
    const parsedUrl = new URL('https://farcaster.xyz/dwr/following');
    expect(
      resolveUniversalLink({
        url: parsedUrl.href,
        pathname: parsedUrl.pathname,
        searchParams: parsedUrl.searchParams,
      }),
    ).toEqual({
      name: 'Follows',
      params: {
        username: 'dwr',
        initialTab: 'following',
      },
      type: 'push',
    });
  });

  it('should resolve universal following without username', () => {
    const parsedUrl = new URL('https://farcaster.xyz/~/profiles/3/following');
    expect(
      resolveUniversalLink({
        url: parsedUrl.href,
        pathname: parsedUrl.pathname,
        searchParams: parsedUrl.searchParams,
      }),
    ).toEqual({
      name: 'Follows',
      params: {
        fid: 3,
        initialTab: 'following',
      },
      type: 'push',
    });
  });

  it('should resolve universal channel', () => {
    const parsedUrl = new URL('https://farcaster.xyz/~/channel/memes');
    expect(
      resolveUniversalLink({
        url: parsedUrl.href,
        pathname: parsedUrl.pathname,
        searchParams: parsedUrl.searchParams,
      }),
    ).toEqual({
      name: 'Channel',
      params: { channelKey: 'memes' },
      type: 'navigate',
    });
  });

  it('should resolve universal channels explore', () => {
    const parsedUrl = new URL('https://farcaster.xyz/~/explore/channels');
    expect(
      resolveUniversalLink({
        url: parsedUrl.href,
        pathname: parsedUrl.pathname,
        searchParams: parsedUrl.searchParams,
      }),
    ).toEqual({
      name: 'Explore',
      params: {},
      type: 'navigate',
    });
  });

  it('should resolve universal sign in with farcaster', () => {
    const parsedUrl = new URL(
      'https://farcaster.xyz/~/sign-in-with-farcaster?connectToken=12345',
    );
    expect(
      resolveUniversalLink({
        url: parsedUrl.href,
        pathname: parsedUrl.pathname,
        searchParams: parsedUrl.searchParams,
      }),
    ).toEqual({
      name: 'SignInWithFarcaster',
      params: { signInUri: parsedUrl.href },
      type: 'push',
    });
  });

  it('should resolve universal sign in with farcaster v2', () => {
    const parsedUrl = new URL(
      'https://farcaster.xyz/~/siwf?connectToken=12345',
    );
    expect(
      resolveUniversalLink({
        url: parsedUrl.href,
        pathname: parsedUrl.pathname,
        searchParams: parsedUrl.searchParams,
      }),
    ).toEqual({
      name: 'SignInWithFarcaster',
      params: { signInUri: parsedUrl.href },
      type: 'push',
    });
  });

  describe('security: compose text sanitization', () => {
    it('strips control characters from compose text', () => {
      const parsedUrl = new URL(
        'https://farcaster.xyz/~/compose?text=hello%00world',
      );
      const result = resolveUniversalLink({
        url: parsedUrl.href,
        pathname: parsedUrl.pathname,
        searchParams: parsedUrl.searchParams,
      });
      expect(result).toBeTruthy();
      if (result && 'params' in result) {
        const intent = (
          result.params as { castComposerIntent?: { text?: string } }
        ).castComposerIntent;
        expect(intent?.text).not.toContain('\x00');
      }
    });

    it('caps compose text at 1024 characters', () => {
      const longText = 'a'.repeat(2000);
      const parsedUrl = new URL(
        `https://farcaster.xyz/~/compose?text=${encodeURIComponent(longText)}`,
      );
      const result = resolveUniversalLink({
        url: parsedUrl.href,
        pathname: parsedUrl.pathname,
        searchParams: parsedUrl.searchParams,
      });
      expect(result).toBeTruthy();
      if (result && 'params' in result) {
        const intent = (
          result.params as { castComposerIntent?: { text?: string } }
        ).castComposerIntent;
        expect(intent?.text?.length).toBeLessThanOrEqual(1024);
      }
    });
  });

  describe('security: mint URL validation', () => {
    it('accepts https mint URLs', () => {
      const parsedUrl = new URL(
        'https://farcaster.xyz/~/mint?url=https://zora.co/collect/123',
      );
      const result = resolveUniversalLink({
        url: parsedUrl.href,
        pathname: parsedUrl.pathname,
        searchParams: parsedUrl.searchParams,
      });
      expect(result).toBeTruthy();
    });

    it('rejects non-https mint URLs', () => {
      const parsedUrl = new URL(
        'https://farcaster.xyz/~/mint?url=http://evil.com',
      );
      const result = resolveUniversalLink({
        url: parsedUrl.href,
        pathname: parsedUrl.pathname,
        searchParams: parsedUrl.searchParams,
      });
      if (result && 'params' in result) {
        const feedParams = result.params as { mintPrompt?: { url?: string } };
        expect(feedParams.mintPrompt?.url).toBeUndefined();
      }
    });
  });

  describe('security: connect redirectUrl validation', () => {
    it('passes through valid https redirectUrl', () => {
      const parsedUrl = new URL(
        'https://farcaster.xyz/~/connect?token=abc123&redirectUrl=https://example.com/callback',
      );
      const result = resolveUniversalLink({
        url: parsedUrl.href,
        pathname: parsedUrl.pathname,
        searchParams: parsedUrl.searchParams,
      });
      expect(result).toBeTruthy();
      if (result && 'params' in result) {
        expect((result.params as { redirectUrl?: string }).redirectUrl).toBe(
          'https://example.com/callback',
        );
      }
    });

    it('blocks javascript: redirectUrl', () => {
      const parsedUrl = new URL(
        'https://farcaster.xyz/~/connect?token=abc123&redirectUrl=javascript:alert(1)',
      );
      const result = resolveUniversalLink({
        url: parsedUrl.href,
        pathname: parsedUrl.pathname,
        searchParams: parsedUrl.searchParams,
      });
      if (result && 'params' in result) {
        expect(
          (result.params as { redirectUrl?: string }).redirectUrl,
        ).toBeUndefined();
      }
    });

    it('blocks http: redirectUrl', () => {
      const parsedUrl = new URL(
        'https://farcaster.xyz/~/connect?token=abc123&redirectUrl=http://evil.com',
      );
      const result = resolveUniversalLink({
        url: parsedUrl.href,
        pathname: parsedUrl.pathname,
        searchParams: parsedUrl.searchParams,
      });
      if (result && 'params' in result) {
        expect(
          (result.params as { redirectUrl?: string }).redirectUrl,
        ).toBeUndefined();
      }
    });

    it('strips whitespace from redirectUrl before validating', () => {
      const searchParams = new URLSearchParams(
        'token=abc123&redirectUrl=  https://example.com/callback  ',
      );
      const result = resolveUniversalLink({
        url: 'https://farcaster.xyz/~/connect',
        pathname: '/~/connect',
        searchParams,
      });
      if (result && 'params' in result) {
        expect((result.params as { redirectUrl?: string }).redirectUrl).toBe(
          'https://example.com/callback',
        );
      }
    });
  });

  describe('security: recovery token and email validation', () => {
    it('accepts valid token and email for start-recovery', () => {
      const searchParams = new URLSearchParams(
        'token=abc-123_XYZ&email=user@example.com',
      );
      const result = resolveUnauthedUniversalLink({
        pathname: '/start-recovery',
        searchParams,
      });
      expect(result).toBeTruthy();
      if (result && 'params' in result) {
        expect((result.params as { token?: string }).token).toBe('abc-123_XYZ');
        expect((result.params as { email?: string }).email).toBe(
          'user@example.com',
        );
      }
    });

    it('rejects token that is too short', () => {
      const searchParams = new URLSearchParams(
        'token=short&email=user@example.com',
      );
      const result = resolveUnauthedUniversalLink({
        pathname: '/start-recovery',
        searchParams,
      });
      if (result && 'params' in result) {
        expect((result.params as { token?: string }).token).toBeUndefined();
      }
    });

    it('rejects token with invalid characters', () => {
      const searchParams = new URLSearchParams(
        'token=<script>alert(1)</script>&email=user@example.com',
      );
      const result = resolveUnauthedUniversalLink({
        pathname: '/start-recovery',
        searchParams,
      });
      if (result && 'params' in result) {
        expect((result.params as { token?: string }).token).toBeUndefined();
      }
    });

    it('rejects invalid email for recovery', () => {
      const searchParams = new URLSearchParams('email=notanemail');
      const result = resolveUnauthedUniversalLink({
        pathname: '/recovery',
        searchParams,
      });
      if (result && 'params' in result) {
        expect((result.params as { email?: string }).email).toBeUndefined();
      }
    });
  });

  it('should resolve universal direct cast conversation', () => {
    const parsedUrl = new URL('https://farcaster.xyz/~/inbox/123');
    expect(
      resolveUniversalLink({
        url: parsedUrl.href,
        pathname: parsedUrl.pathname,
        searchParams: parsedUrl.searchParams,
      }),
    ).toEqual({
      name: 'PlaintextDirectCastsConversation',
      params: {
        conversationId: '123',
        create: false,
        intentText: undefined,
      },
      type: 'navigate',
    });
  });
});
