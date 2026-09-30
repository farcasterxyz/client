import { HelmetProvider } from '@dr.pogodin/react-helmet';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  persistQueryClient,
  PersistQueryClientOptions,
} from '@tanstack/react-query-persist-client';
import { BlockedDomainsProvider, PubSubProvider } from 'farcaster-client-hooks';
import React, { FC, ReactNode, Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';

import { Router } from '~/components/routing/Router';
import { AnalyticsProvider } from '~/contexts/AnalyticsProvider';
import { AuthProvider, useAuth } from '~/contexts/AuthProvider';
import { DirectCastToTakeActionProvider } from '~/contexts/DirectCastToTakeActionProvider';
import { GlobalKeyPressProvider } from '~/contexts/GlobalKeyPressProvider';
import { HasUnmountedProvider } from '~/contexts/HasUnmountedProvider';
import { LinkDetailsPopoverManagerProvider } from '~/contexts/LinkDetailsPopoverManagerProvider';
import { LinkifyProvider } from '~/contexts/LinkifyProvider';
import { MiniAppProvider } from '~/contexts/MiniAppProvider';
import { MinimizableWindowProvider } from '~/contexts/MinimizableWindowProvider';
import { PersistQueryClientInstanceProvider } from '~/contexts/PersistQueryClientInstanceProvider';
import { PopStateProvider } from '~/contexts/PopStateProvider';
import { RecentFetchProvider } from '~/contexts/RecentFetchProvider';
import { ScrollProvider } from '~/contexts/ScrollProvider';
import { StandaloneModeProvider } from '~/contexts/StandaloneModeProvider';
import { ThemeProvider } from '~/contexts/ThemeProvider';
import { VideoPlayStatusProvider } from '~/contexts/VideoPlayStatusProvider';
import { WebFarcasterApiClientProvider } from '~/contexts/WebFarcasterApiClientProvider';
import { InteractedSnapUrlsWebProvider } from '~/providers/InteractedSnapUrlsWebProvider';
import { wagmiConfig } from '~/utils/wagmi';

import { FullScreenErrorBoundary } from './errors/FullScreenErrorBoundary';
import { SnapWindowErrorListenerInstaller } from './SnapWindowErrorListenerInstaller';

const AuthGatedBlockedDomainsProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { authToken } = useAuth();
  return (
    <BlockedDomainsProvider enabled={!!authToken}>
      {children}
    </BlockedDomainsProvider>
  );
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 3,
      gcTime: 1000 * 60 * 5,
    },
  },
});

const localStoragePersister = createSyncStoragePersister({
  storage: window.localStorage,
});

// This obviously busts the cache on every load but we are not built
// to handle that well for many surfaces such as threads and Direct Casts.
localStoragePersister.removeClient();

persistQueryClient({
  queryClient: queryClient,
  persister: localStoragePersister,
} as unknown as PersistQueryClientOptions);

const App: FC = () => {
  return (
    <HelmetProvider>
      {/* This needs to be outside QueryClientProvider so that Wagmi uses a basic queryClient rather than our normal one with suspense */}
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          {/* Unfortunately, PersistQueryClientProvider does not seem to epxose the persister. We use our own provider to get access to the persister in the event that we need to remove storage (e.g. during signout). */}
          <PersistQueryClientInstanceProvider
            localStoragePersister={localStoragePersister}
          >
            <PopStateProvider>
              <HasUnmountedProvider>
                <ScrollProvider>
                  <StandaloneModeProvider>
                    <GlobalKeyPressProvider>
                      <LinkDetailsPopoverManagerProvider>
                        <RecentFetchProvider>
                          <Suspense fallback={null}>
                            <QueryClientProvider client={queryClient}>
                              {/* FullScreenErrorBoundary must be a child of QueryClientProvider */}
                              <FullScreenErrorBoundary>
                                <LinkifyProvider>
                                  {/* WebFarcasterApiClientProvider must be a child of QueryClientProvider, AuthProvider, and RecentFetchProvider */}
                                  <WebFarcasterApiClientProvider>
                                    {/* AuthProvider must be a child of QueryClientProvider, AuthProvider, WebFarcasterApiClientProvider, and FeatureFlagProvider */}
                                    <AuthProvider>
                                      <AuthGatedBlockedDomainsProvider>
                                        <ThemeProvider>
                                          <AnalyticsProvider>
                                            <SnapWindowErrorListenerInstaller />
                                            <InteractedSnapUrlsWebProvider>
                                              <PubSubProvider>
                                                <VideoPlayStatusProvider>
                                                  <DirectCastToTakeActionProvider>
                                                    <MiniAppProvider>
                                                      <MinimizableWindowProvider>
                                                        <BrowserRouter>
                                                          <Router />
                                                        </BrowserRouter>
                                                      </MinimizableWindowProvider>
                                                    </MiniAppProvider>
                                                  </DirectCastToTakeActionProvider>
                                                </VideoPlayStatusProvider>
                                              </PubSubProvider>
                                            </InteractedSnapUrlsWebProvider>
                                          </AnalyticsProvider>
                                        </ThemeProvider>
                                      </AuthGatedBlockedDomainsProvider>
                                    </AuthProvider>
                                  </WebFarcasterApiClientProvider>
                                </LinkifyProvider>
                              </FullScreenErrorBoundary>
                            </QueryClientProvider>
                          </Suspense>
                        </RecentFetchProvider>
                      </LinkDetailsPopoverManagerProvider>
                    </GlobalKeyPressProvider>
                  </StandaloneModeProvider>
                </ScrollProvider>
              </HasUnmountedProvider>
            </PopStateProvider>
          </PersistQueryClientInstanceProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </HelmetProvider>
  );
};

export { App };
