import { handleResponse } from '@coinbase/wallet-mobile-sdk';
import {
  CommonActions,
  NavigationContainerRefWithCurrent,
  StackActions,
} from '@react-navigation/native';
import { openBrowserAsync } from 'expo-web-browser';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  NavigatorNotReadyForDeepLinkError,
  useInvalidateVerifications,
  useRefreshOnboardingState,
} from 'farcaster-client-hooks';
import { useCallback, useEffect, useRef } from 'react';
import { Linking, Platform } from 'react-native';

import {
  getLoginChannelIdFromUrl,
  getLoginChannelIdFromUrlWithSource,
  utmCampaignParam,
  utmMediumParam,
} from '~/constants/Params';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { useMinimizedInAppBrowser } from '~/contexts/MinimizedInAppBrowserProvider';
import { useMinimizedMiniApp } from '~/contexts/MinimizedMiniAppProvider';
import { useNavigationHistory } from '~/contexts/NavigationHistoryProvider';
import { useIsAdmin } from '~/hooks/data/useIsAdmin';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { BottomTabName, FullParamList, ScreenName } from '~/types';
import {
  isValidHttpsUrl,
  resolveExternalUrl,
  resolveUnauthedUniversalLink,
  resolveUniversalLink,
  resolveWebOnlyRoute,
} from '~/utils/DeepLinkUtils';
import { isEmailValid } from '~/utils/EmailUtils';
import { trackError } from '~/utils/ErrorUtils';
import { logInDevOnly } from '~/utils/LogUtils';
import { sleep } from '~/utils/PromiseUtils';
import { parseUrl } from '~/utils/UrlUtils';

const waitForNavigatorInterval = 500;
// Cold start in dev-client mode can take several seconds before navigation is ready.
// Give deep links enough time so they are not dropped during startup.
const maxWaitForNavigatorAttempts = 40;

