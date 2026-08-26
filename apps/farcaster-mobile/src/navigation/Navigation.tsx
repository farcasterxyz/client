import { DdRumReactNavigationTracking } from '@datadog/mobile-react-navigation';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import {
  SharedUserAppContextProvider,
  UnfocusInputsProvider,
  WalletActionPreviewModal,
  WalletFeaturesProvider,
} from 'farcaster-expo';
import React, { FC, memo, useEffect, useMemo, useState } from 'react';
import { Linking, View } from 'react-native';

import { AnalyticsRouteWriter } from '~/components/AnalyticsRouteWriter';
import { BlurOverlay } from '~/components/BlurOverlay/BlurOverlay';
import { FloatingComposerButton } from '~/components/FloatingComposerButton';
import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { MiniApp } from '~/components/MiniApp/MiniApp';
import { AppStoreUpdatePrompt } from '~/components/prompts/AppStoreUpdatePrompt';
import { SnapLiftPortal } from '~/components/Snap/SnapLiftPortal';
import { clearActiveSnapLift } from '~/components/Snap/snapLiftState';
import { CreateCastComposerProvider } from '~/contexts/CreateCastComposerProvider';
import { DrawerNavigationHolderProvider } from '~/contexts/DrawerNavigationHolderProvider';
import { DrawerProvider } from '~/contexts/DrawerProvider';
import { ManageDirectCastConversationProvider } from '~/contexts/ManageDirectCastConversationProvider';
import { MinimizedInAppBrowserProvider } from '~/contexts/MinimizedInAppBrowserProvider';
import { MinimizedMiniAppProvider } from '~/contexts/MinimizedMiniAppProvider';
import { MuteUserProvider } from '~/contexts/MuteUserProvider';
import { NavigationMethodsProvider } from '~/contexts/NavigationMethodsProvider';
import { PayUserProvider } from '~/contexts/PayUserProvider';
import { RemoteSiwfRequestProvider } from '~/contexts/RemoteSiwfRequestProvider';
import { SharedNavigationProvider } from '~/contexts/SharedNavigationProvider';
import { NavAwareSharedTelemetryProvider } from '~/contexts/SharedTelemetryProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { getRumViewName } from '~/hooks/datadog/rumViewName';
import { useHandlePushNotification } from '~/hooks/navigation/useHandlePushNotification';
import { usePushNotificationsTokensChangedListeners } from '~/hooks/usePushNotificationsTokensChangedListeners';
import { useUserAppContextGate } from '~/hooks/useUserAppContextGate';
import { PlaintextDirectCastComposerImagePreview } from '~/screens/PlaintextDirectCastsConversation/PlaintextDirectCastComposerImagePreview';
import { PlaintextDirectCastComposerVideoPreview } from '~/screens/PlaintextDirectCastsConversation/PlaintextDirectCastComposerVideoPreview';
import { FullParamList } from '~/types';
import { useLogErrors } from '~/utils/ErrorUtils';

import { DeepLinkHandler } from './DeepLinkHandler';
import { navigationRef } from './navigationRef';
import { Prompts } from './Prompts';
import { RootNativeStack } from './RootNativeStack';

const PERSISTENCE_KEY = 'NAVIGATION_STATE_V1';

// Lazy so the WebView + browser modules aren't loaded until the user
// actually opens the in-app browser.
const LazyInAppBrowserSurface = React.lazy(() =>
  import('~/screens/InAppBrowser/InAppBrowserScreen').then((m) => ({
    default: m.InAppBrowserSurface,
  })),
);

function PushNotificationBoundary({ children }: { children: React.ReactNode }) {
  // We handle push notifications in the navigation boundary
  // So that we can open mini apps from push notifications.
  useHandlePushNotification(navigationRef);
  useLogErrors({ navigationRef });
  return <>{children}</>;
}

