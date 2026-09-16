import { AnalyticsEvent } from 'farcaster-analytics';
import {
  getFirstApiErrorBody,
  isHandledFetchError,
} from 'farcaster-client-data';
import { useChannel, useJoinChannelViaCode } from 'farcaster-client-hooks';
import React, { useMemo, useState } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { ChannelImage } from '~/components/channelsV3/ChannelImage';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { FullScreenLoadingIndicator } from '~/components/loaders/FullScreenLoadingIndicator';
import { AckModal } from '~/components/modals/AckModal';
import { AppStoreRedirectsModal } from '~/components/modals/AppStoreRedirectsModal';
import { Page } from '~/components/page/Page';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useExternalNavigate } from '~/hooks/navigation/useExternalNavigate';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { useParams } from '~/hooks/navigation/useParams';
import { useSearchParams } from '~/hooks/navigation/useSearchParams';
import { trackError } from '~/utils/errorUtils';
import { toast } from '~/utils/toast';

const ChannelJoinViaCodePage = React.memo(() => {
  const { channelKey } = useParams('channelJoinViaCode');
  const { inviteCode } = useSearchParams('channelJoinViaCode');
  const { dangerouslyTrackPreAuthEvent } = useAnalytics();

  React.useEffect(() => {
    dangerouslyTrackPreAuthEvent(AnalyticsEvent.ViewJoinChannelViaInviteCode, {
      channelKey,
    });
  }, [channelKey, dangerouslyTrackPreAuthEvent]);

  return (
    <Page meta={{ title: 'Direct Casts / Invite' }}>
      <BorderedMainContent className="flex !min-h-dvh flex-col justify-center">
        <React.Suspense fallback={<FullScreenLoadingIndicator />}>
          <ChannelJoinViaCodePageContent
            channelKey={channelKey}
            inviteCode={inviteCode ?? ''}
          />
        </React.Suspense>
      </BorderedMainContent>
    </Page>
  );
});

ChannelJoinViaCodePage.displayName = 'ChannelJoinViaCodePage';

type ChannelJoinViaCodePageContentProps = {
  channelKey: string;
  inviteCode: string;
};

const ChannelJoinViaCodePageContent: React.FC<
  ChannelJoinViaCodePageContentProps
> = ({ channelKey, inviteCode }) => {
  const user = useCurrentUser();
  const { data: channel } = useChannel({ key: channelKey });

  const { dangerouslyTrackPreAuthEvent } = useAnalytics();
  const navigate = useNavigate();
  const externalNavigate = useExternalNavigate();
  const currentUser = useCurrentUser();

  const [appStoreRedirectModalVisible, setAppStoreRedirectModalVisible] =
    React.useState<boolean>(false);
  const onAppStoreRedirectsModalClose = React.useCallback(() => {
    setAppStoreRedirectModalVisible(false);
  }, []);

  const onMobile = useMemo(() => {
    const userAgent = navigator.userAgent;
    return /android/i.test(userAgent) || /iPad|iPhone|iPod/.test(userAgent);
  }, []);

  const onClickOpenWarpcast = React.useCallback(
    (e: React.SyntheticEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const userAgent = navigator.userAgent;
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

  const onCreateAccountClick = React.useCallback(
    (e: React.SyntheticEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      dangerouslyTrackPreAuthEvent(
        AnalyticsEvent.ClickCreateAccountFromJoinChannel,
        {
          channelKey,
        },
      );

      const userAgent = navigator.userAgent;
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
    [channelKey, dangerouslyTrackPreAuthEvent, externalNavigate],
  );

  const joinChannelViaInviteCode = useJoinChannelViaCode();

  const [showBanend, setShowBanned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const accept = async () => {
    try {
      setSubmitting(true);
      await joinChannelViaInviteCode({
        channelKey,
        inviteCode,
        fid: currentUser.fid,
      });

      // no toast provider here
      // toast({ message: `You've joined ${channel?.name}`, type: 'success' });
      navigate({ to: 'channel', params: { channelKey } });
    } catch (e) {
      const apiError = getFirstApiErrorBody(e);
      if (apiError && apiError.reason === 'invalid_invite_code') {
        toast({ message: 'Invite code is no longer valid', type: 'error' });
        return;
      }

      if (apiError && apiError.reason === 'banned_from_channel') {
        setShowBanned(true);
        return;
      }

      if (isHandledFetchError(e)) {
        return;
      }

      trackError(e);
    } finally {
      setSubmitting(false);
    }
  };

  const memberCount = channel!.memberCount ?? 1;
  const memberLabelString = memberCount > 1 ? 'members' : 'member';
  const memberCountString = memberCount.toLocaleString();

  const followerCount = channel!.followerCount ?? 1;
  const follwerLabelString = followerCount > 1 ? 'followers' : 'follower';
  const followerCountString = followerCount.toLocaleString();

  return (
    <div className="mx-auto flex max-w-lg flex-col space-y-4 rounded border-0 p-10 border-default sm:border">
      <div className="flex w-[225px] flex-col items-center space-y-2 sm:w-96">
        <ChannelImage size="108" channelImageUrl={channel!.fastImageUrl} />
        <div className="text-2xl font-semibold">/{channel!.key}</div>
        <div className="text-sm text-faint">
          {memberCountString} {memberLabelString}
          <> · </>
          {followerCountString} {follwerLabelString}
        </div>
        <div className="text-center text-muted">{channel!.description}</div>
      </div>
      <div className="flex flex-col items-center space-y-2 pt-4">
        {!onMobile && !user ? (
          <>
            <div className="text-sm text-muted">
              To join the group, create an account
            </div>
            <DefaultButton
              onClick={onCreateAccountClick}
              size="lg"
              className="h-[54px] w-full"
            >
              Create Account
            </DefaultButton>
          </>
        ) : (
          <DefaultButton
            size="lg"
            onClick={accept}
            className="h-[54px] w-full"
            disabled={submitting}
          >
            Join channel
          </DefaultButton>
        )}
        {}
        <button
          onClick={onClickOpenWarpcast}
          className="cursor-pointer pt-4 text-sm text-faint hover:underline active:underline"
        >
          Open Farcaster
        </button>
        {appStoreRedirectModalVisible && (
          <AppStoreRedirectsModal onClose={onAppStoreRedirectsModalClose} />
        )}
        {showBanend && (
          <AckModal
            ackText="Ok"
            onAck={() => setShowBanned(false)}
            onBackdropClose={() => setShowBanned(false)}
            title="Access restricted"
            body={
              <>
                <div>
                  You were previously removed from this channel. As a result,
                  your access via this invite link has been denied.
                </div>
                <div className="mt-4 text-muted">
                  If you believe this is an error or wish to appeal, please
                  contact a moderator for assistance.
                </div>
              </>
            }
          />
        )}
      </div>
    </div>
  );
};

ChannelJoinViaCodePageContent.displayName = 'ChannelJoinViaCodePageContent';

export { ChannelJoinViaCodePage };
