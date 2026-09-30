import {
  InternalEventingProvider,
  useTrackEvent,
  WebSocketsProvider,
} from 'farcaster-client-hooks';
import React, { FC, memo, ReactNode } from 'react';

import { analyticsClient } from '~/analyticsClient';
import { AppStoreReviewProvider } from '~/contexts/AppStoreReviewProvider';
import { CastQueueProvider } from '~/contexts/CastQueueProvider';
import { CastToTakeActionProvider } from '~/contexts/CastToTakeActionProvider';
import { DirectCastsAnimationsHistoryProvider } from '~/contexts/DirectCastsAnimationsHistoryProvider';
import { DirectCastsDraftsProvider } from '~/contexts/DirectCastsDraftsProvider';
import { DirectCastsImagePreviewProvider } from '~/contexts/DirectCastsImageUploadPreviewProvider';
import { DirectCastsProvider } from '~/contexts/DirectCastsProvider';
import { DirectCastsVideoPreviewProvider } from '~/contexts/DirectCastsVideoUploadPreviewProvider';
import { DirectCastToTakeActionProvider } from '~/contexts/DirectCastToTakeActionProvider';
import { useFocusedScreen } from '~/contexts/FocusedScreenProvider';
import { GlobalGateProvider } from '~/contexts/GlobalGateProvider';
import { LocationPermissionProvider } from '~/contexts/LocationPermissionProvider';
import { MobileEventingProvider } from '~/contexts/MobileEventingProvider';
import { MobileUnseenProvider } from '~/contexts/MobileUnseenProvider';
import { NonBlockingPrefetchesProvider } from '~/contexts/NonBlockingPrefetchesProvider';
import { NotificationsInboxPrefetchProvider } from '~/contexts/NotificationsInboxPrefetchProvider';
import { PushNotificationPermissionProvider } from '~/contexts/PushNotificationPermissionProvider';
import { RegisterAuthAddressProvider } from '~/contexts/RegisterAuthAddressProvider';
import { UserAppContextProvider } from '~/contexts/UserAppContextProvider';
import { VideoFeedSoundProvider } from '~/contexts/VideoFeedSoundProvider';
import { VideoFeedViewablilityProvider } from '~/contexts/VideoFeedViewablilityProvider';
import { VideoPlayerProvider } from '~/contexts/VideoPlayerProvider';
import { useAppState } from '~/hooks/useAppState';
import { getLastSelectedHomeFeedKey } from '~/screens/Feed/HomeScreenScrollHandlers';
import {
  recoverPendingBackgroundFollowingFeedSessionClose,
  resumeFollowingFeedSession,
  scheduleBackgroundFollowingFeedSessionClose,
  scheduleFollowingFeedSessionClose,
} from '~/utils/FollowingFeedSessionTracking';
import {
  recoverPendingBackgroundHomeFeedSessionClose,
  resumeHomeFeedSession,
  scheduleBackgroundHomeFeedSessionClose,
  scheduleHomeFeedSessionClose,
} from '~/utils/HomeFeedSessionTracking';

import { DataDogTracker } from './DataDogTracker';
import { InitPushNotifications } from './InitPushNotifications';
import { NotificationsIconBadgeController } from './NotificationsIconBadgeController';
import { PrefetchAuthedResources } from './PrefetchAuthedResources';

type AuthedInitializersProps = {
  children: ReactNode;
};

const homeFeedRelatedScreenNames = new Set(['Feed', 'Cast']);

const HomeFeedSessionBoundary = memo(() => {
  const { focusedScreen } = useFocusedScreen();
  const { trackEvent } = useTrackEvent();
  const appState = useAppState();

  React.useEffect(() => {
    recoverPendingBackgroundHomeFeedSessionClose({ trackEvent });
  }, [trackEvent]);

  React.useEffect(() => {
    if (
      appState === 'active' &&
      typeof focusedScreen !== 'undefined' &&
      homeFeedRelatedScreenNames.has(focusedScreen.name)
    ) {
      // Resume an existing session instead of opening one here so app returns
      // on feed-related screens do not fragment a feed visit or create opens.
      resumeHomeFeedSession({ trackEvent });
      return;
    }

    if (
      appState === 'active' &&
      typeof focusedScreen !== 'undefined' &&
      !homeFeedRelatedScreenNames.has(focusedScreen.name)
    ) {
      scheduleHomeFeedSessionClose({ trackEvent });
    }
  }, [appState, focusedScreen, trackEvent]);

  React.useEffect(() => {
    if (appState !== 'active') {
      scheduleBackgroundHomeFeedSessionClose({ trackEvent });
    }
  }, [appState, trackEvent]);

  // Intentionally do not close the session on unmount. Provider-level remounts
  // are not reliable feed-exit signals and would skew duration metrics low.
  return null;
});

HomeFeedSessionBoundary.displayName = 'HomeFeedSessionBoundary';

const FollowingFeedSessionBoundary = memo(() => {
  const { focusedScreen } = useFocusedScreen();
  const { trackEvent } = useTrackEvent();
  const appState = useAppState();

  React.useEffect(() => {
    recoverPendingBackgroundFollowingFeedSessionClose({ trackEvent });
  }, [trackEvent]);

  React.useEffect(() => {
    const lastSelectedFeedKey = getLastSelectedHomeFeedKey();
    const shouldResumeSession =
      appState === 'active' &&
      typeof focusedScreen !== 'undefined' &&
      homeFeedRelatedScreenNames.has(focusedScreen.name) &&
      lastSelectedFeedKey === 'following';

    if (shouldResumeSession) {
      resumeFollowingFeedSession({ trackEvent });
      return;
    }

    if (appState === 'active') {
      scheduleFollowingFeedSessionClose({ trackEvent });
    }
  }, [appState, focusedScreen, trackEvent]);

  React.useEffect(() => {
    if (appState !== 'active') {
      scheduleBackgroundFollowingFeedSessionClose({ trackEvent });
    }
  }, [appState, trackEvent]);

  return null;
});

