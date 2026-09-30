import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUserProfile } from 'farcaster-client-data';
import {
  getCastFeedIncludeReasonType,
  getFeedSourceOn,
  useGloballyCachedUser,
  usePrefetchProfileSnapCasts,
  usePrefetchStarterPacks,
  usePrefetchUserCastsAndReplies,
  usePrefetchUserLikedCasts,
  UserLinkHelpersProvider,
} from 'farcaster-client-hooks';
import {
  HeartIcon,
  LayersIcon,
  MessageSquareIcon,
  MessagesSquareIcon,
  WalletMinimalIcon,
} from 'lucide-react';
import { FC, memo, ReactNode, useEffect, useMemo } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { SnapIcon } from '~/components/icons/SnapIcon';
import { LinkToProfileAssets } from '~/components/links/LinkToProfileAssets';
import { LinkToProfileCasts } from '~/components/links/LinkToProfileCasts';
import { LinkToProfileCastsAndReplies } from '~/components/links/LinkToProfileCastsAndReplies';
import { LinkToProfileLikes } from '~/components/links/LinkToProfileLikes';
import { LinkToProfileSnapCasts } from '~/components/links/LinkToProfileSnapCasts';
import { LinkToProfileStarterPacks } from '~/components/links/LinkToProfileStarterPacks';
import { Page } from '~/components/page/Page';
import { UserHarmfulDisclaimer } from '~/components/profiles/UserHarmfulDisclaimer';
import { UserVisibilityDisclaimer } from '~/components/profiles/UserVisibilityDisclaimer';
import { Tab } from '~/components/tabs/Tab';
import { Tabs } from '~/components/tabs/Tabs';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { useSearchParams } from '~/hooks/navigation/useSearchParams';
import { ProfileTab } from '~/types';

import { ProfileHeader } from './ProfileHeader';
import { ProfileMetadata } from './ProfileMetadata';

const profileTabIconClassName = 'size-5';

type ProfileContentProps = {
  title: string;
  userProfile: ApiUserProfile;
  focusedTab: ProfileTab;
  children: ReactNode;
};

