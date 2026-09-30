import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { PubSubProvider } from 'farcaster-client-hooks';
import {
  PublicClientProvider,
  ToastProvider,
  WagmiProvider,
} from 'farcaster-expo';
import React, { FC, memo, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { SystemBars } from 'react-native-edge-to-edge';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnalyticsClientProvider } from '~/contexts/AnalyticsClientProvider';
import { AppDataPreloader } from '~/contexts/AppDataPreloader';
import { AppSessionProvider } from '~/contexts/AppSessionProvider';
import { AuthTokenProvider } from '~/contexts/AuthTokenProvider';
import { BlurOverlayProvider } from '~/contexts/BlurOverlayProvider';
import { BottomTabProvider } from '~/contexts/BottomTabProvider';
import { BrowserPreferenceProvider } from '~/contexts/BrowserPreferenceProvider';
import { CheckForOverTheAirUpdateProvider } from '~/contexts/CheckForOverTheAirUpdateProvider';
import { ComposerOptimisticImagesProvider } from '~/contexts/ComposerOptimisticImagesProvider';
import { ConnectionStatusProvider } from '~/contexts/ConnectionStatusProvider';
import { ContactsLocalCacheBusterProvider } from '~/contexts/ContactsLocalCacheBusterProvider';
import { WrappedDatadogProvider } from '~/contexts/DatadogProvider';
import { DataSaverProvider } from '~/contexts/DataSaverProvider';
import { DebugCryptographyProvider } from '~/contexts/DebugCryptographyProvider';
import { DebugLogsProvider } from '~/contexts/DebugLogsProvider';
import { DeviceProvider } from '~/contexts/DeviceProvider';
import { EarlySplashDismissProvider } from '~/contexts/EarlySplashDismissProvider';
import { ErrorHistoryProvider } from '~/contexts/ErrorHistoryProvider';
import { FileSystemCacheBusterProvider } from '~/contexts/FileSystemCacheBusterProvider';
import { FocusedScreenProvider } from '~/contexts/FocusedScreenProvider';
import { FrameTransactionsPromptsProvider } from '~/contexts/FrameTransactionsBlowfishCautionProvider';
import { GiftWarpsSelectedUserProvider } from '~/contexts/GiftWarpsSelectedUserProvider';
import { GlobalPromptsProvider } from '~/contexts/GlobalPromptsProvider';
import { HeaderProvider } from '~/contexts/HeaderProvider';
import { InAppPurchasesProvider } from '~/contexts/InAppPurchasesProvider';
import { LightboxProvider } from '~/contexts/LightboxProvider';
import { LocalStorageProvider } from '~/contexts/LocalStorageProvider';
import { MemoryWarningHandler } from '~/contexts/MemoryWarningHandler';
import {
  MobileEmbeddedWalletProvider,
  PrimaryPrivyProviderRoot,
} from '~/contexts/MobileEmbeddedWalletProvider';
import { MobileFarcasterApiClientProvider } from '~/contexts/MobileFarcasterApiClientProvider';
import { MWPWalletProvider } from '~/contexts/MWPWalletProvider';
import { NavigationHistoryProvider } from '~/contexts/NavigationHistoryProvider';
// INCIDENT-RELATED TEMPORARY CODE (no-custody-wallet restore prompt) — remove ~6-8mo out.
import { NoSeedPhrasePromptProvider } from '~/contexts/NoSeedPhrasePromptProvider';
import { FarcasterQueryClientProvider } from '~/contexts/QueryClientProvider';
import { RecoveryStoreProvider } from '~/contexts/RecoveryStoreProvider';
import { SecondaryPrivyHostProvider } from '~/contexts/SecondaryEmbeddedWalletProvider';
import { SharedTelemetryProvider } from '~/contexts/SharedTelemetryProvider';
import { SharedWalletSwapStatusProvider } from '~/contexts/SharedWalletSwapStatusProvider';
import { SkiaFontProvider } from '~/contexts/SkiaFontProvider';
import { SpaceProvider } from '~/contexts/SpaceContext';
import { SplashProvider } from '~/contexts/SplashProvider';
import { SyncChannelProvider } from '~/contexts/SyncChannelProvider';
import { TabViewNavigationStateProvider } from '~/contexts/TabViewNavigationStateProvider';
import { ThemeProvider } from '~/contexts/ThemeProvider';
import { TimeoutHistoryProvider } from '~/contexts/TimeoutHistoryProvider';
import { UserDataPreloader } from '~/contexts/UserDataPreloader';
import { UserHeightProvider } from '~/contexts/UserHeightProvider';
import { VersionProvider } from '~/contexts/VersionProvider';
import { WalletProvider } from '~/contexts/WalletProvider';
import { Navigation } from '~/navigation/Navigation';
import { InteractedSnapUrlsMobileProvider } from '~/providers/InteractedSnapUrlsMobileProvider';
import { trackError } from '~/utils/ErrorUtils';

