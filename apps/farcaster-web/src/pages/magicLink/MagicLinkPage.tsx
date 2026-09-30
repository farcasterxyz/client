import { AnalyticsEvent } from 'farcaster-analytics';
import { useFarcasterApiClient } from 'farcaster-client-hooks';
import {
  FC,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useAuth } from '~/contexts/AuthProvider';

const MagicLinkPage: FC = memo(() => {
  const { trackEvent } = useAnalytics();
  const { apiClient } = useFarcasterApiClient();
  const { signIn } = useAuth();
  const [error, setError] = useState<string>();

  // Stable for the page's lifetime — URL does not change after load.
  // Computed inside the component so window/navigator are not accessed at module
  // load time (safe in test environments and any future SSR boundary).
  const searchParams = useMemo(
    () =>
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search)
        : new URLSearchParams(),
    [],
  );
  const token = searchParams.get('token');
  const address = searchParams.get('address');
  // 'web'    → initiated from the web app; complete in the browser, never open the app.
  // 'mobile' → initiated from the mobile app; prompt the user to open the app.
  // null     → old link without source (or any unexpected value); fall back to
  //            UA detection for compat.
  // Narrow at runtime rather than an unchecked `as` cast, so an unexpected
  // value (e.g. ?source=foo) is treated like a missing source instead of
  // silently taking the non-'web' prompt path.
  const rawSource = searchParams.get('source');
  const source: 'web' | 'mobile' | null =
    rawSource === 'web' || rawSource === 'mobile' ? rawSource : null;
  // Fallback UA check used only when `source` is absent from the URL (old links
  // that pre-date the source stamping). New links always carry source=web or
  // source=mobile set by the initiating client, so UA is never the primary signal.
  const isMobileBrowser = useMemo(
    () =>
      typeof navigator !== 'undefined' &&
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
    [],
  );

  // Show the "Open in Farcaster app" prompt when BOTH conditions hold:
  //   1. We are on a mobile browser (the app only runs on phones)
  //   2. The link was NOT web-initiated (source !== 'web')
  //
  // source=web   → always complete in the browser, even on a phone
  // source=mobile → show the prompt on phones; auto-complete on desktop
  // no source    → UA heuristic for backward compat with old links
  const showPromptInitially = isMobileBrowser && source !== 'web';
  const [showMobilePrompt, setShowMobilePrompt] = useState(showPromptInitially);

  const openInAppAttemptedRef = useRef(false);
  // Prevents completeWebFlow from firing more than once concurrently (e.g. the
  // 1500 ms timer racing with a "Continue in browser" tap). Reset to false on
  // API failure so the retry button can re-attempt.
  const completedRef = useRef(false);
  // Holds a cancel fn for the open-in-app timer + visibilitychange listener so
  // they are torn down if the component unmounts before the 1500 ms window closes.
  const openInAppCleanupRef = useRef<(() => void) | null>(null);
  // True when the app was opened but the user returned to the browser — show a
  // persistent "Continue in browser" fallback so they are never stuck.
  const [showBrowserFallback, setShowBrowserFallback] = useState(false);

  useEffect(() => {
    return () => {
      openInAppCleanupRef.current?.();
    };
  }, []);

  const completeWebFlow = useCallback(() => {
    if (completedRef.current) {
      return;
    }
    if (!apiClient || !signIn) {
      return;
    }
    if (!token || !address) {
      setError(
        'The sign-in link is invalid or has expired. Please request a new one.',
      );
      return;
    }
    completedRef.current = true;
    apiClient
      .completeMagicLink({ token, address })
      .then(async (resp) => {
        await signIn({ authToken: resp.data.result.token });
        trackEvent(AnalyticsEvent.LoggedInToWebUsingMagicLink, {});
        setTimeout(() => {
          // eslint-disable-next-line no-restricted-syntax
          window.location.href = '/';
        }, 500);
      })
      .catch(() => {
        // Reset so the retry button can re-attempt.
        completedRef.current = false;
        setError('An error has occurred. Please try again.');
      });
  }, [apiClient, signIn, token, address, trackEvent]);

  // Auto-complete in the browser whenever the prompt is not shown.
  // That means: desktop (any source) OR web-initiated on any device.
  // completedRef inside completeWebFlow prevents double-firing.
  useEffect(() => {
    if (showPromptInitially) {
      return;
    }
    if (!apiClient || !signIn) {
      return;
    }

    if (!token || !address) {
      setError(
        'The sign-in link is invalid or has expired. Please request a new one.',
      );
      return;
    }

    completeWebFlow();
  }, [apiClient, signIn, token, address, completeWebFlow, showPromptInitially]);

  // "Open in Farcaster app" — iOS requires a user gesture to navigate to a
  // custom URL scheme; auto-redirecting in a useEffect is silently blocked.
  const handleOpenInApp = useCallback(() => {
    if (!token || !address) {
      setError(
        'The sign-in link is invalid or has expired. Please request a new one.',
      );
      return;
    }
    if (openInAppAttemptedRef.current) {
      return;
    }
    openInAppAttemptedRef.current = true;
    setShowMobilePrompt(false);

    // eslint-disable-next-line no-restricted-syntax
    window.location.href = `farcaster://magic-link?token=${encodeURIComponent(token)}&address=${encodeURIComponent(address)}`;

    // Track whether the page was actually backgrounded. iOS Safari does NOT
    // reliably set document.hidden before a setTimeout fires when a custom
    // scheme is dispatched, so a visibilitychange listener is more reliable.
    let appDidOpen = false;
    const onVisibilityChange = () => {
      if (document.hidden) {
        appDidOpen = true;
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    const timerId = setTimeout(() => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      openInAppCleanupRef.current = null;
      if (!appDidOpen) {
        // App is not installed; fall back to completing in the browser.
        completeWebFlow();
      } else {
        // App opened but user returned to the browser (crash, old version,
        // or manual switch-back) — surface a fallback so they are not stuck.
        setShowBrowserFallback(true);
      }
    }, 1500);
    openInAppCleanupRef.current = () => {
      clearTimeout(timerId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [token, address, completeWebFlow]);

  return (
    <Page meta={{ title: 'Complete account login' }}>
      <BorderedMainContent>
        <PageHeader>
          <PageTitle>Account Login</PageTitle>
        </PageHeader>
        <div className="flex flex-col space-y-4 p-4">
          {error ? (
            <>
              <div>{error}</div>
              <button
                onClick={completeWebFlow}
                className="text-sm text-violet-600 underline"
              >
                Try again
              </button>
            </>
          ) : showBrowserFallback ? (
            <>
              <div>
                Couldn&apos;t complete sign-in in the app. You can finish here
                instead.
              </div>
              <button
                onClick={completeWebFlow}
                className="rounded-lg bg-violet-600 px-4 py-3 text-base font-semibold text-white"
              >
                Continue in browser
              </button>
            </>
          ) : showMobilePrompt ? (
            <>
              <div>Tap below to sign in with the Farcaster app.</div>
              <button
                onClick={handleOpenInApp}
                className="rounded-lg bg-violet-600 px-4 py-3 text-base font-semibold text-white"
              >
                Open in Farcaster app
              </button>
              <button
                onClick={() => {
                  setShowMobilePrompt(false);
                  completeWebFlow();
                }}
                className="text-sm text-gray-500 underline"
              >
                Continue in browser instead
              </button>
            </>
          ) : (
            <div>Logging you in...</div>
          )}
        </div>
      </BorderedMainContent>
    </Page>
  );
});

MagicLinkPage.displayName = 'MagicLinkPage';

export { MagicLinkPage };