const ProfileContent: FC<ProfileContentProps> = memo(
  ({ title, userProfile, focusedTab, children }) => {
    const user = useGloballyCachedUser({ fallback: userProfile.user });
    const isSignedIn = useIsSignedIn();
    const withUsernameSearchParams = useSearchParams(
      'profileCastsWithUsername',
    );
    const withoutUsernameSearchParams = useSearchParams(
      'profileCastsWithoutUsername',
    );
    const includeReason =
      getCastFeedIncludeReasonType(withUsernameSearchParams.includeReason) ??
      getCastFeedIncludeReasonType(withoutUsernameSearchParams.includeReason);
    const sourceOn = getFeedSourceOn(
      withUsernameSearchParams.sourceOn ?? withoutUsernameSearchParams.sourceOn,
    );
    const castHash =
      withUsernameSearchParams.castHash ?? withoutUsernameSearchParams.castHash;
    const { trackEvent } = useAnalytics();

    const userInvisible = useMemo(
      () => !!user?.viewerContext?.invisible,
      [user?.viewerContext?.invisible],
    );

    const userHarmful = useMemo(
      () => !!user?.viewerContext?.nerfed,
      [user?.viewerContext?.nerfed],
    );

    const prefetchUserCastsAndReplies = usePrefetchUserCastsAndReplies();
    const prefetchProfileSnapCasts = usePrefetchProfileSnapCasts();
    const prefetchUserLikedCasts = usePrefetchUserLikedCasts();
    const prefetchUserStarterPacks = usePrefetchStarterPacks();

    useEffect(() => {
      prefetchUserCastsAndReplies({ fid: user.fid });
      prefetchProfileSnapCasts({ fid: user.fid });
      if (isSignedIn) {
        prefetchUserLikedCasts({ fid: user.fid });
        prefetchUserStarterPacks({ fid: user.fid });
      }
    }, [
      isSignedIn,
      prefetchProfileSnapCasts,
      prefetchUserCastsAndReplies,
      prefetchUserLikedCasts,
      prefetchUserStarterPacks,
      user.fid,
    ]);

    useEffect(() => {
      trackEvent(AnalyticsEvent.ProfileOpen, {
        profile_fid: user.fid,
        ...(user.username ? { 'profile username': user.username } : {}),
        ...(includeReason ? { includeReason, sourceSurface: 'home_feed' } : {}),
        ...(sourceOn ? { on: sourceOn } : {}),
        ...(castHash ? { castHash } : {}),
      });
    }, [
      castHash,
      includeReason,
      sourceOn,
      trackEvent,
      user.fid,
      user.username,
    ]);

    // Build SEO metadata (consistent with SSR ProfileCastsHead)
    const description = useMemo(() => {
      const bio = user.profile?.bio?.text || '';
      const followText = `Follow @${user.username} on Farcaster to see their casts and join the conversation.`;
      if (bio) {
        const fullDesc = `${bio} — ${followText}`;
        return fullDesc.length > 160
          ? `${fullDesc.substring(0, 157)}...`
          : fullDesc;
      }
      return followText;
    }, [user.username, user.profile?.bio?.text]);

    const canonical = useMemo(() => {
      return user.username
        ? `https://farcaster.xyz/${user.username}`
        : undefined;
    }, [user.username]);

    const ogImage = useMemo(() => {
      return user.pfp?.url;
    }, [user.pfp?.url]);

    const author = useMemo(() => {
      return user.username ? `@${user.username}` : undefined;
    }, [user.username]);

    return (
      <Page
        meta={{
          title,
          description,
          canonical,
          ogImage,
          author,
          twitterCard: 'summary',
        }}
      >
        <BorderedMainContent>
          <ProfileHeader userProfile={userProfile} />
          <ProfileMetadata
            userProfile={userProfile}
            profileOpenIncludeReason={includeReason}
            profileOpenCastHash={castHash}
          />
          {userInvisible ? (
            <UserVisibilityDisclaimer user={user} />
          ) : userHarmful ? (
            <UserHarmfulDisclaimer user={user} />
          ) : (
            <>
              <Tabs>
                <LinkToProfileCasts
                  title={`${user.displayName}'s casts`}
                  user={user}
                  includeReason={includeReason}
                  sourceOn={sourceOn}
                  castHash={castHash}
                  className="flex h-full flex-1 items-center justify-center text-inherit"
                >
                  <Tab isFocused={focusedTab === 'casts'}>
                    <MessageSquareIcon
                      aria-hidden="true"
                      className={profileTabIconClassName}
                    />
                    <span className="sr-only">Casts</span>
                  </Tab>
                </LinkToProfileCasts>
                <LinkToProfileCastsAndReplies
                  title={`${user.displayName}'s casts and replies`}
                  user={user}
                  includeReason={includeReason}
                  sourceOn={sourceOn}
                  castHash={castHash}
                  className="flex h-full flex-1 items-center justify-center text-inherit"
                >
                  <Tab isFocused={focusedTab === 'castsAndReplies'}>
                    <MessagesSquareIcon
                      aria-hidden="true"
                      className={profileTabIconClassName}
                    />
                    <span className="sr-only">Replies and recasts</span>
                  </Tab>
                </LinkToProfileCastsAndReplies>
                <LinkToProfileAssets
                  title={`${user.displayName}'s assets`}
                  user={user}
                  includeReason={includeReason}
                  sourceOn={sourceOn}
                  castHash={castHash}
                  className="flex h-full flex-1 items-center justify-center text-inherit"
                >
                  <Tab isFocused={focusedTab === 'assets'}>
                    <WalletMinimalIcon
                      aria-hidden="true"
                      className={profileTabIconClassName}
                    />
                    <span className="sr-only">Assets</span>
                  </Tab>
                </LinkToProfileAssets>
                <LinkToProfileSnapCasts
                  title={`${user.displayName}'s snaps`}
                  user={user}
                  className="flex h-full flex-1 items-center justify-center text-inherit"
                >
                  <Tab isFocused={focusedTab === 'snaps'}>
                    <SnapIcon
                      size={20}
                      color="currentColor"
                      className={profileTabIconClassName}
                    />
                    <span className="sr-only">Snaps</span>
                  </Tab>
                </LinkToProfileSnapCasts>
                {isSignedIn && (
                  <LinkToProfileLikes
                    title={`${user.displayName}'s likes`}
                    user={user}
                    includeReason={includeReason}
                    sourceOn={sourceOn}
                    castHash={castHash}
                    className="flex h-full flex-1 items-center justify-center text-inherit"
                  >
                    <Tab isFocused={focusedTab === 'likes'}>
                      <HeartIcon
                        aria-hidden="true"
                        className={profileTabIconClassName}
                      />
                      <span className="sr-only">Likes</span>
                    </Tab>
                  </LinkToProfileLikes>
                )}
                {isSignedIn && (
                  <LinkToProfileStarterPacks
                    title={`${user.displayName}'s starter packs`}
                    user={user}
                    includeReason={includeReason}
                    sourceOn={sourceOn}
                    castHash={castHash}
                    className="flex h-full flex-1 items-center justify-center text-inherit"
                  >
                    <Tab isFocused={focusedTab === 'starterPacks'}>
                      <LayersIcon
                        aria-hidden="true"
                        className={profileTabIconClassName}
                      />
                      <span className="sr-only">Starter packs</span>
                    </Tab>
                  </LinkToProfileStarterPacks>
                )}
              </Tabs>
              <UserLinkHelpersProvider screenUserFid={user.fid}>
                {children}
              </UserLinkHelpersProvider>
            </>
          )}
        </BorderedMainContent>
      </Page>
    );
  },
);

ProfileContent.displayName = 'ProfileContent';

export { ProfileContent };
