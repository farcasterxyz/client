import {
  CheckIcon,
  ChevronDownIcon,
  LinkIcon,
  PersonAddIcon,
  ShareIcon,
} from '@primer/octicons-react';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiChannel, ApiChannelUserInvite } from 'farcaster-client-data';
import {
  formatShorthandNumber,
  resolveUsernameShort,
  useNonSuspenseChannelDetails,
} from 'farcaster-client-hooks';
import React, { useCallback, useMemo } from 'react';

import { AvatarImage } from '~/components/avatar/AvatarImage';
import { PersonCircleIcon } from '~/components/casts/actions/icons/PersonCircleIcon';
import { ChannelDropdownMenu } from '~/components/channels/ChannelDropdownMenu';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { FollowChannelButton } from '~/components/forms/buttons/FollowChannelButton';
import { ShieldCheckFillIcon } from '~/components/icons/ShieldCheckFillIcon';
import { LinkToChannelFollowers } from '~/components/links/LinkToChannelFollowers';
import { LinkToChannelMembers } from '~/components/links/LinkToChannelMembers';
import { ImageLightboxModal } from '~/components/modals/ImageLightboxModal';
import { LinkifiedText } from '~/components/text/LinkifiedText';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
// Frames v1 deprecated: legacy frame launcher removed
import { useMinimizableWindowContext } from '~/contexts/MinimizableWindowProvider';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { useExternalNavigate } from '~/hooks/navigation/useExternalNavigate';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { useRespondToChannelInvite } from '~/hooks/useRespondToChannelInvite';
import { useUserChannelRole } from '~/hooks/useUserChannelRole';

import { ChannelImage } from './ChannelImage';

type ChannelHeaderChannelMetadataProps = {
  conversationView: boolean;
  channel: ApiChannel;
};

