import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.farcaster.mobile';

/**
 * Builds a server-side redirect destination for login deep-link paths
 * (/login-web, /login-mobile, /login-wallet, /login-desktop).
 *
 * On Android, Chrome intercepts these URLs when App Links verification has
 * failed on a device.  We issue an intent:// URI so the OS hands off directly
 * to the Farcaster app, bypassing App Links entirely.  All original query
 * params (channel-id, nonce, expires-at, …) are forwarded verbatim so the
 * deep-link handler in the mobile app receives them intact.
 *
 * On iOS the farcaster:// custom scheme is a belt-and-suspenders fallback;
 * Universal Links normally intercept before the page loads.
 *
 * On desktop we redirect to /~/mobile which shows the existing QR/copy-link
 * UI and uses the `path` param convention that resolveOpenOnMobile expects.
 */
export function buildLoginAppRedirect(
  context: GetServerSidePropsContext,
  appPath: string,
): GetServerSidePropsResult<never> {
  const ua = context.req.headers['user-agent'] ?? '';
  const isAndroid = /android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);

  // Preserve all incoming query params for the app deep-link
  const rawQuery = context.req.url?.split('?')[1] ?? '';
  const qsPart = rawQuery ? `?${rawQuery}` : '';

  let destination: string;

  if (isAndroid) {
    const fallback = encodeURIComponent(PLAY_STORE_URL);
    destination = `intent://${appPath}${qsPart}#Intent;scheme=farcaster;package=com.farcaster.mobile;S.browser_fallback_url=${fallback};end`;
  } else if (isIOS) {
    destination = `farcaster://${appPath}${qsPart}`;
  } else {
    // Desktop: hand off to the existing OpenOnMobilePage QR/copy-link UI.
    // Append `path=<appPath>` so the page can show the right title and so
    // that resolveOpenOnMobile on the mobile app can handle it correctly.
    const params = new URLSearchParams(rawQuery || '');
    params.set('path', appPath);
    destination = `/~/mobile?${params.toString()}`;
  }

  return {
    redirect: {
      destination,
      permanent: false,
    },
  };
}
