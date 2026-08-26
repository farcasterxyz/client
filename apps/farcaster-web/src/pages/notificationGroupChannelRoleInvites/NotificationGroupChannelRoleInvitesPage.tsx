import { ApiNotificationChannelRoleInvite } from 'farcaster-client-data';
import {
  formatChannelFollowerCount,
  resolveUsernameShort,
  useChannelDetails,
  useNotificationsInGroup,
} from 'farcaster-client-hooks';
import capitalize from 'lodash/capitalize';
import { FC, memo, useMemo } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { ChannelImage } from '~/components/channelsV3/ChannelImage';
import { DebugLogger } from '~/components/debug/DebugLogger';
import { BackButton } from '~/components/forms/buttons/BackButton';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { FlatList } from '~/components/lists/FlatList';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { useNavigateToChannel } from '~/hooks/navigation/useNavigateToChannel';
import { useSearchParams } from '~/hooks/navigation/useSearchParams';
import { useRespondToChannelInvite } from '~/hooks/useRespondToChannelInvite';
import { toast } from '~/utils/toast';

const NotificationGroupChannelRoleInvitesPage = memo(() => {
  const { groupId } = useSearchParams('notificationGroupChannelRoleInvites');

  const { data, onEndReached, isFetchingNextPage } = useNotificationsInGroup({
    groupId: groupId!,
    type: 'channel-role-invite',
  });

  const notifications = useMemo(
    () =>
      data?.pages
        .flatMap((page) => page.result.notifications)
        // Make sure we got what we expected and appease the type system
        .filter(
          (notif): notif is ApiNotificationChannelRoleInvite =>
            notif.type === 'channel-role-invite',
        ),
    [data?.pages],
  );

  const role = useMemo(
    () => notifications?.[0]?.content.role || '',
    [notifications],
  );

  const title = useMemo(() => `${capitalize(role)} Invites`, [role]);

  return (
    <Page meta={{ title: `Farcaster / ${title}` }}>
      <BorderedMainContent>
        <PageHeader hideCastButton>
          <PageTitle>
            <BackButton />
            {title}
          </PageTitle>
        </PageHeader>
        <DebugLogger
          name="Notification Channel Role Invites"
          data={notifications}
          position="top-left"
        />
        <FlatList
          data={notifications}
          emptyView={
            <DefaultEmptyListView message="Could not find any notifications" />
          }
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          onEndReached={onEndReached}
          isFetchingNextPage={isFetchingNextPage}
        />
      </BorderedMainContent>
    </Page>
  );
});
NotificationGroupChannelRoleInvitesPage.displayName =
  'NotificationGroupChannelRoleInvitesPage';

const renderItem = ({ item }: { item: ApiNotificationChannelRoleInvite }) => (
  <ListChannelRoleInviteNotification notif={item} />
);

interface ListChannelRoleInviteNotificationProps {
  notif: ApiNotificationChannelRoleInvite;
}

const ListChannelRoleInviteNotification: FC<ListChannelRoleInviteNotificationProps> =
  memo(({ notif }) => {
    const { accept, decline } = useRespondToChannelInvite();
    const navigateToChannel = useNavigateToChannel();

    const channel = notif.content.channel;
    const role = notif.content.role;

    const channelDetails = useChannelDetails({ key: channel.key });

    const channelInviter =
      channelDetails &&
      channelDetails.data.viewerContext?.invite &&
      channelDetails.data.viewerContext?.invite.inviter
        ? channelDetails.data.viewerContext?.invite.inviter
        : undefined;

    return (
      <div
        className="flex cursor-pointer flex-row items-center gap-3 border-b p-3 border-default hover:bg-overlay-faint"
        onClick={(e) => {
          navigateToChannel({
            channelKey: channel.key,
            openInNewTab: e.metaKey || e.ctrlKey,
          });
        }}
      >
        <ChannelImage
          channelImageUrl={channel.fastImageUrl}
          size="notification"
        />
        <div className="flex flex-1 flex-col self-center">
          <span className="font-semibold">/{channel.key}</span>
          <span className="mt-1 text-sm text-muted">
            {typeof channelInviter !== 'undefined' &&
              `${resolveUsernameShort({
                fid: channelInviter.fid,
                username: channelInviter.username,
              })} invited you`}
            {typeof channelInviter === 'undefined' &&
              channel.followerCount &&
              formatChannelFollowerCount(channel.followerCount)}
          </span>
        </div>
        <div className="flex flex-row gap-2">
          <DefaultButton
            variant="inverted"
            onClick={async (e) => {
              e.stopPropagation();

              await decline({
                channelKey: channel.key,
                role,
                location: 'invite notification',
              });

              toast({
                message: `Declined ${role} invitation for ${channel.name}`,
              });
            }}
          >
            Decline
          </DefaultButton>
          <DefaultButton
            variant="normal"
            onClick={async (e) => {
              e.stopPropagation();

              await accept({
                channelKey: channel.key,
                role,
                location: 'invite notification',
              });

              toast({
                message: `You are now a ${role} of ${channel.name}`,
              });
            }}
          >
            Accept
          </DefaultButton>
        </div>
      </div>
    );
  });
ListChannelRoleInviteNotification.displayName =
  'ListChannelRoleInviteNotification';

export { NotificationGroupChannelRoleInvitesPage };