const ChannelHeaderChannelMetadata: React.FC<ChannelHeaderChannelMetadataProps> =
  React.memo(({ conversationView, channel }) => {
    const { trackEvent } = useAnalytics();

    const isSignedIn = useIsSignedIn();

    const navigate = useNavigate();
    const externalNavigate = useExternalNavigate();

    // we only need details to fetch the invite
    // disable suspense so that unfollowing doesn't trigger suspense
    const channelDetails = useNonSuspenseChannelDetails(
      { key: channel.key },
      {
        enabled: !channel.viewerContext.isMember,
        staleTime: 0, // ensure invite always shows up if present
      },
    );

    // Frames v1 deprecated
    const { launchMiniApp } = useMinimizableWindowContext();

    const onChannelHeaderActionClick = React.useCallback(() => {
      if (typeof channel.headerAction === 'undefined') {
        return;
      }

      trackEvent(AnalyticsEvent.ClickChannelHeaderAction, {
        channel: channel.key,
        title: channel.headerAction.title,
        url: channel.headerAction.target,
        frame:
          typeof channel.headerActionMetadata !== 'undefined' &&
          typeof channel.headerActionMetadata.frame !== 'undefined' &&
          typeof channel.headerActionMetadata.frame.frameUrl !== 'undefined',
      });

      if (
        typeof channel.headerActionMetadata !== 'undefined' &&
        typeof channel.headerActionMetadata.frameEmbedNext !== 'undefined' &&
        typeof channel.headerActionMetadata.frameEmbedNext.frameEmbed
          ?.button !== 'undefined' &&
        (channel.headerActionMetadata.frameEmbedNext.frameEmbed.button.action
          .type === 'launch_frame' ||
          channel.headerActionMetadata.frameEmbedNext.frameEmbed.button.action
            .type === 'launch_miniapp')
      ) {
        launchMiniApp({
          launchConfig: {
            ...channel.headerActionMetadata.frameEmbedNext.frameEmbed.button
              .action,
            url:
              channel.headerActionMetadata.frameEmbedNext.frameEmbed.button
                .action.url || '',
            author: channel.headerActionMetadata.frameEmbedNext.author,
            type: 'standalone',
          },
          context: {
            type: 'channel',
            channel: {
              key: channel.key,
              name: channel.name,
              imageUrl: channel.imageUrl,
            },
          },
        });
      } else {
        externalNavigate({
          to: channel.headerAction.target,
          openInNewTab: true,
        });
      }
    }, [
      channel.headerAction,
      channel.key,
      channel.headerActionMetadata,
      channel.name,
      channel.imageUrl,
      trackEvent,
      launchMiniApp,
      externalNavigate,
    ]);

    const role = useUserChannelRole(channel);
    const viewerCanManageChannel = React.useMemo(() => {
      return role === 'owner' || role === 'moderator';
    }, [role]);

    const [isModalVisible, setIsModalVisible] = React.useState(false);

    const manage = useCallback(() => {
      navigate({
        to: 'channelSettings',
        params: { channelKey: channel.key },
      });
    }, [channel.key, navigate]);

    const invite = useCallback(() => {
      navigate({
        to: 'channelSettingsSection',
        params: { channelKey: channel.key, section: 'invite' },
      });
    }, [channel.key, navigate]);

    const buttonL = useMemo(() => {
      if (viewerCanManageChannel) {
        return (
          <DefaultButton
            onClick={manage}
            variant="secondary"
            className="flex flex-row items-center !justify-center gap-2 !font-semibold !bg-elevated text-default"
          >
            <ShieldCheckFillIcon size={16} />
            Manage
          </DefaultButton>
        );
      }

      if (role === 'member') {
        return (
          <>
            <ChannelDropdownMenu channel={channel} relationOnly={true}>
              <DefaultButton
                variant="secondary"
                className="flex flex-row items-center !justify-center gap-2 !font-semibold !bg-elevated text-default"
              >
                <PersonCircleIcon size={16} />
                Member
                <ChevronDownIcon size={16} />
              </DefaultButton>
            </ChannelDropdownMenu>
          </>
        );
      }

      return (
        <React.Suspense>
          <FollowChannelButton channel={channel} className="w-full" />
        </React.Suspense>
      );
    }, [channel, manage, role, viewerCanManageChannel]);

    const [copiedLink, setCopiedLink] = React.useState<boolean>(false);

    const onCopyClick = React.useCallback(() => {
      navigator.clipboard.writeText(
        `https://farcaster.xyz/~/channel/${channel.key}`,
      );

      setCopiedLink(true);
      setTimeout(() => {
        setCopiedLink(false);
      }, 2000);
    }, [channel.key]);

    const buttonR = useMemo(() => {
      if (viewerCanManageChannel) {
        return (
          <DefaultButton
            onClick={invite}
            variant="secondary"
            className="flex flex-row items-center !justify-center gap-2 !font-semibold !bg-elevated text-default"
          >
            <PersonAddIcon size={16} />
            Invite
          </DefaultButton>
        );
      }
      return (
        <DefaultButton
          title="Share"
          variant="secondary"
          className="flex flex-row items-center !justify-center gap-2 !font-semibold !bg-elevated text-default "
          onClick={onCopyClick}
        >
          {copiedLink ? (
            <>
              <CheckIcon size={16} />
              Copied!
            </>
          ) : (
            <>
              <ShareIcon size={16} />
              Share
            </>
          )}
        </DefaultButton>
      );
    }, [copiedLink, invite, onCopyClick, viewerCanManageChannel]);

    if (conversationView) {
      return null;
    }

    const channelInvite = channelDetails.data?.viewerContext?.invite;

    return (
      <div className="relative flex w-full flex-col">
        <div className={'z-[1] flex w-full flex-col border-b border-default'}>
          <div className="mt-[-48px] flex flex-row items-end justify-between px-4 pr-1">
            <div
              className="shrink-0 cursor-pointer rounded-full border-[3px] border-white bg-elevated"
              onClick={() => setIsModalVisible(true)}
            >
              <ChannelImage
                channelImageUrl={channel.imageUrl}
                size="channel-headers"
              />
            </div>
            <div className="flex flex-row">
              <LinkToChannelMembers
                title={`Users members`}
                channelKey={channel.key}
                className="flex shrink-0 flex-col items-center border-r px-3 text-center text-muted border-default"
              >
                <span className="font-semibold text-default">
                  {formatShorthandNumber(channel.memberCount || 0)}
                </span>
                <span className="text-sm">
                  &nbsp;{channel.memberCount === 1 ? 'member' : 'members'}
                </span>
              </LinkToChannelMembers>
              <LinkToChannelFollowers
                title={`Users followers`}
                channelKey={channel.key}
                className="flex shrink-0 flex-col items-center px-3 text-center text-muted"
              >
                <span className="font-semibold text-default">
                  {formatShorthandNumber(channel.followerCount || 0)}
                </span>
                <span className="text-sm">
                  &nbsp;{channel.followerCount === 1 ? 'follower' : 'followers'}
                </span>
              </LinkToChannelFollowers>
            </div>
          </div>
          <div className="relative mt-2 flex flex-1 flex-col overflow-hidden px-4 pb-3">
            <div className="flex flex-row items-center">
              <div className="text-2xl font-semibold text-default">
                {channel.name}
              </div>
            </div>
            <div className="flex flex-row items-center">
              <div className="shrink-0 text-faint">/{channel.key}</div>
              {typeof channel.headerAction !== 'undefined' && isSignedIn && (
                <span className="flex flex-row items-center pl-2 text-faint">
                  {' '}
                  ·{' '}
                  <div
                    className="dark:text-light-app-background ml-2 flex cursor-pointer flex-row items-center space-x-1 rounded-full bg-[#7C65C133] px-2 py-0.5 text-xs text-[#7c65c1]"
                    onClick={onChannelHeaderActionClick}
                  >
                    {typeof channel.headerActionMetadata !== 'undefined' &&
                    typeof channel.headerActionMetadata.frame !==
                      'undefined' ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="size-3"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                        />
                      </svg>
                    ) : (
                      <LinkIcon size={12} />
                    )}
                    <span>{channel.headerAction.title}</span>
                  </div>
                </span>
              )}
            </div>
            {typeof channel.description !== 'undefined' && (
              <span className="my-2 text-default">
                <LinkifiedText
                  content={channel.description}
                  mentions={channel.descriptionMentionedUsernames}
                  channelMentions={[]}
                  tokenMentions={undefined}
                  tokenMentionsV2={undefined}
                />
              </span>
            )}
            <div className="mt-2">
              {(() => {
                if (channelInvite) {
                  return (
                    <Invite invite={channelInvite} channelKey={channel.key} />
                  );
                }

                return (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {buttonL}
                    {buttonR}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
        {isModalVisible && typeof channel.imageUrl !== 'undefined' && (
          <ImageLightboxModal
            title={'Channel iamge'}
            imageUrls={[channel.imageUrl]}
            initialIndex={0}
            onClose={() => {
              setIsModalVisible(false);
            }}
          />
        )}
      </div>
    );
  });

ChannelHeaderChannelMetadata.displayName = 'ChannelHeaderChannelMetadata';

function Invite({
  invite,
  channelKey,
}: {
  invite: ApiChannelUserInvite;
  channelKey: string;
}) {
  const { accept, decline } = useRespondToChannelInvite();

  const [inviteMessage, acceptMessage] = useMemo(() => {
    const inviterName = invite.inviter
      ? resolveUsernameShort(invite.inviter)
      : 'Someone';
    switch (invite.role) {
      case 'member':
        return [
          `${inviterName} invited you to join`,
          'Accept to cast and reply in this channel.',
        ];
      case 'moderator':
        return [
          `${inviterName} invited you to moderate`,
          'Accept to manage members and content',
        ];
    }
  }, [invite.inviter, invite.role]);

  return (
    <div className="flex flex-row items-center justify-between rounded-[10px] p-4 bg-elevated border-default">
      <div className="flex shrink flex-row items-center gap-2">
        <AvatarImage
          imgUrl={invite.inviter?.pfp?.url}
          imgAlt={`${invite.inviter?.displayName} profile picture`}
          size="sm2"
        />
        <div>
          <div className="font-semibold">{inviteMessage}</div>
          <div className="text-sm text-muted">{acceptMessage}</div>
        </div>
      </div>
      <div className="flex flex-none flex-row items-center gap-2">
        <DefaultButton
          variant="secondary"
          onClick={() => {
            decline({
              channelKey,
              role: invite.role,
              location: 'channel page',
            });
          }}
        >
          Decline
        </DefaultButton>
        <DefaultButton
          onClick={() => {
            accept({
              channelKey,
              role: invite.role,
              location: 'channel page',
            });
          }}
          variant="normal"
        >
          Accept
        </DefaultButton>
      </div>
    </div>
  );
}

export { ChannelHeaderChannelMetadata };