const Navigation: FC = memo(() => {
  const isSignedIn = useIsSignedIn();
  const t = useTheme();

  const { checkUserAppContextGate } = useUserAppContextGate();
  const walletFeatures = useMemo(
    () => ({
      walletExport: true,
      walletOnRamp: checkUserAppContextGate('wallet-onramp').value,
    }),
    [checkUserAppContextGate],
  );

  usePushNotificationsTokensChangedListeners();

  const [isReady, setIsReady] = useState(false);
  const [initialState, setInitialState] = useState();

  const restoreState = React.useCallback(async () => {
    if (!isReady) {
      try {
        const initialUrl = await Linking.getInitialURL();
        const skip = true;

        if (!skip && initialUrl === null) {
          // Only restore state if there's no deep link
          const savedStateString = await AsyncStorage.getItem(PERSISTENCE_KEY);
          const state = savedStateString
            ? JSON.parse(savedStateString)
            : undefined;

          if (state !== undefined) {
            setInitialState(state);
          }
        }
      } finally {
        setIsReady(true);
      }
    }
  }, [isReady]);

  useEffect(() => {
    if (!isReady) {
      restoreState();
    }
  }, [isReady, restoreState]);

  useEffect(() => {
    return () => {
      DdRumReactNavigationTracking.stopTrackingViews(navigationRef.current);
    };
  }, []);

  if (!isSignedIn && !isReady) {
    return (
      <View style={[t.flex1, t.bgDefault]}>
        <FullScreenLoadingIndicator debugName="Navigation" />
      </View>
    );
  }

  return (
    // Note that we wrap the NavigationContainer with a fullscreen view
    // of the same background to avoid white flickers when navigating
    // between stacks (e.g. after importing an account).
    // https://stackoverflow.com/a/61631989
    <View style={[t.flex1, t.bgDefault]}>
      <SnapLiftPortal.Provider>
        <NavigationContainer<FullParamList>
          theme={{
            dark: t.dark,
            colors: {
              primary: t.colors.minsk,
              background: t.colors.bgDefault,
              card: t.colors.bgDefault,
              text: t.colors.text.primary,
              border: t.colors.borderDefault,
              notification: t.colors.minsk,
            },
            fonts: DefaultTheme.fonts,
          }}
          ref={navigationRef}
          initialState={isSignedIn ? undefined : initialState}
          onStateChange={(state) => {
            clearActiveSnapLift();

            // We do not want to restore navigation state once a user is logged
            // in. Additionally, our authenticated stack includes
            // non-serializable params. Clear the state once a user is fully
            // signed in to avoid warnings.
            if (isSignedIn) {
              AsyncStorage.removeItem(PERSISTENCE_KEY);
            } else {
              AsyncStorage.setItem(PERSISTENCE_KEY, JSON.stringify(state));
            }
          }}
          onReady={() => {
            DdRumReactNavigationTracking.startTrackingViews(
              navigationRef.current,
              { viewNamePredicate: getRumViewName },
            );
          }}
          navigationInChildEnabled
        >
          <AnalyticsRouteWriter />
          <NavAwareSharedTelemetryProvider>
            <CreateCastComposerProvider navigationRef={navigationRef}>
              <NavigationMethodsProvider navigationRef={navigationRef}>
                <SharedNavigationProvider>
                  <BottomSheetModalProvider>
                    <UnfocusInputsProvider>
                      <WalletFeaturesProvider
                        supportedFeatures={walletFeatures}
                      >
                        <SharedUserAppContextProvider>
                          <MinimizedMiniAppProvider MiniAppComponent={MiniApp}>
                            <MinimizedInAppBrowserProvider
                              InAppBrowserComponent={LazyInAppBrowserSurface}
                            >
                              <RemoteSiwfRequestProvider>
                                <MuteUserProvider>
                                  <PayUserProvider>
                                    <ManageDirectCastConversationProvider>
                                      <DrawerNavigationHolderProvider>
                                        <DrawerProvider>
                                          <DeepLinkHandler
                                            navigationRef={navigationRef}
                                          />
                                          <PushNotificationBoundary>
                                            <RootNativeStack />
                                          </PushNotificationBoundary>
                                        </DrawerProvider>
                                      </DrawerNavigationHolderProvider>
                                    </ManageDirectCastConversationProvider>
                                  </PayUserProvider>
                                </MuteUserProvider>
                              </RemoteSiwfRequestProvider>
                              {/* Global prompts that we want to block accessing the bottom nav - these have to be positioned next to Navigator */}
                              <Prompts />
                              <AppStoreUpdatePrompt />
                              {/* Global overlays */}
                              {isSignedIn && (
                                <>
                                  <PlaintextDirectCastComposerImagePreview />
                                  <PlaintextDirectCastComposerVideoPreview />
                                </>
                              )}

                              <BlurOverlay />
                              <SnapLiftPortal.Outlet />
                              <FloatingComposerButton backgroundedOnly />
                            </MinimizedInAppBrowserProvider>
                          </MinimizedMiniAppProvider>
                        </SharedUserAppContextProvider>
                      </WalletFeaturesProvider>
                    </UnfocusInputsProvider>
                    <WalletActionPreviewModal />
                  </BottomSheetModalProvider>
                </SharedNavigationProvider>
              </NavigationMethodsProvider>
            </CreateCastComposerProvider>
          </NavAwareSharedTelemetryProvider>
        </NavigationContainer>
      </SnapLiftPortal.Provider>
    </View>
  );
});

Navigation.displayName = 'Navigation';

export { Navigation };
