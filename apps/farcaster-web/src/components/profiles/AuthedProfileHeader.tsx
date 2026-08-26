import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiCastFeedIncludeReason,
  ApiUserProfile,
} from 'farcaster-client-data';
import {
  buildNonGroupConversationId,
  resolveUsername,
  useGloballyCachedUser,
  useNonSuspenseUserByFid,
  useOptimisticallyAddNewDirectCastConversationToInbox,
  usePrefetchUserCastsAndReplies,
  usePrefetchUserLikedCasts,
} from 'farcaster-client-hooks';
import React, {
  FC,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { FarcasterProBadgeOnProfileUpsell } from '~/components/farcasterPro/FarcasterProUpsellBubble';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { FollowButton } from '~/components/forms/buttons/FollowButton';
import { LinkToFollowers } from '~/components/links/LinkToFollowers';
import { LinkToFollowing } from '~/components/links/LinkToFollowing';
import { AlertModal } from '~/components/modals/AlertModal';
import { FollowCount } from '~/components/profiles/FollowCount';
import { LinkifiedText } from '~/components/text/LinkifiedText';
import { Tooltip } from '~/components/Tooltip';
import { FollowsYou } from '~/components/users/FollowsYou';
import { UserDisplayNameWithBadges } from '~/components/users/UserDisplayNameWithBadges';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useNavigateToDirectCastsConversation } from '~/hooks/navigation/useNavigateToDirectCastsConversation';
import { hasProfileLocation, hasProfileToken } from '~/utils/profile';

import { ProfileConnectedAccountsSection } from './headerSections/ProfileConnectedAccountsSection';
import { ProfileFollowersYouKnowSection } from './headerSections/ProfileFollowersYouKnowSection';
import { ProfileLocationSection } from './headerSections/ProfileLocationSection';
import { ProfileTokenSection } from './headerSections/ProfileTokenSection';
import { ProfileUrlSection } from './headerSections/ProfileUrlSection';

type AuthedProfileHeaderProps = {
  userProfile: ApiUserProfile;
  profileOpenIncludeReason?: ApiCastFeedIncludeReason['type'];
  profileOpenCastHash?: string;
};