import { AndroidBottomBarBackgroundColorHandler } from './AndroidBottomBarBackgroundColorHandler';
import { AuthedOrUnauthedInitializers } from './AuthedOrUnauthedInitializers';
import { EnsureMinAppVersion } from './EnsureMinAppVersion';
import { FullScreenLoadingIndicator } from './FullScreenLoadingIndicator';
import { FullScreenRetryableError } from './FullScreenRetryableError';
import { ResetQueryCacheOnBaseUrlChange } from './ResetQueryCacheOnBaseUrlChange';
import { RetryableErrorBoundary } from './RetryableErrorBoundary';
import { SessionBreadcrumbs } from './SessionBreadcrumbs';
import { toastRenderType } from './toasts';

const App: FC = memo(() => {
  return (
    <SafeAreaProvider>
      <MemoryWarningHandler />
      <ThemeProvider>
        <ContactsLocalCacheBusterProvider>
          <FileSystemCacheBusterProvider>
            <FarcasterQueryClientProvider>
              <WrappedDatadogProvider>
                <AnalyticsClientProvider>
                  <SharedTelemetryProvider>
                    <ErrorHistoryProvider>
                      <DebugLogsProvider>
                        <SystemBars style="auto" />
                        <BottomSheetModalProvider>
                          <ErrorBoundary
                            onError={(error) => {
                              trackError(error, {
                                location: 'root ErrorBoundary',
                              });
                            }}
                            fallbackRender={({ error, resetErrorBoundary }) => (
                              <FullScreenRetryableError
                                error={error}
                                resetErrorBoundary={resetErrorBoundary}
                              />
                            )}
                          >
                            <SplashProvider>
                              <EarlySplashDismissProvider>
                                <VersionProvider>
                                  <DeviceProvider>
                                    <AppSessionProvider>
                                      <FocusedScreenProvider>
                                        <HeaderProvider>
                                          <AndroidBottomBarBackgroundColorHandler>
                                            <BottomTabProvider>
                                              <TabViewNavigationStateProvider>
                                                <DebugCryptographyProvider>
                                                  <TimeoutHistoryProvider>
                                                    <NavigationHistoryProvider>
                                                      <UserHeightProvider>
                                                        <KeyboardProvider>
                                                          <PrimaryPrivyProviderRoot>
                                                            <SecondaryPrivyHostProvider>
                                                              <Suspense
                                                                fallback={
                                                                  <FullScreenLoadingIndicator debugName="App#Suspense" />
                                                                }
                                                              >
                                                                <RetryableErrorBoundary>
                                                                  <ConnectionStatusProvider>
                                                                    <BrowserPreferenceProvider>
                                                                      <DataSaverProvider>
                                                                        <CheckForOverTheAirUpdateProvider>
                                                                          <AppDataPreloader>
                                                                            {/* EnsureMinAppVersion must be a child of ThemeProvider, and QueryClientProvider */}
                                                                            <EnsureMinAppVersion>
                                                                              <WalletProvider>
                                                                                {/* MobileFarcasterApiClientProvider must be a child of WalletProvider, VersionProvider, DeviceProvider, TimeoutHistoryProvider */}
                                                                                <MobileFarcasterApiClientProvider>
                                                                                  {/* AuthTokenProvider must be a child of MobileFarcasterApiClientProvider and WalletProvider */}
                                                                                  <AuthTokenProvider>
                                                                                    <SessionBreadcrumbs>
                                                                                      {/* ResetQueryCacheOnBaseUrlChange must be a child of MobileFarcasterApiClientProvider */}
                                                                                      <ResetQueryCacheOnBaseUrlChange>
                                                                                        {/* SyncChannelProvider must be a child of WalletProvider */}
                                                                                        <SyncChannelProvider>
                                                                                          <RecoveryStoreProvider>
                                                                                            <InAppPurchasesProvider>
                                                                                              <InteractedSnapUrlsMobileProvider>
                                                                                                <PubSubProvider>
                                                                                                  <UserDataPreloader>
                                                                                                    {/* AuthedOrUnauthedInitializers must be a child of WalletProvider and QueryClientProvider */}
                                                                                                    <AuthedOrUnauthedInitializers>
                                                                                                      <SharedWalletSwapStatusProvider>
                                                                                                        <GlobalPromptsProvider>
                                                                                                          <PublicClientProvider>
                                                                                                            <WagmiProvider>
                                                                                                              <ToastProvider
                                                                                                                renderType={
                                                                                                                  toastRenderType
                                                                                                                }
                                                                                                              >
                                                                                                                <NoSeedPhrasePromptProvider>
                                                                                                                  <MobileEmbeddedWalletProvider>
                                                                                                                    <MWPWalletProvider>
                                                                                                                      {/* Manages a warning prompt for frame transactions and must be a child of MWPWalletProvider */}
                                                                                                                      <FrameTransactionsPromptsProvider>
                                                                                                                        <GiftWarpsSelectedUserProvider>
                                                                                                                          <BlurOverlayProvider>
                                                                                                                            <ComposerOptimisticImagesProvider>
                                                                                                                              <LocalStorageProvider>
                                                                                                                                <SkiaFontProvider>
                                                                                                                                  <GestureHandlerRootView>
                                                                                                                                    <LightboxProvider>
                                                                                                                                      <SpaceProvider>
                                                                                                                                        <Navigation />
                                                                                                                                      </SpaceProvider>
                                                                                                                                    </LightboxProvider>
                                                                                                                                  </GestureHandlerRootView>
                                                                                                                                </SkiaFontProvider>
                                                                                                                              </LocalStorageProvider>
                                                                                                                            </ComposerOptimisticImagesProvider>
                                                                                                                          </BlurOverlayProvider>
                                                                                                                        </GiftWarpsSelectedUserProvider>
                                                                                                                      </FrameTransactionsPromptsProvider>
                                                                                                                    </MWPWalletProvider>
                                                                                                                  </MobileEmbeddedWalletProvider>
                                                                                                                </NoSeedPhrasePromptProvider>
                                                                                                              </ToastProvider>
                                                                                                            </WagmiProvider>
                                                                                                          </PublicClientProvider>
                                                                                                        </GlobalPromptsProvider>
                                                                                                      </SharedWalletSwapStatusProvider>
                                                                                                    </AuthedOrUnauthedInitializers>
                                                                                                  </UserDataPreloader>
                                                                                                </PubSubProvider>
                                                                                              </InteractedSnapUrlsMobileProvider>
                                                                                            </InAppPurchasesProvider>
                                                                                          </RecoveryStoreProvider>
                                                                                        </SyncChannelProvider>
                                                                                      </ResetQueryCacheOnBaseUrlChange>
                                                                                    </SessionBreadcrumbs>
                                                                                  </AuthTokenProvider>
                                                                                </MobileFarcasterApiClientProvider>
                                                                              </WalletProvider>
                                                                            </EnsureMinAppVersion>
                                                                          </AppDataPreloader>
                                                                        </CheckForOverTheAirUpdateProvider>
                                                                      </DataSaverProvider>
                                                                    </BrowserPreferenceProvider>
                                                                  </ConnectionStatusProvider>
                                                                </RetryableErrorBoundary>
                                                              </Suspense>
                                                            </SecondaryPrivyHostProvider>
                                                          </PrimaryPrivyProviderRoot>
                                                        </KeyboardProvider>
                                                      </UserHeightProvider>
                                                    </NavigationHistoryProvider>
                                                  </TimeoutHistoryProvider>
                                                </DebugCryptographyProvider>
                                              </TabViewNavigationStateProvider>
                                            </BottomTabProvider>
                                          </AndroidBottomBarBackgroundColorHandler>
                                        </HeaderProvider>
                                      </FocusedScreenProvider>
                                    </AppSessionProvider>
                                  </DeviceProvider>
                                </VersionProvider>
                              </EarlySplashDismissProvider>
                            </SplashProvider>
                          </ErrorBoundary>
                        </BottomSheetModalProvider>
                      </DebugLogsProvider>
                    </ErrorHistoryProvider>
                  </SharedTelemetryProvider>
                </AnalyticsClientProvider>
              </WrappedDatadogProvider>
            </FarcasterQueryClientProvider>
          </FileSystemCacheBusterProvider>
        </ContactsLocalCacheBusterProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
});

App.displayName = 'App';

export { App };