FollowingFeedSessionBoundary.displayName = 'FollowingFeedSessionBoundary';

const AuthedInitializers: FC<AuthedInitializersProps> = memo(({ children }) => {
  /* AppUserProvider must be a child of QueryClientProvider */
  return (
    <GlobalGateProvider>
      <UserAppContextProvider>
        <DataDogTracker>
          <AppStoreReviewProvider>
            {/* PrefetchAuthedResources must be a child of WalletProvider and ApiClientProvider */}
            <PrefetchAuthedResources>
              <NonBlockingPrefetchesProvider>
                {/* InternalEventingProvider must be a child of FarcasterApiClientProvider and PubSubProvider */}
                <InternalEventingProvider
                  onCastViewAccepted={(event) => {
                    analyticsClient.capture('cast.view', {
                      castHash: event.castHash,
                      ...(typeof event.castAuthorFid === 'number'
                        ? { author_fid: event.castAuthorFid }
                        : {}),
                      ...(event.on ? { on: event.on } : {}),
                      ...(event.channel ? { channel: event.channel } : {}),
                      ...(event.feed ? { feed: event.feed } : {}),
                      ...(event.includeReason
                        ? { includeReason: event.includeReason }
                        : {}),
                      ...(event.includeReason
                        ? { reason: event.includeReason }
                        : {}),
                      ...(typeof event.index === 'number'
                        ? { index: event.index }
                        : {}),
                      ...(typeof event.index === 'number'
                        ? { position: event.index }
                        : {}),
                      ...(event.homeFeedSnapBoostVariant
                        ? {
                            homeFeedSnapBoostVariant:
                              event.homeFeedSnapBoostVariant,
                            home_feed_snap_boost_variant:
                              event.homeFeedSnapBoostVariant,
                          }
                        : {}),
                      warpcastPlatform: 'mobile',
                    });
                  }}
                >
                  <MobileEventingProvider>
                    <HomeFeedSessionBoundary />
                    <FollowingFeedSessionBoundary />
                    {/* PushNotificationPermissionProvider must be a child of WalletProvider, and DeviceProvider */}
                    <PushNotificationPermissionProvider>
                      {/* LocationPermissionProvider must be a child of WalletProvider, and DeviceProvider */}
                      <LocationPermissionProvider>
                        {/* WebSocketsProvider has to be a parent of DirectCastsProvider and a child of MobileFarecasterApiClientProvider */}
                        <WebSocketsProvider>
                          <RegisterAuthAddressProvider>
                            {/* DirectCastsProvider must be a child of WalletProvider,  MobileFarcasterApiClientProvider and DirectCastTTLsProvider. */}
                            <DirectCastsProvider>
                              <DirectCastsAnimationsHistoryProvider>
                                <DirectCastsDraftsProvider>
                                  <DirectCastsImagePreviewProvider>
                                    <DirectCastsVideoPreviewProvider>
                                      {/* DirectCastToTakeActionProvider must be a child of DirectCastsProvider. */}
                                      <DirectCastToTakeActionProvider>
                                        {/* CastToTakeActionProvider must be a child of DirectCastsProvider. */}
                                        <CastToTakeActionProvider>
                                          {/* MobileUnseenProvider must be a child of WalletProvider, MobileFarcasterApiClientProvider, DirectCastsProvider, and UserKeysStatusProvider */}
                                          <MobileUnseenProvider>
                                            {/* NotificationsInboxPrefetchProvider must be a child of MobileUnseenProvider */}
                                            <NotificationsInboxPrefetchProvider>
                                              {/* NotificationsIconBadgeController must be a child of MobileUnseenProvider */}
                                              <NotificationsIconBadgeController>
                                                {/* InitPushNotifications must be a child of WalletProvider, FocusedScreenProvider, and DirectCastsProvider */}
                                                <InitPushNotifications>
                                                  <VideoPlayerProvider>
                                                    <VideoFeedViewablilityProvider>
                                                      <VideoFeedSoundProvider>
                                                        <CastQueueProvider>
                                                          {children}
                                                        </CastQueueProvider>
                                                      </VideoFeedSoundProvider>
                                                    </VideoFeedViewablilityProvider>
                                                  </VideoPlayerProvider>
                                                </InitPushNotifications>
                                              </NotificationsIconBadgeController>
                                            </NotificationsInboxPrefetchProvider>
                                          </MobileUnseenProvider>
                                        </CastToTakeActionProvider>
                                      </DirectCastToTakeActionProvider>
                                    </DirectCastsVideoPreviewProvider>
                                  </DirectCastsImagePreviewProvider>
                                </DirectCastsDraftsProvider>
                              </DirectCastsAnimationsHistoryProvider>
                            </DirectCastsProvider>
                          </RegisterAuthAddressProvider>
                        </WebSocketsProvider>
                      </LocationPermissionProvider>
                    </PushNotificationPermissionProvider>
                  </MobileEventingProvider>
                </InternalEventingProvider>
              </NonBlockingPrefetchesProvider>
            </PrefetchAuthedResources>
          </AppStoreReviewProvider>
        </DataDogTracker>
      </UserAppContextProvider>
    </GlobalGateProvider>
  );
});

AuthedInitializers.displayName = 'AuthedInitializers';

export { AuthedInitializers };
