import {
  BellIcon,
  KebabHorizontalIcon,
  PersonAddIcon,
} from '@primer/octicons-react';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiChannel } from 'farcaster-client-data';
import { useChannelActions } from 'farcaster-client-hooks';
import React from 'react';

import { ChannelDropdownMenu } from '~/components/channels/ChannelDropdownMenu';
import { ComposeCastButton } from '~/components/forms/buttons/ComposeCastButton';
import { BellCheckFillIcon } from '~/components/icons/BellCheckFillIcon';
import { ComposeCastModal } from '~/components/modals/ComposeCastModal';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { useUserChannelRole } from '~/hooks/useUserChannelRole';
type ChannelPageHeaderChannelsV3ActionsProps = {
  channel: ApiChannel;
};

const ChannelPageHeaderChannelsV3Actions: React.FC<ChannelPageHeaderChannelsV3ActionsProps> =
  React.memo(({ channel }) => {
    const { trackEvent } = useAnalytics();

    const { fid } = useCurrentUser();
    const role = useUserChannelRole(channel);
    const { following, notified, toggleNotified } = useChannelActions({
      channel,
      fid,
      location: 'channel sticky header',
    });

    const [isComposingCast, setIsComposingCast] = React.useState(false);

    const viewerCanManageChannel = React.useMemo(() => {
      return role === 'owner' || role === 'moderator';
    }, [role]);

    const viewerCanCast =
      channel.viewerContext.isMember || Boolean(channel.publicCasting);

    const navigate = useNavigate();
    const inviteUsers = React.useCallback(
      () =>
        navigate({
          to: 'channelSettingsSection',
          params: { channelKey: channel.key, section: 'invite' },
        }),
      [channel.key, navigate],
    );

    const channelHeaderActions = React.useMemo(() => {
      if (viewerCanManageChannel) {
        return (
          <>
            <>
              {}
              <button
                onClick={inviteUsers}
                className="flex size-[34px] cursor-pointer items-center justify-center rounded-full border-default text-default hover:bg-overlay-faint"
              >
                <PersonAddIcon size={16} />
              </button>
            </>
            <ChannelDropdownMenu channel={channel}>
              {}
              <button className="flex size-[34px] cursor-pointer items-center justify-center rounded-full border-default text-default hover:bg-overlay-faint">
                <KebabHorizontalIcon size={16} className="mt-0.5" />
              </button>
            </ChannelDropdownMenu>
            {viewerCanCast && (
              <ComposeCastButton
                onClick={() => {
                  trackEvent(AnalyticsEvent.AddCastModalShown, {
                    channelKey: channel.key,
                  });
                  setIsComposingCast(true);
                }}
                className="flex !h-[34px] items-center justify-center"
              >
                Cast
              </ComposeCastButton>
            )}
          </>
        );
      } else {
        const showKebab = following || role !== null;
        const showNotifyQuickAction =
          following && (role === 'member' || role === null);
        const actionsToHide = showNotifyQuickAction ? ['notify' as const] : [];

        return (
          <>
            {showNotifyQuickAction && (
              <>
                {}
                <button
                  onClick={toggleNotified}
                  className="flex size-[34px] cursor-pointer items-center justify-center rounded-full border-default text-default hover:bg-overlay-faint"
                >
                  {notified ? (
                    <BellCheckFillIcon size={16} />
                  ) : (
                    <BellIcon size={16} />
                  )}
                </button>
              </>
            )}
            {showKebab && (
              <ChannelDropdownMenu
                channel={channel}
                hideActions={actionsToHide}
              >
                <div className="flex size-[34px] cursor-pointer items-center justify-center rounded-full border-default text-default hover:bg-overlay-faint">
                  <KebabHorizontalIcon size={16} className="mt-0.5" />
                </div>
              </ChannelDropdownMenu>
            )}
            {viewerCanCast && (
              <ComposeCastButton
                onClick={() => {
                  trackEvent(AnalyticsEvent.AddCastModalShown, {
                    channelKey: channel.key,
                  });

                  setIsComposingCast(true);
                }}
                className="flex !h-[34px] items-center justify-center"
              >
                Cast
              </ComposeCastButton>
            )}
          </>
        );
      }
    }, [
      channel,
      following,
      inviteUsers,
      notified,
      role,
      toggleNotified,
      trackEvent,
      viewerCanManageChannel,
      viewerCanCast,
    ]);

    return (
      <>
        {channelHeaderActions}
        {isComposingCast && (
          <ComposeCastModal
            onClose={() => {
              setIsComposingCast(false);
            }}
            intent={{
              channelKey: channel.key,
            }}
            isIntentFromSearchParams={false}
          />
        )}
      </>
    );
  });

export { ChannelPageHeaderChannelsV3Actions };
