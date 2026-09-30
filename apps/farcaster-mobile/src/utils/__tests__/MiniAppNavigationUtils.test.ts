import {
  getMiniAppOpenWindowUrl,
  shouldKeepMiniAppNavigationInContext,
} from '../MiniAppNavigationUtils';

describe('shouldKeepMiniAppNavigationInContext', () => {
  it('keeps Farbits www/apex navigation in the mini-app context', () => {
    expect(
      shouldKeepMiniAppNavigationInContext({
        appDomain: 'lilbits.fun',
        url: 'https://www.lilbits.fun/',
      }),
    ).toBe(true);
    expect(
      shouldKeepMiniAppNavigationInContext({
        appDomain: 'www.lilbits.fun',
        url: 'https://lilbits.fun/',
      }),
    ).toBe(true);
  });

  it('keeps Apostles routes in the mini-app context', () => {
    expect(
      shouldKeepMiniAppNavigationInContext({
        appDomain: 'theapostles.xyz',
        url: 'https://theapostles.xyz/leaderboard',
      }),
    ).toBe(true);
  });

  it('keeps same-domain mini-app navigation in context', () => {
    expect(
      shouldKeepMiniAppNavigationInContext({
        appDomain: 'lilbits.fun',
        url: 'https://lilbits.fun/mine',
      }),
    ).toBe(true);
  });

  it('routes insecure same-domain navigation out of the production mini-app context', () => {
    expect(
      shouldKeepMiniAppNavigationInContext({
        appDomain: 'lilbits.fun',
        url: 'http://lilbits.fun/mine',
      }),
    ).toBe(false);
  });

  it('allows insecure same-domain navigation in debug mini-app context', () => {
    expect(
      shouldKeepMiniAppNavigationInContext({
        allowInsecure: true,
        appDomain: 'localhost',
        url: 'http://localhost:3000/debug',
      }),
    ).toBe(true);
  });

  it('keeps www/apex variants in context', () => {
    expect(
      shouldKeepMiniAppNavigationInContext({
        appDomain: 'lilbits.fun',
        url: 'https://www.lilbits.fun/',
      }),
    ).toBe(true);
    expect(
      shouldKeepMiniAppNavigationInContext({
        appDomain: 'www.lilbits.fun',
        url: 'https://lilbits.fun/',
      }),
    ).toBe(true);
  });

  it('keeps app-owned subdomains in context', () => {
    expect(
      shouldKeepMiniAppNavigationInContext({
        appDomain: 'lilbits.fun',
        url: 'https://auth.lilbits.fun/callback',
      }),
    ).toBe(true);
  });

  it('routes unrelated domains out of the mini-app context', () => {
    expect(
      shouldKeepMiniAppNavigationInContext({
        appDomain: 'lilbits.fun',
        url: 'https://example.com/',
      }),
    ).toBe(false);
  });

  it('does not treat suffix attacks as app-owned subdomains', () => {
    expect(
      shouldKeepMiniAppNavigationInContext({
        appDomain: 'lilbits.fun',
        url: 'https://evil-lilbits.fun/',
      }),
    ).toBe(false);
  });

  it('routes external links from Apostles out of the mini-app context', () => {
    expect(
      shouldKeepMiniAppNavigationInContext({
        appDomain: 'theapostles.xyz',
        url: 'https://farcaster.xyz/jesus',
      }),
    ).toBe(false);
  });
});

describe('getMiniAppOpenWindowUrl', () => {
  it('routes explicit new-window links externally even for app-owned domains', () => {
    expect(getMiniAppOpenWindowUrl('https://staging.thefirm.biz/debug')).toBe(
      'https://staging.thefirm.biz/debug',
    );
  });

  it('ignores blank new-window placeholder URLs', () => {
    expect(getMiniAppOpenWindowUrl()).toBeUndefined();
    expect(getMiniAppOpenWindowUrl('about:blank')).toBeUndefined();
  });
});
