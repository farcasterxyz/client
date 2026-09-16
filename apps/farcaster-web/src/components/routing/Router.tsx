import { AuthToken } from 'farcaster-client-data';
import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { AuthedRoutes } from '~/components/routing/AuthedRoutes';
import { Redirect } from '~/components/routing/Redirect';
import { RedirectIfAtPath } from '~/components/routing/RedirectIfAtPath';
import { defaultRoute, redirects, routes } from '~/constants/routes';
import { authTokenKey } from '~/constants/storage';
import { DebugProvider } from '~/contexts/DebugProvider';
import { OnCurrentNavLinkClickedProvider } from '~/contexts/OnCurrentNavLinkClickedProvider';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { AuthedLayout } from '~/layouts/AuthedLayout';
import { UnauthedLayout } from '~/layouts/UnauthedLayout';
import { HomeFeedPage, HomeLandingPage } from '~/lazy/pages';
import { trackError } from '~/utils/errorUtils';
import { getItem } from '~/utils/storageUtils';

const Router: React.FC = () => {
  const isSignedIn = useIsSignedIn();

  const checkAuthTokenAndSignedInState = React.useCallback(async () => {
    const persistedAuthToken = await getItem<AuthToken | undefined>({
      key: authTokenKey,
      fallback: undefined,
    });

    if (typeof persistedAuthToken !== 'undefined' && !isSignedIn) {
      trackError('[Web] User deemed not signed in even though token exits');
    }
  }, [isSignedIn]);

  React.useEffect(() => {
    checkAuthTokenAndSignedInState();
  }, [checkAuthTokenAndSignedInState]);

  return (
    <RedirectIfAtPath>
      {/* OnCurrentNavLinkClickedProvider must be a child of BrowserRouter */}
      <OnCurrentNavLinkClickedProvider>
        {/* DebugProvider must be a child of BrowserRouter */}
        <DebugProvider>
          <Routes>
            {redirects.map((redirect) => (
              <Route
                key={redirect.path}
                path={redirect.path}
                element={<Redirect url={redirect.url} path={redirect.path} />}
              />
            ))}
            <Route element={isSignedIn ? <AuthedLayout /> : null}>
              {/* Canonical must be the last route under `/miniapps` so it treats
                the rest of the path as mini app id and slug */}
              <Route
                path={routes.miniAppsCanonical.path}
                element={<routes.miniAppsCanonical.Component />}
              />
            </Route>
            <Route element={isSignedIn ? <AuthedLayout /> : <UnauthedLayout />}>
              {/* Authed Routes */}
              <Route element={<AuthedRoutes />}>
                <Route
                  path={routes.proUpsell.path}
                  element={<routes.proUpsell.Component />}
                />
                {/* 
                  Mini Apps routes are a special case since we're not using `appPathPrefix`,
                  they're all under `/miniapps`. We hold the fname so it won't be used as a username.
                */}
                <Route
                  path={routes.miniApps.path}
                  element={<routes.miniApps.Component />}
                />
                {/* End Mini Apps */}
                <Route
                  path={routes.compose.path}
                  element={<routes.compose.Component />}
                />
                <Route
                  path={routes.referrals.path}
                  element={<routes.referrals.Component />}
                />
                <Route
                  path={routes.referralsList.path}
                  element={<routes.referralsList.Component />}
                />
                <Route
                  path={routes.following.path}
                  element={<routes.following.Component />}
                />
                <Route
                  path={routes.discover.path}
                  element={<routes.discover.Component />}
                />
                <Route
                  path={routes.discoverTrending.path}
                  element={<routes.discoverTrending.Component />}
                />
                <Route
                  path={routes.discoverYourApps.path}
                  element={<routes.discoverYourApps.Component />}
                />
                <Route
                  path={routes.notifications.path}
                  element={<routes.notifications.Component />}
                />
                <Route
                  path={routes.notificationsWithTabs.path}
                  element={<routes.notificationsWithTabs.Component />}
                />
                <Route
                  path={routes.notificationGroupUsers.path}
                  element={<routes.notificationGroupUsers.Component />}
                />
                <Route
                  path={routes.notificationGroupCasts.path}
                  element={<routes.notificationGroupCasts.Component />}
                />
                <Route
                  path={routes.notificationGroupChannelRoleInvites.path}
                  element={
                    <routes.notificationGroupChannelRoleInvites.Component />
                  }
                />
                <Route
                  path={routes.notificationGroupMiniApps.path}
                  element={<routes.notificationGroupMiniApps.Component />}
                />
                <Route
                  path={routes.bookmarks.path}
                  element={<routes.bookmarks.Component />}
                />
                <Route
                  path={routes.saved.path}
                  element={<routes.saved.Component />}
                />
                <Route
                  path={routes.savedStarterPacks.path}
                  element={<routes.savedStarterPacks.Component />}
                />
                <Route
                  path={routes.users.path}
                  element={<routes.users.Component />}
                />
                <Route
                  path={routes.settings.path}
                  element={<routes.settings.Component />}
                />
                <Route
                  path={routes.settingsNotifications.path}
                  element={<routes.settingsNotifications.Component />}
                />
                <Route
                  path={routes.settingsConnectedAddresses.path}
                  element={<routes.settingsConnectedAddresses.Component />}
                />
                <Route
                  path={routes.settingsPreferredWallet.path}
                  element={<routes.settingsPreferredWallet.Component />}
                />
                <Route
                  path={routes.settingsDirectCasts.path}
                  element={<routes.settingsDirectCasts.Component />}
                />
                <Route
                  path={routes.settingsDirectCastsRecommended.path}
                  element={<routes.settingsDirectCastsRecommended.Component />}
                />
                <Route
                  path={routes.settingsDirectCastsOthers.path}
                  element={<routes.settingsDirectCastsOthers.Component />}
                />
                {/* settingsActions removed */}
                <Route
                  path={routes.settingsFrames.path}
                  element={<routes.settingsFrames.Component />}
                />
                <Route
                  path={routes.settingsFeeds.path}
                  element={<routes.settingsFeeds.Component />}
                />
                <Route
                  path={routes.settingsDeveloperTools.path}
                  element={<routes.settingsDeveloperTools.Component />}
                />
                <Route
                  path={routes.settingsAdvanced.path}
                  element={<routes.settingsAdvanced.Component />}
                />
                <Route
                  path={routes.settingsCastsAndUsers.path}
                  element={<routes.settingsCastsAndUsers.Component />}
                />
                <Route
                  path={routes.settingsImport.path}
                  element={<routes.settingsImport.Component />}
                />
                <Route
                  path={routes.settingsMutedWords.path}
                  element={<routes.settingsMutedWords.Component />}
                />
                <Route
                  path={routes.settingsMutedKeywords.path}
                  element={<routes.settingsMutedKeywords.Component />}
                />
                <Route
                  path={routes.settingsMutesAndBlocks.path}
                  element={<routes.settingsMutesAndBlocks.Component />}
                />
                <Route
                  path={routes.settingsBlockedUsers.path}
                  element={<routes.settingsBlockedUsers.Component />}
                />
                <Route
                  path={routes.settingsMutedUsers.path}
                  element={<routes.settingsMutedUsers.Component />}
                />
                <Route
                  path={routes.settingsStarterPacks.path}
                  element={<routes.starterPacks.Component />}
                />
                <Route
                  path={routes.settingsStorage.path}
                  element={<routes.settingsStorage.Component />}
                />
                <Route
                  path={routes.settingsVerifications.path}
                  element={<routes.settingsVerifications.Component />}
                />
                <Route
                  path={routes.starterPacks.path}
                  element={<routes.starterPacks.Component />}
                />
                <Route
                  path={routes.suggestedStarterPacks.path}
                  element={<routes.suggestedStarterPacks.Component />}
                />
                <Route
                  path={routes.referralCodeJoinPage.path}
                  element={<routes.referralCodeJoinPage.Component />}
                />
                <Route
                  path={routes.vanityReferralJoinPage.path}
                  element={<routes.vanityReferralJoinPage.Component />}
                />
                {/* addCastAction removed */}
                {/* discoverActions removed */}
                <Route
                  path={routes.profileLikesWithoutUsername.path}
                  element={<routes.profileLikesWithoutUsername.Component />}
                />
                <Route
                  path={routes.profileLikesWithUsername.path}
                  element={<routes.profileLikesWithUsername.Component />}
                />
                <Route
                  path={routes.profileStarterPacksWithoutUsername.path}
                  element={
                    <routes.profileStarterPacksWithoutUsername.Component />
                  }
                />
                <Route
                  path={routes.profileStarterPacksWithUsername.path}
                  element={<routes.profileStarterPacksWithUsername.Component />}
                />
                <Route
                  path={routes.debugEmbeddedWallet.path}
                  element={<routes.debugEmbeddedWallet.Component />}
                />
                <Route
                  path={routes.debugAdminToken.path}
                  element={<routes.debugAdminToken.Component />}
                />
                <Route
                  path={routes.adminReviews.path}
                  element={<routes.adminReviews.Component />}
                />
                <Route
                  path={routes.developers.path}
                  element={<routes.developers.Component />}
                />
                <Route
                  path={routes.developersApiKeys.path}
                  element={<routes.developersApiKeys.Component />}
                />
                <Route
                  path={routes.developersEmbeds.path}
                  element={<routes.developersEmbeds.Component />}
                />
                <Route
                  path={routes.developersHostedManifests.path}
                  element={<routes.developersHostedManifests.Component />}
                />
                {/* developersFrameValidator removed */}
                <Route
                  path={routes.developersManageApp.path}
                  element={<routes.developersManageApp.Component />}
                />
                <Route
                  path={routes.developersMiniAppManifest.path}
                  element={<routes.developersMiniAppManifest.Component />}
                />
                <Route
                  path={routes.developersMiniAppEmbed.path}
                  element={<routes.developersMiniAppEmbed.Component />}
                />
                <Route
                  path={routes.developersMiniAppPreview.path}
                  element={<routes.developersMiniAppPreview.Component />}
                />
                <Route
                  path={routes.developersSnaps.path}
                  element={<routes.developersSnaps.Component />}
                />
                {/* developersComposerActionPlayground removed */}
                <Route
                  path={routes.channelSettingsSection.path}
                  element={
                    <routes.channelSettings.Component openSettings={true} />
                  }
                />
                <Route
                  path={routes.channelSettings.path}
                  element={
                    <routes.channelSettings.Component openSettings={true} />
                  }
                />
                <Route
                  path={routes.channelFollowersYouKnow.path}
                  element={<routes.channelFollowersYouKnow.Component />}
                />
                <Route
                  path={routes.globalFrameAnalytics.path}
                  element={<routes.globalFrameAnalytics.Component />}
                />
                <Route
                  path={routes.followersYouKnowWithUsername.path}
                  element={<routes.followersYouKnowWithUsername.Component />}
                />
                <Route
                  path={routes.followersYouKnowWithoutUsername.path}
                  element={<routes.followersYouKnowWithoutUsername.Component />}
                />
                {/* Direct Casts utilize React Router's Outlet pattern to avoid full-page loads on each conversation press  */}
                <Route
                  path={routes.directCastsInbox.path}
                  element={<routes.directCastsInbox.Component />}
                >
                  <Route
                    path={routes.directCastsInbox.path}
                    element={<routes.directCastsConversation.Component />}
                  />
                  <Route
                    path={routes.directCastsConversation.path}
                    element={<routes.directCastsConversation.Component />}
                  />
                </Route>
                <Route
                  path={routes.directCastsCreate.path}
                  element={<routes.directCastsCreate.Component />}
                />
                <Route
                  path={routes.audioRoom.path}
                  element={<routes.audioRoom.Component />}
                />
                <Route
                  path={routes.spacesDiscovery.path}
                  element={<routes.spacesDiscovery.Component />}
                />
                <Route
                  path={routes.spaces.path}
                  element={<routes.spaces.Component />}
                />
              </Route>
              <Route
                path={routes.wallet.path}
                element={<routes.wallet.Component />}
              />
              <Route
                path={routes.trendingTopic.path}
                element={<routes.trendingTopic.Component />}
              />
              {/* Unauthed Routes */}
              <Route
                path={routes.news.path}
                element={<routes.news.Component />}
              />
              <Route
                path={routes.starterPack.path}
                element={<routes.starterPack.Component />}
              />
              <Route
                path={routes.starterPackWithUsername.path}
                element={<routes.starterPackWithUsername.Component />}
              />
              <Route
                path={routes.referral.path}
                element={<routes.referral.Component />}
              />
              <Route
                path={routes.referralWithUsername.path}
                element={<routes.referralWithUsername.Component />}
              />
              <Route
                path={routes.token.path}
                element={<routes.token.Component />}
              />
              <Route path={routes.ca.path} element={<routes.ca.Component />} />
              <Route
                path={routes.settingsConnectedAccounts.path}
                element={<routes.settingsConnectedAccounts.Component />}
              />
              <Route
                path={routes.channel.path}
                element={<routes.channel.Component openSettings={false} />}
              />
              <Route
                path={routes.channelFeed.path}
                element={<routes.channelFeed.Component />}
              />
              <Route
                path={routes.channelFollowers.path}
                element={<routes.channelFollowers.Component />}
              />
              <Route
                path={routes.channelMembers.path}
                element={<routes.channelMembers.Component />}
              />
              <Route
                path={routes.conversationWithoutUsername.path}
                element={<routes.conversationWithoutUsername.Component />}
              />
              <Route
                path={routes.conversationReactionsWithoutUsername.path}
                element={
                  <routes.conversationReactionsWithoutUsername.Component />
                }
              />
              <Route
                path={routes.conversationRecastsWithoutUsername.path}
                element={
                  <routes.conversationRecastsWithoutUsername.Component />
                }
              />
              <Route
                path={routes.conversationQuotesWithoutUsername.path}
                element={<routes.conversationQuotesWithoutUsername.Component />}
              />
              <Route
                path={routes.followingWithoutUsername.path}
                element={<routes.followingWithoutUsername.Component />}
              />
              <Route
                path={routes.followersWithoutUsername.path}
                element={<routes.followersWithoutUsername.Component />}
              />
              <Route
                path={routes.profileCastsAndRepliesWithoutUsername.path}
                element={
                  <routes.profileCastsAndRepliesWithoutUsername.Component />
                }
              />
              <Route
                path={routes.profileAssetsWithoutUsername.path}
                element={<routes.profileAssetsWithoutUsername.Component />}
              />
              <Route
                path={routes.profileSnapCastsWithoutUsername.path}
                element={<routes.profileSnapCastsWithoutUsername.Component />}
              />
              <Route
                path={routes.profileCastsWithoutUsername.path}
                element={<routes.profileCastsWithoutUsername.Component />}
              />
              <Route
                path={routes.channels.path}
                element={<routes.channels.Component />}
              />
              <Route
                path={routes.manageChannelsCategory.path}
                element={<routes.manageChannelsCategory.Component />}
              />
              <Route
                path={routes.app.path}
                element={<routes.app.Component />}
              />
              <Route
                path={routes.apps.path}
                element={<routes.apps.Component />}
              />
              <Route
                path={routes.top.path}
                element={<routes.top.Component />}
              />
              <Route
                path={routes.recent.path}
                element={<routes.recent.Component />}
              />
              <Route
                path={routes.searchChannels.path}
                element={<routes.searchChannels.Component />}
              />
              <Route
                path={routes.searchUsers.path}
                element={<routes.searchUsers.Component />}
              />
              <Route
                path={routes.searchMiniApps.path}
                element={<routes.searchMiniApps.Component />}
              />
              <Route
                path={routes.locationUsers.path}
                element={<routes.locationUsers.Component />}
              />
              <Route
                path={routes.miniAppsEditorsChoice.path}
                element={<routes.miniAppsEditorsChoice.Component />}
              />
              <Route
                path={routes.debug.path}
                element={<routes.debug.Component />}
              />
              <Route
                path={routes.debugCasts.path}
                element={<routes.debugCasts.Component />}
              />
              <Route
                path={routes.recoveryStart.path}
                element={<routes.recoveryStart.Component />}
              />
              <Route
                path={routes.recoveryInitiate.path}
                element={<routes.recoveryInitiate.Component />}
              />
              <Route
                path={routes.recovery.path}
                element={<routes.recovery.Component />}
              />
              <Route
                path={routes.magicLink.path}
                element={<routes.magicLink.Component />}
              />
              {/*
              Vanity Routes
              These routes must be defined at the bottom of the `Routes` component
              to prevent React Router from prematurely matching a vanity url
              where the leading symbol (e.g. `~`) is the username and
              the path segment (e.g. `notifications`) is the `castHashPrefix` (for example).
              We must also adhere to this ordering in `routes` to accommodate vanity routes, unfortunately.

            */}
              <Route
                path={routes.conversationWithUsername.path}
                element={<routes.conversationWithUsername.Component />}
              />
              <Route
                path={routes.conversationReactionsWithUsername.path}
                element={<routes.conversationReactionsWithUsername.Component />}
              />
              <Route
                path={routes.conversationRecastsWithUsername.path}
                element={<routes.conversationRecastsWithUsername.Component />}
              />
              <Route
                path={routes.conversationQuotesWithUsername.path}
                element={<routes.conversationQuotesWithUsername.Component />}
              />
              <Route
                path={routes.followingWithUsername.path}
                element={<routes.followingWithUsername.Component />}
              />
              <Route
                path={routes.followersWithUsername.path}
                element={<routes.followersWithUsername.Component />}
              />
              <Route
                path={routes.profileSnapCastsWithUsername.path}
                element={<routes.profileSnapCastsWithUsername.Component />}
              />
              <Route
                path={routes.profileAssetsWithUsername.path}
                element={<routes.profileAssetsWithUsername.Component />}
              />
              <Route
                path={routes.profileCastsWithUsername.path}
                element={<routes.profileCastsWithUsername.Component />}
              />
              <Route
                path={routes.profileCastsAndRepliesWithUsername.path}
                element={
                  <routes.profileCastsAndRepliesWithUsername.Component />
                }
              />
            </Route>
            {/* Authed routes without scaffolding */}
            <Route element={<AuthedRoutes />}>
              <Route
                path={routes.adminFeedsComparison.path}
                element={<routes.adminFeedsComparison.Component />}
              />
              <Route
                path={routes.adminEngagementRingCandidates.path}
                element={<routes.adminEngagementRingCandidates.Component />}
              />
              <Route
                path={routes.adminLabeledCasts.path}
                element={<routes.adminLabeledCasts.Component />}
              />
            </Route>
            {/* Un-authed routes without scaffolding */}
            <Route element={isSignedIn ? <AuthedLayout /> : null}>
              <Route
                path={routes.homeFeed.path}
                element={
                  isSignedIn ? (
                    <routes.homeFeed.Component />
                  ) : (
                    <HomeLandingPage />
                  )
                }
              />
            </Route>
            <Route
              path={routes.download.path}
              element={<routes.download.Component />}
            />
            <Route
              path={routes.signup.path}
              element={<routes.signup.Component />}
            />
            <Route
              path={routes.directCastsInvite.path}
              element={<routes.directCastsInvite.Component />}
            />
            <Route
              path={routes.channelJoinViaCode.path}
              element={<routes.channelJoinViaCode.Component />}
            />
            <Route
              path={routes.mint.path}
              element={<routes.mint.Component />}
            />
            <Route
              path={routes.launchMiniApp.path}
              element={<routes.launchMiniApp.Component />}
            />
            <Route
              path={routes.signInWithFarcaster.path}
              element={<routes.signInWithFarcaster.Component />}
            />
            <Route
              path={routes.signInWithFarcasterV2.path}
              element={<routes.signInWithFarcasterV2.Component />}
            />
            <Route
              path={routes.farcasterConnect.path}
              element={<routes.farcasterConnect.Component />}
            />
            <Route
              path={routes.openOnMobilePage.path}
              element={<routes.openOnMobilePage.Component />}
            />
            <Route
              path={routes.loginRedirectWeb.path}
              element={<routes.loginRedirectWeb.Component />}
            />
            <Route
              path={routes.loginRedirectMobile.path}
              element={<routes.loginRedirectMobile.Component />}
            />
            <Route
              path={routes.loginRedirectWallet.path}
              element={<routes.loginRedirectWallet.Component />}
            />
            <Route
              path={routes.loginRedirectDesktop.path}
              element={<routes.loginRedirectDesktop.Component />}
            />
            <Route
              path={routes.support.path}
              element={<routes.support.Component />}
            />
            <Route
              path={routes.supportDeleteAccount.path}
              element={<routes.supportDeleteAccount.Component />}
            />
            <Route
              path={routes.termsOfUse.path}
              element={<routes.termsOfUse.Component />}
            />
            <Route
              path={routes.privacyPolicy.path}
              element={<routes.privacyPolicy.Component />}
            />
            <Route
              path={routes.referralCodeLandingPage.path}
              element={<routes.referralCodeLandingPage.Component />}
            />
            <Route
              path={routes.vanityReferralLandingPage.path}
              element={<routes.vanityReferralLandingPage.Component />}
            />
            <Route
              path={routes.catchAll.path}
              element={<Navigate replace to={defaultRoute.path} />}
            />
            {/* FIXME: This is a bit odd but what we are trying here is to redirect user to home feed
              if they are already signed up. Our route structure is built to handle the reverse
              of this already (redirects fallback to un-authed home feed). Lets consider building
              a similar mechanism of fallback for the logged in users so we don't have to do this
              dance for all routes. */}
            <Route element={isSignedIn ? <AuthedLayout /> : null}>
              <Route
                path={routes.signupForInvite.path}
                element={
                  isSignedIn ? (
                    <HomeFeedPage />
                  ) : (
                    <routes.signupForInvite.Component />
                  )
                }
              />
              <Route
                path={routes.cloudflareChallenge.path}
                element={
                  isSignedIn ? (
                    <HomeFeedPage />
                  ) : (
                    <routes.cloudflareChallenge.Component />
                  )
                }
              />
            </Route>
          </Routes>
        </DebugProvider>
      </OnCurrentNavLinkClickedProvider>
    </RedirectIfAtPath>
  );
};

Router.displayName = 'Router';

export { Router };