const AuthedProfileHeader: FC<AuthedProfileHeaderProps> = memo(
  ({ userProfile, profileOpenIncludeReason, profileOpenCastHash }) => {
    const { user: fallbackUser } = userProfile;
    const currentUser = useCurrentUser();

    const { data: userByFidData } = useNonSuspenseUserByFid({
      fid: fallbackUser.fid,
      enabled: fallbackUser.fid === currentUser.fid,
    });

    const user = useGloballyCachedUser({
      fallback: userByFidData?.result.user || fallbackUser,
    });

    const [showBlockedAlert, setShowBlockedAlert] = useState(false);

    const prefetchUserCastsAndReplies = usePrefetchUserCastsAndReplies();
    const prefetchUserLikedCasts = usePrefetchUserLikedCasts();

    const shouldShowExtraProfileSections = useMemo(() => {
      const hasConnectedAccounts =
        typeof user.connectedAccounts !== 'undefined' &&
        user.connectedAccounts.length !== 0;
      const hasLocation = hasProfileLocation(user.profile?.location);
      const hasToken = hasProfileToken(user.profile?.profileToken);

      const hasExtraProfileData =
        hasConnectedAccounts || hasLocation || hasToken;

      const hasVisibleExtraProfileData =
        hasExtraProfileData && !user.viewerContext?.invisible;

      return user.fid === currentUser.fid || hasVisibleExtraProfileData;
    }, [
      currentUser.fid,
      user.connectedAccounts,
      user.fid,
      user.profile?.location,
      user.profile?.profileToken,
      user.viewerContext?.invisible,
    ]);

    const shouldShowFollowAndPayActions = useMemo(() => {
      return user.fid !== currentUser.fid && !user.viewerContext?.invisible;
    }, [currentUser.fid, user.fid, user.viewerContext?.invisible]);

    const addNewOptimisticConversation =
      useOptimisticallyAddNewDirectCastConversationToInbox();
    const navigateToDirectCastsConversation =
      useNavigateToDirectCastsConversation();

    const currentUserIsFollowedByUser = useMemo(() => {
      return (
        typeof user.viewerContext !== 'undefined' &&
        user.viewerContext.followedBy
      );
    }, [user.viewerContext]);

    const { trackEvent } = useAnalytics();

    const onMessagePress = useCallback(() => {
      if (
        typeof user.viewerContext !== 'undefined' &&
        typeof user.viewerContext.blockedBy !== 'undefined' &&
        user.viewerContext.blockedBy
      ) {
        setShowBlockedAlert(true);

        return;
      }

      trackEvent(AnalyticsEvent.ClickProfileDirectCast, {});

      const conversationId = buildNonGroupConversationId({
        participantFids: [user.fid, currentUser.fid],
      });

      addNewOptimisticConversation({
        currentUser,
        conversationId,
        counterParties: [user],
      });
      navigateToDirectCastsConversation({
        conversationId: conversationId,
      });
    }, [
      addNewOptimisticConversation,
      currentUser,
      navigateToDirectCastsConversation,
      trackEvent,
      user,
    ]);

    useEffect(() => {
      prefetchUserCastsAndReplies({ fid: user.fid });
      prefetchUserLikedCasts({ fid: user.fid });
    }, [prefetchUserCastsAndReplies, prefetchUserLikedCasts, user.fid]);

    return (
      <>
        <div className="p-4 pt-2">
          <div className="flex w-full flex-row items-start">
            <div className="min-w-0 flex-auto space-y-3">
              <div className="flex flex-row items-center justify-between">
                <div className="flex flex-col">
                  <div className="flex flex-row items-center">
                    <div className="flex-1">
                      <UserDisplayNameWithBadges user={user} style="header" />
                    </div>
                    <FarcasterProBadgeOnProfileUpsell
                      userProfile={userProfile}
                    />
                  </div>
                  <div className="flex flex-row items-center">
                    <div className="mr-1 text-base text-faint">
                      {resolveUsername({
                        username: user.username,
                        fid: user.fid,
                      })}
                    </div>
                    {currentUserIsFollowedByUser && <FollowsYou />}
                  </div>
                </div>
              </div>
              {user.profile.bio && (
                <div className="mt-1 max-w-[480px] break-gracefully">
                  <LinkifiedText
                    content={user.profile.bio.text}
                    mentions={user.profile.bio.mentions}
                    channelMentions={user.profile.bio.channelMentions}
                    tokenMentions={undefined}
                    tokenMentionsV2={undefined}
                  />
                </div>
              )}

              {typeof user.profile.url !== 'undefined' &&
                user.profile.url !== '' && (
                  <div className="flex flex-row items-center">
                    <ProfileUrlSection url={user.profile.url} />
                  </div>
                )}

              {shouldShowExtraProfileSections && (
                <div className="flex flex-row items-center space-x-2">
                  <ProfileTokenSection user={user} />
                  <ProfileLocationSection user={user} />
                  <ProfileConnectedAccountsSection user={user} />
                </div>
              )}
              <div className="flex w-full flex-row flex-wrap gap-2">
                <LinkToFollowing title={''} user={user}>
                  <Tooltip
                    trigger={
                      <div>
                        <FollowCount
                          count={user.followingCount}
                          label="Following"
                        />
                      </div>
                    }
                    content={
                      <div className="px-1 text-sm text-white">
                        {user.followingCount}
                      </div>
                    }
                  />
                </LinkToFollowing>
                <LinkToFollowers title={''} user={user}>
                  <Tooltip
                    trigger={
                      <div>
                        <FollowCount
                          count={user.followerCount}
                          label="Followers"
                        />
                      </div>
                    }
                    content={
                      <div className="px-1 text-sm text-white">
                        {user.followerCount}
                      </div>
                    }
                  />
                </LinkToFollowers>
              </div>
              {user.fid !== currentUser.fid && user.followerCount !== 0 && (
                <div className="mt-4">
                  <ProfileFollowersYouKnowSection user={user} />
                </div>
              )}
              {shouldShowFollowAndPayActions && (
                <div className="grid grid-cols-2 gap-3">
                  <FollowButton
                    user={user}
                    className="shrink-0"
                    withDetailsPopover={true}
                    includeReason={profileOpenIncludeReason}
                    castHash={profileOpenCastHash}
                  />
                  {user.fid !== currentUser.fid && (
                    <DefaultButton
                      title="Message"
                      variant="muted"
                      className="flex flex-row items-center !justify-center !font-semibold text-default"
                      onClick={onMessagePress}
                    >
                      <span className="ml-[10px]">Message</span>
                    </DefaultButton>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        {showBlockedAlert && (
          <AlertModal onOk={() => setShowBlockedAlert(false)}>
            <div className="pb-3 text-lg font-semibold">Unable to message</div>
            <div>
              {resolveUsername({
                username: user.username,
                fid: user.fid,
              })}{' '}
              has blocked you.
            </div>
          </AlertModal>
        )}
      </>
    );
  },
);

AuthedProfileHeader.displayName = 'AuthedProfileHeader';

export { AuthedProfileHeader };
