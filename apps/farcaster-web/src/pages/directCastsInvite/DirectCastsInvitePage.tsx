import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiDirectCastGroupInviteCriteria } from 'farcaster-client-data';
import {
  useChangeMemberInPlaintextDirectCastGroup,
  usePlaintextDirectCastGroupInvite,
} from 'farcaster-client-hooks';
import React, { useEffect, useMemo, useState } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { GroupConversationImage } from '~/components/directCasts/GroupConversationImage';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { FullScreenLoadingIndicator } from '~/components/loaders/FullScreenLoadingIndicator';
import { AppStoreRedirectsModal } from '~/components/modals/AppStoreRedirectsModal';
import { Page } from '~/components/page/Page';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useExternalNavigate } from '~/hooks/navigation/useExternalNavigate';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { useParams } from '~/hooks/navigation/useParams';
const DirectCastsInvitePage = React.memo(() => {
  const { inviteCode } = useParams('directCastsInvite');
  const { dangerouslyTrackPreAuthEvent } = useAnalytics();

  const user = useCurrentUser();

  const { data: invite, isPending } = usePlaintextDirectCastGroupInvite({
    fid: user?.fid || 0,
    inviteCode,
  });

  React.useEffect(() => {
    dangerouslyTrackPreAuthEvent(AnalyticsEvent.ViewDirectCastInvite, {
      conversationId: invite?.conversationId || '',
    });
  }, [dangerouslyTrackPreAuthEvent, invite?.conversationId]);

  return (
    <Page meta={{ title: 'Direct Casts / Invite' }}>
      <BorderedMainContent className="flex !min-h-dvh flex-col justify-center">
        <React.Suspense fallback={<FullScreenLoadingIndicator />}>
          <DirectCastsInvitePageContent invite={invite} isLoading={isPending} />
        </React.Suspense>
      </BorderedMainContent>
    </Page>
  );
});

DirectCastsInvitePage.displayName = 'DirectCastsInvitePage';

type DirectCastsInvitePageContentProps = {
  invite?: {
    conversationId: string;
    name: string;
    photoUrl?: string;
    participantCount: number;
    expired: boolean;
    inviteCode: string;
    meetsCriteria?: {
      followers?: boolean;
      hasActiveBadge?: boolean;
      hasCollectionIds?: boolean;
    };
    criteria?: ApiDirectCastGroupInviteCriteria;
  };
  isLoading: boolean;
};

const DirectCastsInvitePageContent: React.FC<
  DirectCastsInvitePageContentProps
