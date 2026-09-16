import React, { useCallback, useEffect, useMemo, useState } from 'react';
// eslint-disable-next-line no-restricted-imports
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { Page } from '~/components/page/Page';
import { appPathPrefix } from '~/constants/routePrefixes';
import { isAndroid, isIOS } from '~/utils/navigatorUtils';

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.farcaster.mobile';

/**
 * LoginRedirectToAppPage
 *
 * Handles the case where Android App Links verification failed on a device and
 * https://farcaster.xyz/login-web?channel-id=xxx opens in Chrome instead of
 * the Farcaster app directly.
 *
 * - Android: issues an intent:// URI so Chrome hands off to the app, with a
 *   Play Store fallback if the app is not installed.
 * - iOS / other mobile: redirects via the farcaster:// custom scheme (universal
 *   links handle this natively on most iOS devices, but the scheme acts as a
 *   belt-and-suspenders fallback).
 * - Desktop: redirects to OpenOnMobilePage (~/mobile) which shows a scannable
 *   QR code and copy-link UI, using the existing path param convention.
 */
const LoginRedirectToAppPage: React.FC = React.memo(() => {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Strip leading and trailing slashes to get e.g. "login-web"
  const appPath = pathname.replace(/^\/+|\/+$/g, '');

  // Desktop: hand off to the existing OpenOnMobilePage which renders a QR code
  // and copy-link UI. Pass all original params plus `path` so it can adapt
  // its title, and the mobile app's resolveOpenOnMobile can handle the result
  // when the QR is scanned.
  useEffect(() => {
    if (!isAndroid() && !isIOS()) {
      const params = new URLSearchParams(searchParams);
      params.set('path', appPath);
      navigate(`${appPathPrefix}/mobile?${params.toString()}`, {
        replace: true,
      });
    }
  }, [appPath, navigate, searchParams]);

  const deepLinkUrl = useMemo(() => {
    // Forward ALL incoming search params to the app deep link so paths like
    // /login-wallet that need extra params (nonce, expires-at) work correctly.
    const qs = searchParams.toString();
    const qsPart = qs ? `?${qs}` : '';

    if (isAndroid()) {
      // intent URI: Chrome will hand off to the Farcaster app if installed,
      // otherwise fall back to the Play Store.
      const fallback = encodeURIComponent(PLAY_STORE_URL);
      return `intent://${appPath}${qsPart}#Intent;scheme=farcaster;package=com.farcaster.mobile;S.browser_fallback_url=${fallback};end`;
    }

    // iOS and everything else — custom scheme works for universal-link fallback
    return `farcaster://${appPath}${qsPart}`;
  }, [appPath, searchParams]);

  const [didAttempt, setDidAttempt] = useState(false);

  const openApp = useCallback(() => {
    setDidAttempt(true);
    // Safety: deepLinkUrl is fully constructed from a hardcoded template
    // (intent:// on Android, farcaster:// on iOS). The appPath is always one
    // of 4 known literals routed by React Router — never user-controlled.
    // intent:// must not be added to the global isAllowedProtocol allowlist
    // because it can encode arbitrary Android intents; the safety guarantee
    // here comes from this page's constrained construction, not a global check.
    // eslint-disable-next-line no-restricted-syntax
    window.location.href = deepLinkUrl;
  }, [deepLinkUrl]);

  // Auto-redirect as soon as the page mounts on mobile
  useEffect(() => {
    if (isAndroid() || isIOS()) {
      openApp();
    }
  }, [openApp]);

  // Desktop users are redirected above — render nothing while navigating
  if (!isAndroid() && !isIOS()) {
    return null;
  }

  return (
    <Page meta={{ title: 'Opening Farcaster...' }}>
      <div className="flex min-h-dvh flex-col items-center justify-center px-4">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="text-2xl font-semibold text-default">
            Opening Farcaster&hellip;
          </div>
          <div className="text-muted">
            {didAttempt
              ? 'If Farcaster did not open, tap the button below.'
              : 'Redirecting you to the Farcaster app.'}
          </div>
          <DefaultButton variant="normal" onClick={openApp}>
            Open in Farcaster
          </DefaultButton>
        </div>
      </div>
    </Page>
  );
});

LoginRedirectToAppPage.displayName = 'LoginRedirectToAppPage';

export { LoginRedirectToAppPage };
