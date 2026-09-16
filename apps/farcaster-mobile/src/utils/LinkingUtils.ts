import { openBrowserAsync } from 'expo-web-browser';
import { useCallback } from 'react';
import { Linking } from 'react-native';

import { MiniAppProps } from '~/components/MiniApp/types';
import {
  BrowserPreference,
  useBrowserPreference,
} from '~/contexts/BrowserPreferenceProvider';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import {
  InAppBrowserLaunchProps,
  useMinimizedInAppBrowser,
} from '~/contexts/MinimizedInAppBrowserProvider';
import { useMinimizedMiniApp } from '~/contexts/MinimizedMiniAppProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { usePush } from '~/hooks/navigation/usePush';
import { openInstalledAppForUrl } from '~/modules';
import { getWarpcastParsedUrl } from '~/utils/UrlUtils';

import { resolveUniversalLink } from './DeepLinkUtils';

const usePossiblyNavigateOrOpenUrl = () => {
  const push = usePush();
  const navigate = useNavigate();
  const { showGlobalPrompt } = useGlobalPrompts();
  const { setOpenMiniApp } = useMinimizedMiniApp({ optional: true });
  const { setOpenInAppBrowser } = useMinimizedInAppBrowser({ optional: true });

  const { browserPreference } = useBrowserPreference();

  return useCallback(
    ({
      url,
      openExternalInBrowser = true,
      openExternalTarget,
      navMethod,
    }: {
      url: string;
      openExternalInBrowser?: boolean;
      openExternalTarget?: 'system' | 'in_app_browser' | 'none';
      // override the default navigation method
      navMethod?: 'push' | 'navigate';
    }) => {
      void followUrl({
        url,
        push,
        showGlobalPrompt,
        setOpenMiniApp,
        setOpenInAppBrowser,
        navigate,
        openExternalInBrowser,
        openExternalTarget,
        navMethod,
        browserPreference,
      });
    },
    [
      browserPreference,
      navigate,
      push,
      setOpenInAppBrowser,
      setOpenMiniApp,
      showGlobalPrompt,
    ],
  );
};

// Generic handler that follows an URL whether it's a deep link or external.
// Params push/navigate need to be the functions returned by usePush/useNavigate.
// By default opens non-deep links based on the user's browser preference.
const followUrl = async ({
  url,
  push,
  navigate,
  showGlobalPrompt,
  setOpenMiniApp,
  setOpenInAppBrowser,
  openExternalInBrowser = true,
  openExternalTarget,
  navMethod,
  browserPreference,
}: {
  url: string;
  push: ReturnType<typeof usePush>;
  navigate: ReturnType<typeof useNavigate>;
  showGlobalPrompt: ReturnType<typeof useGlobalPrompts>['showGlobalPrompt'];
  setOpenMiniApp: (params: MiniAppProps | undefined) => void;
  setOpenInAppBrowser: (params: InAppBrowserLaunchProps | undefined) => void;
  openExternalInBrowser?: boolean;
  openExternalTarget?: 'system' | 'in_app_browser' | 'none';
  // override the default navigation method
  navMethod?: 'push' | 'navigate';
  browserPreference: BrowserPreference;
}) => {
  const warpcastUrl = getWarpcastParsedUrl(url);

  if (warpcastUrl) {
    const universalLinkResult = resolveUniversalLink({
      url: warpcastUrl.href,
      pathname: warpcastUrl.pathname,
      searchParams: warpcastUrl.searchParams,
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
        const pushOrNavigate =
          (navMethod ?? universalLinkResult.type) === 'push' ? push : navigate;
        return pushOrNavigate(
          universalLinkResult.name,
          universalLinkResult.params,
        );
      }
      return;
    }
  }

  let target:
    | 'custom_webview'
    | 'in_app_system_browser'
    | 'external_system'
    | 'none' = 'none';

  if (openExternalTarget === 'in_app_browser') {
    target = 'custom_webview';
  } else if (openExternalTarget === 'system') {
    target = 'external_system';
  } else if (openExternalTarget === 'none') {
    target = 'none';
  } else if (openExternalInBrowser) {
    target =
      browserPreference === BrowserPreference.SYSTEM
        ? 'external_system'
        : 'in_app_system_browser';
  }

  if (target === 'custom_webview') {
    setOpenInAppBrowser({ url, source: 'linking-fallback' });
    return;
  }

  if (target === 'in_app_system_browser') {
    if (await openInstalledAppForUrl(url)) {
      return;
    }

    if (/^https?:\/\//i.test(url)) {
      void openBrowserAsync(url, {
        dismissButtonStyle: 'close',
      });
    } else {
      void Linking.openURL(url);
    }
    return;
  }

  if (target === 'external_system') {
    void Linking.openURL(url);
    return;
  }
};

const useOpenInAppBrowser = () => {
  const open = usePossiblyNavigateOrOpenUrl();
  return useCallback(
    ({ url }: { url: string }) =>
      open({
        url,
        openExternalTarget: 'in_app_browser',
      }),
    [open],
  );
};

export { usePossiblyNavigateOrOpenUrl };
export { useOpenInAppBrowser };