> = ({ invite, isLoading }) => {
  const { dangerouslyTrackPreAuthEvent } = useAnalytics();
  const navigate = useNavigate();
  const externalNavigate = useExternalNavigate();
  const changeMembershipInPlaintextDirectCastGroup =
    useChangeMemberInPlaintextDirectCastGroup();
  const user = useCurrentUser();

  const [appStoreRedirectModalVisible, setAppStoreRedirectModalVisible] =
    React.useState<boolean>(false);
  const onAppStoreRedirectsModalClose = React.useCallback(() => {
    setAppStoreRedirectModalVisible(false);
  }, []);
  const [canJoin, setCanJoin] = useState<boolean>();

  const onCreateAccountClick = React.useCallback(
    (e: React.SyntheticEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      dangerouslyTrackPreAuthEvent(
        AnalyticsEvent.ClickDirectCastInviteCreateAccount,
        {
          conversationId: invite!.conversationId,
        },
      );

      const userAgent = navigator.userAgent || navigator.vendor;

      if (/android/i.test(userAgent)) {
        externalNavigate({
          to: 'https://play.google.com/store/apps/details?id=com.farcaster.mobile',
          openInNewTab: true,
        });
      } else if (/iPad|iPhone|iPod/.test(userAgent)) {
        externalNavigate({
          to: 'https://apps.apple.com/us/app/farcaster/id1600555445',
          openInNewTab: true,
        });
      } else {
        setAppStoreRedirectModalVisible(true);
      }
    },
    [dangerouslyTrackPreAuthEvent, invite, externalNavigate],
  );

  const onMobile = useMemo(() => {
    const userAgent = navigator.userAgent || navigator.vendor;
    return /android/i.test(userAgent) || /iPad|iPhone|iPod/.test(userAgent);
  }, []);

  const onClickJoin = React.useCallback(
    (e: React.SyntheticEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      dangerouslyTrackPreAuthEvent(AnalyticsEvent.ClientDirectCastInviteJoin, {
        conversationId: invite!.conversationId,
      });

      if (onMobile) {
        externalNavigate({
          to: `farcaster://group/${invite!.inviteCode}`,
          openInNewTab: true,
        });
      } else if (user) {
        changeMembershipInPlaintextDirectCastGroup({
          senderContext: {
            fid: user.fid,
            displayName: user.displayName,
            username: user.username ?? '',
          },
          conversationId: invite!.conversationId,
          participants: [user],
          inviteCode: invite!.inviteCode,
          action: 'add',
        }).then(async () => {
          await new Promise((resolve) => setTimeout(resolve, 500));
          dangerouslyTrackPreAuthEvent(AnalyticsEvent.JoinDirectCastsGroup, {
            conversationId: invite!.conversationId,
          });
          navigate({
            to: 'directCastsConversation',
            params: {
              conversationId: invite!.conversationId,
            },
          });
        });
      }
    },
    [
      changeMembershipInPlaintextDirectCastGroup,
      dangerouslyTrackPreAuthEvent,
      externalNavigate,
      invite,
      navigate,
      onMobile,
      user,
    ],
  );

  const onClickOpenWarpcast = React.useCallback(
    (e: React.SyntheticEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const userAgent = navigator.userAgent || navigator.vendor;

      if (/android/i.test(userAgent)) {
        externalNavigate({
          to: 'https://play.google.com/store/apps/details?id=com.farcaster.mobile',
          openInNewTab: true,
        });
      } else if (/iPad|iPhone|iPod/.test(userAgent)) {
        externalNavigate({
          to: 'https://apps.apple.com/us/app/farcaster/id1600555445',
          openInNewTab: true,
        });
      } else {
        navigate({
          to: 'homeFeed',
          params: {},
        });
      }
    },
    [externalNavigate, navigate],
  );

  useEffect(() => {
    if (invite?.criteria) {
      if (invite.criteria.followers && !invite.meetsCriteria?.followers) {
        setCanJoin(false);
        return;
      }

      if (
        (invite.criteria.hasCollectionIds?.length || 0) !== 0 &&
        !invite.meetsCriteria?.hasCollectionIds
      ) {
        setCanJoin(false);
        return;
      }

      setCanJoin(true);
    } else if (!isLoading) {
      setCanJoin(true);
    } else {
      setCanJoin(true);
    }
  }, [invite, isLoading]);

  return (
    <div className="mx-auto flex max-w-lg flex-col space-y-4 rounded border-0 p-10 border-default sm:border">
      <div className="flex w-full flex-col items-center space-y-4 border-b pb-4 border-default sm:w-96">
        <GroupConversationImage size={'xl2'} imageURL={invite?.photoUrl} />
        <span className="text-2xl font-semibold">
          {!invite?.expired ? (invite?.name ?? 'Expired Link') : 'Expired Link'}
        </span>
      </div>
      <div className="flex flex-col items-center">
        {!onMobile && !user ? (
          <>
            <span>To join the group, create an account</span>
            <DefaultButton
              className="!my-6 h-[36px] !bg-green-700 hover:!bg-green-800 active:!bg-green-900"
              onClick={onCreateAccountClick}
            >
              Create Account
            </DefaultButton>
          </>
        ) : (
          <>
            {canJoin ? (
              <span className="mb-2">You can join the group.</span>
            ) : (
              <span className="mb-2">You cannot join the group.</span>
            )}
            {invite?.criteria ? (
              <>
                {invite.meetsCriteria?.followers !== undefined ? (
                  invite.meetsCriteria?.followers === false ? (
                    <span className="mb-2">
                      The host must be following you.
                    </span>
                  ) : (
                    <></>
                  )
                ) : (
                  <></>
                )}
                {invite.meetsCriteria?.hasCollectionIds !== undefined ? (
                  invite.meetsCriteria?.hasCollectionIds === false ? (
                    <span className="mb-2">
                      You don't have the required onchain collection
                      memberships.
                    </span>
                  ) : (
                    <span className="mb-2">
                      You have the required onchain collection memberships.
                    </span>
                  )
                ) : (
                  <></>
                )}
              </>
            ) : (
              <></>
            )}
            {invite?.expired && (
              <span>Message the host to send you a new one</span>
            )}
            {!invite?.expired &&
              (invite!.participantCount >= 1000 ? (
                <span>Groups can have a maximum 1000 users</span>
              ) : (
                <DefaultButton
                  className="!my-6 h-[36px]"
                  onClick={onClickJoin}
                  disabled={!canJoin}
                >
                  Join
                </DefaultButton>
              ))}
          </>
        )}
        <div onClick={onClickOpenWarpcast}>
          <span className="cursor-pointer text-sm text-muted hover:underline active:underline">
            Open Farcaster
          </span>
        </div>
        {appStoreRedirectModalVisible && (
          <AppStoreRedirectsModal onClose={onAppStoreRedirectsModalClose} />
        )}
      </div>
    </div>
  );
};

DirectCastsInvitePageContent.displayName = 'DirectCastsInvitePageContent';

export { DirectCastsInvitePage };