const useHandleDeepLink = (
  navigationRefProp: NavigationContainerRefWithCurrent<FullParamList>,
) => {
  const isSignedIn = useIsSignedIn();
  const isAdmin = useIsAdmin();
  const refreshOnboardingState = useRefreshOnboardingState();
  const invalidateVerifications = useInvalidateVerifications();

  // We maintain a ref that is always synchronized with the latest prop value,
  // because this hook (i.e. `useHandleDeepLink`) can be called with a different
  // navigator reference whenever the host component (i.e. `Navigation`) rerenders.
  // Because the `onDeepLink` function is asynchronous (e.g. in some cases waiting
  // for an API request), it would be possible for `navigationRefProp` to be stale,
  // because the async function would be using the closure's value, rather than the
  // most recent prop. By creating a ref (i.e. `navigationRef`) that is always
  // kept synchronized with the latest `navigationRefProp`, we can know that
  // our logic in `onDeepLink` is always using the active navigator.
  const navigationRef = useRef(navigationRefProp);
  navigationRef.current = navigationRefProp;

  const { trackEvent } = useAnalytics();
  const { trackNavigationEvent } = useNavigationHistory();
  const { showGlobalPrompt } = useGlobalPrompts();
  const { setOpenMiniApp, minimizeMiniApp } = useMinimizedMiniApp();
  const { setOpenInAppBrowser } = useMinimizedInAppBrowser();

  const minimizeMiniAppHandled = useCallback(() => {
    if (typeof minimizeMiniApp === 'undefined' || minimizeMiniApp === null) {
      return;
    }

    try {
      minimizeMiniApp();
    } catch {
      return;
    }
  }, [minimizeMiniApp]);

  const onDeepLink = useCallback(
    async ({ url: rawUrl }: { url: string }) => {
      // Android sometimes delivers VIEW intents with trailing CR/LF or spaces — breaks URL parsing.
      const url = rawUrl.trim();

      logInDevOnly(`onDeepLink triggered with ${url}`);

      const handledBySdk = handleResponse(new URL(url));
      if (handledBySdk) {
        logInDevOnly(`handled by Coinbase sdk`);
        return;
      }

      const cleanUrl = url.replace('/deeplinks', '');

      const parsedUrl = parseUrl(
        cleanUrl.replace(/farcaster:\/\//gi, 'https://farcaster.xyz/'),
      );

      if (!parsedUrl) {
        return;
      }

      // Always minimize the mini app on deeplinks instead of trying to handle each
      // case below. If we are getting a deeplink that means developers did not use
      // the expected `openUrl` SDK action. There is no scenario in which we want
      // mini app to overlay after a deeplink on our app.
      minimizeMiniAppHandled();

      // On Android, give the BottomSheet's forceClose a frame to tear down
      // its gesture-intercepting backdrop before we push a new screen.
      // Without this, the new screen can render underneath the stale
      // backdrop, making it appear unresponsive.
      if (Platform.OS === 'android') {
        await sleep(100);
      }

      // Web-only routes (e.g. payment flows that require a desktop browser).
      // Guard runs before the analytics event so credential-bearing query
      // params are never recorded.
      if (resolveWebOnlyRoute(parsedUrl.pathname)) {
        if (Platform.OS === 'ios') {
          // iOS opens an app's own universal link in the default browser
          // instead of re-entering the app.
          return Linking.openURL(parsedUrl.href);
        }
        // On Android, openURL would route straight back into the app because
        // the intent filter covers the whole host. A custom tab does not go
        // through intent resolution, so it cannot loop.
        await openBrowserAsync(parsedUrl.href);
        return;
      }

      // Web-initiated magic links (source=web) must complete in the browser so
      // the user is logged into the web app, not the mobile app. On iOS the
      // AASA already excludes /magic-link so the OS never hands this to us via
      // universal links; this guard handles the Android case where the blanket
      // farcaster.xyz intent filter intercepts every path regardless of source.
      if (
        parsedUrl.pathname === '/magic-link' &&
        parsedUrl.searchParams.get('source') === 'web'
      ) {
        if (Platform.OS === 'ios') {
          return Linking.openURL(parsedUrl.href);
        }
        await openBrowserAsync(parsedUrl.href);
        return;
      }

      trackEvent(AnalyticsEvent.OpenDeepLink, {
        utm_medium: parsedUrl.searchParams.get(utmMediumParam) || 'unknown',
        utm_campaign: parsedUrl.searchParams.get(utmCampaignParam) || 'unknown',
        client: Platform.OS,
        is_signed_in: isSignedIn,
        path: parsedUrl.pathname,
      });

      const waitForNavigator = async () => {
        let waitForNavigatorAttempts = 0;

        while (
          !navigationRef.current.isReady() &&
          waitForNavigatorAttempts++ < maxWaitForNavigatorAttempts
        ) {
          await sleep(waitForNavigatorInterval);
        }

        if (!navigationRef.current.isReady()) {
          trackError(new NavigatorNotReadyForDeepLinkError({ url: cleanUrl }));
        }
      };

      const push = async <N extends ScreenName>(
        screen: N,
        params: FullParamList[N],
      ) => {
        // We need to once again ensure that the navigator is ready,
        // because we've waited for an async request and it's possible that the navigator ref is different.
        await waitForNavigator();

        trackNavigationEvent({
          type: 'push',
          name: screen,
          params,
          isFromDeepLink: true,
        });
        navigationRef.current.dispatch(StackActions.push(screen, params));
      };

      const navigate = async <N extends ScreenName>(
        screen: N,
        params: FullParamList[N],
      ) => {
        // We need to once again ensure that the navigator is ready,
        // because we've waited for an async request and it's possible that the navigator ref is different.
        await waitForNavigator();
        trackNavigationEvent({
          type: 'navigate',
          name: screen,
          params,
          isFromDeepLink: true,
        });
        navigationRef.current.dispatch(CommonActions.navigate(screen, params));
      };

      const navigateToNestedScreen = async <
        Tab extends BottomTabName,
        Screen extends ScreenName,
      >(
        tab: Tab,
        screen: Screen,
        params: FullParamList[Screen],
      ) => {
        await waitForNavigator();
        trackNavigationEvent({
          type: 'navigateToNestedScreen',
          tab,
          screen,
          params,
        });
        navigationRef.current.dispatch(
          CommonActions.navigate(tab, {
            screen,
            params,
            // Without initial:false, React Navigation v7 skips the tab's
            // initialRouteName when the tab is lazy and not yet mounted,
            // leaving the back stack with only the target screen. Setting
            // false forces getInitialState first so back always returns to
            // the tab's root (e.g. DM inbox).
            initial: false,
          }),
        );
      };

      if (parsedUrl.pathname.match(/\/wallet-connected$/i)) {
        const onboardingState = await refreshOnboardingState();

        if (!onboardingState.result.state.hasCompletedRegistration) {
          return push('Onboarding', { error: undefined });
        } else {
          invalidateVerifications({ fid: undefined });

          return navigate('ConnectedAddresses' as ScreenName, {});
        }
      }

      // Sign in with QR Code from another mobile device
      const signInWithQRCodeMobileMatches =
        parsedUrl.pathname.match(/^\/login-mobile/);
      if (signInWithQRCodeMobileMatches) {
        const channelId = getLoginChannelIdFromUrl(parsedUrl);

        return push('OnboardingSignInAnotherDevice', {
          channelId,
          type: 'mobile',
        });
      }

      // Connect wallet to another device
      const signInWithQRCodeWalletMatches =
        parsedUrl.pathname.match(/^\/login-wallet/);
      if (signInWithQRCodeWalletMatches) {
        const channelId = getLoginChannelIdFromUrl(parsedUrl);
        const rawNonce = parsedUrl.searchParams.get('nonce');
        const rawExpiresAt = parsedUrl.searchParams.get('expires-at');

        return push('WalletSignInAnotherDevice', {
          channelId,
          nonce:
            rawNonce && /^[a-zA-Z0-9_-]{8,128}$/.test(rawNonce)
              ? rawNonce
              : null,
          expiresAt:
            rawExpiresAt && !isNaN(Date.parse(rawExpiresAt))
              ? rawExpiresAt
              : null,
        });
      }

      // Sign in with QR Code from web
      const signInWithQRCodeWebMatches =
        parsedUrl.pathname.match(/^\/login-web/);

      if (signInWithQRCodeWebMatches) {
        const { channelId, source } =
          getLoginChannelIdFromUrlWithSource(parsedUrl);

        if (source === 'href_regex') {
          trackEvent(AnalyticsEvent.LoginWebChannelIdHrefFallback, {
            channelIdPresent: Boolean(channelId),
          });
        }

        return push('OnboardingSignInAnotherDevice', {
          channelId,
          type: 'web',
        });
      }

      // Sign in with QR Code from another desktop device
      const signInWithQRCodeDesktopMatches =
        parsedUrl.pathname.match(/^\/login-desktop/);
      if (signInWithQRCodeDesktopMatches) {
        const channelId = getLoginChannelIdFromUrl(parsedUrl);

        return push('OnboardingSignInWithDesktopInitiate', {
          channelId,
        });
      }

      // Redundant farcaster scheme link to recoveries to support Android
      const recoveryStartMatches =
        parsedUrl.pathname.match(/^\/start-recovery/);
      if (recoveryStartMatches) {
        const rawToken = parsedUrl.searchParams.get('token');
        const rawEmail = parsedUrl.searchParams.get('email');

        return navigate('RecoveryStart', {
          token:
            rawToken && /^[a-zA-Z0-9_-]{8,256}$/.test(rawToken)
              ? rawToken
              : undefined,
          email: rawEmail && isEmailValid(rawEmail) ? rawEmail : undefined,
        });
      }

      // Redundant farcaster scheme link to recoveries to support Android
      const recoveryMatches = parsedUrl.pathname.match(/^\/recovery/);
      if (recoveryMatches) {
        const rawEmail = parsedUrl.searchParams.get('email');

        return navigate('RecoveryNotFound', {
          email: rawEmail && isEmailValid(rawEmail) ? rawEmail : undefined,
        });
      }

      const isInAppBrowserDeepLink =
        parsedUrl.hostname === 'in-app-browser' ||
        parsedUrl.pathname === '/in-app-browser' ||
        parsedUrl.pathname === '//in-app-browser';
      if (isInAppBrowserDeepLink) {
        if (!isAdmin) {
          logInDevOnly('ignoring in-app-browser deep link for non-admin user');
          return;
        }

        const rawInAppBrowserUrl =
          parsedUrl.searchParams.get('url') ??
          parsedUrl.searchParams.get('target') ??
          parsedUrl.searchParams.get('browserUrl');
        const inAppBrowserUrl = rawInAppBrowserUrl?.trim();

        if (inAppBrowserUrl && isValidHttpsUrl(inAppBrowserUrl)) {
          setOpenInAppBrowser({
            url: inAppBrowserUrl,
            source: 'manual',
          });
          return;
        }
      }

      const unauthedUniversalLinkResult = resolveUnauthedUniversalLink({
        pathname: parsedUrl.pathname,
        searchParams: parsedUrl.searchParams,
      });

      if (unauthedUniversalLinkResult) {
        if (unauthedUniversalLinkResult.type === 'prompt') {
          showGlobalPrompt({
            key: unauthedUniversalLinkResult.key,
            globalPromptData: unauthedUniversalLinkResult.globalPromptData,
          });
        } else if (unauthedUniversalLinkResult.type === 'mini_app') {
          setOpenMiniApp(unauthedUniversalLinkResult.props);
        } else {
          // MagicLinkSignIn is only valid for unauthenticated users. If the
          // user is already signed in, ignore the link rather than trying to
          // navigate to a screen that isn't mounted in the authed stack.
          if (
            unauthedUniversalLinkResult.name === 'MagicLinkSignIn' &&
            isSignedIn
          ) {
            return;
          }
          const pushOrNavigate =
            unauthedUniversalLinkResult.type === 'push' ? push : navigate;
          return pushOrNavigate(
            unauthedUniversalLinkResult.name,
            unauthedUniversalLinkResult.params,
          );
        }
      }

      const externalLinkResult = resolveExternalUrl(parsedUrl.pathname);
      if (externalLinkResult) {
        return Linking.openURL(parsedUrl.href);
      }

      if (!isSignedIn) {
        logInDevOnly('no unauthenticated deep link handlers matched');
        return;
      }

      const signedKeyRequestMatches =
        parsedUrl.pathname.match(/\/signed-key-request/);
      if (signedKeyRequestMatches) {
        const token = parsedUrl.searchParams.get('token') ?? '';
        const rawRedirectUrl = parsedUrl.searchParams.get('redirectUrl');
        const trimmedRedirectUrl = rawRedirectUrl?.trim();
        const redirectUrl =
          trimmedRedirectUrl && isValidHttpsUrl(trimmedRedirectUrl)
            ? trimmedRedirectUrl
            : undefined;

        return navigate('SignedKeyRequest', { token, redirectUrl });
      }

      const universalLinkResult = resolveUniversalLink({
        url: cleanUrl,
        pathname: parsedUrl.pathname,
        searchParams: parsedUrl.searchParams,
      });

      if (universalLinkResult) {
        if (universalLinkResult.type === 'prompt') {
          showGlobalPrompt({
            key: universalLinkResult.key,
            globalPromptData: universalLinkResult.globalPromptData,
          });
        } else if (universalLinkResult.type === 'mini_app') {
          setOpenMiniApp(universalLinkResult.props);
        } else {
          if (
            universalLinkResult.name === 'Spaces' ||
            universalLinkResult.name === 'SpaceRoom'
          ) {
            return navigateToNestedScreen(
              'HomeTab',
              universalLinkResult.name,
              universalLinkResult.params,
            );
          }
          if (universalLinkResult.type === 'push') {
            return push(
              universalLinkResult.name as ScreenName,
              universalLinkResult.params as never,
            );
          }
          return navigate(
            universalLinkResult.name as ScreenName,
            universalLinkResult.params as never,
          );
        }
      }
    },
    [
      invalidateVerifications,
      isSignedIn,
      isAdmin,
      minimizeMiniAppHandled,
      refreshOnboardingState,
      setOpenInAppBrowser,
      setOpenMiniApp,
      showGlobalPrompt,
      trackEvent,
      trackNavigationEvent,
    ],
  );

  useEffect(() => {
    (async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        onDeepLink({ url: initialUrl });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const linkingSubscription = Linking.addEventListener('url', onDeepLink);
    return () => {
      linkingSubscription.remove();
    };
  }, [onDeepLink]);
};

export { useHandleDeepLink };
