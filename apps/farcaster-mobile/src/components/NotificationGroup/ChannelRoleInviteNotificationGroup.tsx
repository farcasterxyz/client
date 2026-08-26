import { Octicons } from '@expo/vector-icons';
import {
  ApiChannelRoleInviteNotificationGroup,
  ApiChannelUserInviteRole,
  ApiNotificationChannelRoleInvite,
  ApiNotificationGroup,
} from 'farcaster-client-data';
import {
  formatChannelFollowerCount,
  renderChannelKey,
  resolveUsernameShort,
  useChannelDetails,
} from 'farcaster-client-hooks';
import capitalize from 'lodash/capitalize';
import React, { FC, memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { ButtonV2 } from '~/components/ButtonV2';
import { ChannelMembersYouKnow } from '~/components/channels/ChannelMembersYouKnow';
import { FeedImage } from '~/components/FeedImage';
import { PersonCircleIcon } from '~/components/images/PersonCircleIcon';
import { Text2 } from '~/components/Text';
import { sizes, useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';
import { useRespondToChannelInvite } from '~/hooks/useRespondToChannelInvite';

import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';
import { NotificationIcon } from './shared/NotificationIcon';
import { NotificationTitleText } from './shared/NotificationTitleText';

type ChannelRoleInviteNotificationGroupProps = {
  group: ApiChannelRoleInviteNotificationGroup;
};

const ChannelRoleInviteNotificationGroup: FC<ChannelRoleInviteNotificationGroupProps> =
  memo(({ group }) => {
    // We can have a case where we have many total items but only 1 preview item, e.g.
    // if the user has accepted the other (and they were removed) but didn't refresh the
    // notifications feed. Only show a single invite if it's really one, otherwise
    // show the summary which know what to do.
    if (group.previewItems.length === 1 && group.totalItemCount === 1) {
      return (
        <ChannelRoleInviteNotification
          group={group}
          notif={group.previewItems[0]}
        />
      );
    } else {
      return <ChannelRoleInviteNotificationsSummary group={group} />;
    }
  });

ChannelRoleInviteNotificationGroup.displayName =
  'ChannelRoleInviteNotificationGroup';

const ChannelRoleInviteNotificationsSummary: FC<ChannelRoleInviteNotificationGroupProps> =
  memo(({ group }) => {
    const push = usePush();
    const t = useTheme();

    const invites = useMemo(() => group.previewItems, [group.previewItems]);
    const firstChannel = useMemo(
      () => (invites.length === 0 ? undefined : invites[0].content.channel),
      [invites],
    );

    const role = useMemo(() => {
      if (invites.length === 0) {
        // Being here means the user accepted all the preview invites but we still have some for which
        // we have no preview, which means we don't have a good source for the role. So we take
        // the role from the group id since it's the rollup key
        const idParts = group.id.split(':');
        return idParts[idParts.length - 1] as ApiChannelUserInviteRole;
      } else {
        return invites[0].content.role;
      }
    }, [group.id, invites]);

    const totalInvites = useMemo(
      () => group.totalItemCount,
      [group.totalItemCount],
    );

    const channelsText = useMemo(() => {
      if (invites.length === 2 && totalInvites === 2) {
        return (
          <>
            <Text2 weight="bold">
              {renderChannelKey(invites[0].content.channel.key)}
            </Text2>
            {' and '}
            <Text2 weight="bold">
              {renderChannelKey(invites[1].content.channel.key)}
            </Text2>
          </>
        );
      } else if (firstChannel) {
        // totalInvites is > 1 otherwise we would have rendered the single invite component
        return (
          <>
            <Text2 weight="bold">{renderChannelKey(firstChannel.key)}</Text2>{' '}
            and {totalInvites - 1} other channels
          </>
        );
      } else if (totalInvites > 1) {
        return <>{totalInvites} channels</>;
      } else {
        return <>{totalInvites} channel</>;
      }
    }, [firstChannel, invites, totalInvites]);

    return (
      <NotificationGroupOuterContainer
        group={group}
        onPress={() => {
          push('NotificationsInGroup', {
            groupId: group.id,
            type: group.type,
            title: `${capitalize(role)} Invites`,
          });
        }}
      >
        <NotificationIcon variant="purple">
          {(iconColor) =>
            role === 'member' ? (
              <PersonCircleIcon color={iconColor} size={18} />
            ) : (
              <Octicons
                name="shield-check"
                size={17}
                color={iconColor}
                style={{ marginTop: 2 }}
              />
            )
          }
        </NotificationIcon>
        <NotificationGroupInnerContainer>
          <NotificationTitleText>
            You are invited to become a {role} of {channelsText}
          </NotificationTitleText>
          {firstChannel && (
            <View
              style={[
                t.mT2,
                t.borderHairline,
                t.borderDefault,
                t.roundedLg,
                t.p3,
                t.bgDefault,
              ]}
            >
              <View style={[t.flexRow, t.itemsCenter]}>
                <FeedImage size={40} imageUrl={firstChannel.fastImageUrl} />
                <View style={[t.mL2, t.flex1]}>
                  <Text2 weight="semibold">/{firstChannel.key}</Text2>
                  {firstChannel.followerCount && (
                    <Text2 size="xs" color="tertiary">
                      {formatChannelFollowerCount(firstChannel.followerCount)}
                    </Text2>
                  )}
                </View>
                <View
                  style={[
                    t.roundedFull,
                    t.bgElevated,
                    t.selfStart,
                    t.itemsCenter,
                    t.justifyCenter,
                    t.h8,
                    t.w8,
                  ]}
                >
                  <Text2 size="xs" weight="medium">
                    +{totalInvites - 1}
                  </Text2>
                </View>
              </View>
              {firstChannel.description && (
                <Text2
                  size="sm"
                  color="secondary"
                  style={[t.mT2]}
                  numberOfLines={2}
                >
                  {firstChannel.description}
                </Text2>
              )}
            </View>
          )}
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  });

interface ChannelRoleInviteNotificationProps {
  group: ApiNotificationGroup;
  notif: ApiNotificationChannelRoleInvite;
}

const ChannelRoleInviteNotification: FC<ChannelRoleInviteNotificationProps> =
  memo(({ group, notif }) => {
    const t = useTheme();
    const push = usePush();
    const { accept, decline } = useRespondToChannelInvite();
    const toast = useToast();

    const channel = notif.content.channel;
    const role = notif.content.role;

    return (
      <NotificationGroupOuterContainer
        group={group}
        onPress={() => {
          push('Channel', { channelKey: channel.key });
        }}
      >
        <NotificationIcon variant="purple">
          {(iconColor) =>
            role === 'member' ? (
              <PersonCircleIcon color={iconColor} size={18} />
            ) : (
              <Octicons
                name="shield-check"
                size={17}
                color={iconColor}
                style={{ marginTop: 2 }}
              />
            )
          }
        </NotificationIcon>
        <NotificationGroupInnerContainer>
          <Text2>You are invited to become a {role}</Text2>
          <View
            style={[
              t.mT2,
              t.borderHairline,
              t.borderDefault,
              t.roundedLg,
              t.p3,
              t.bgDefault,
            ]}
          >
            <View style={[t.flexRow, t.itemsCenter]}>
              <FeedImage size={40} imageUrl={channel.fastImageUrl} />
              <View style={[t.mL2]}>
                <Text2 weight="semibold">/{channel.key}</Text2>
                {channel.followerCount && (
                  <Text2 size="xs" color="tertiary">
                    {formatChannelFollowerCount(channel.followerCount)}
                  </Text2>
                )}
              </View>
            </View>
            {channel.description && (
              <Text2
                size="sm"
                color="secondary"
                style={[t.mT2]}
                numberOfLines={2}
              >
                {channel.description}
              </Text2>
            )}
            <ChannelMembersYouKnow channel={channel} />
            <View style={[t.flexRow, t.mT3, { gap: sizes.s3 }]}>
              <ButtonV2
                title="Decline"
                width="flex1"
                height="sm"
                variant="secondary"
                onPress={async () => {
                  await decline({
                    channelKey: channel.key,
                    role,
                    location: 'invite notification',
                  });

                  toast.hideAll();
                  toast.show(
                    `Declined ${role} invitation for ${channel.name}`,
                    {
                      type: 'generic',
                    },
                  );
                }}
              />
              <ButtonV2
                title="Accept"
                width="flex1"
                height="sm"
                onPress={async () => {
                  await accept({
                    channelKey: channel.key,
                    role,
                    location: 'invite notification',
                  });

                  toast.hideAll();
                  toast.show(`You are now a ${role} of ${channel.name}`, {
                    type: 'generic',
                  });
                }}
              />
            </View>
          </View>
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  });
ChannelRoleInviteNotification.displayName = 'ChannelRoleInvite';

interface ListChannelRoleInviteNotificationProps {
  notif: ApiNotificationChannelRoleInvite;
}

const ListChannelRoleInviteNotification: FC<ListChannelRoleInviteNotificationProps> =
  memo(({ notif }) => {
    const t = useTheme();
    const push = usePush();
    const { accept, decline } = useRespondToChannelInvite();
    const toast = useToast();

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
      <Pressable
        style={[
          t.borderBHairline,
          t.borderDefault,
          t.p3,
          t.flexRow,
          t.wFull,
          t.itemsCenter,
        ]}
        onPress={() => {
          push('Channel', { channelKey: channel.key });
        }}
      >
        <FeedImage size={48} imageUrl={channel.fastImageUrl} />
        <View style={[t.mL3, t.flex1]}>
          <Text2 weight="semibold">/{channel.key}</Text2>
          <Text2 size="sm" color="secondary" style={[t.mT1]}>
            {typeof channelInviter !== 'undefined' &&
              `${resolveUsernameShort({
                fid: channelInviter.fid,
                username: channelInviter.username,
              })} invited you`}
            {typeof channelInviter === 'undefined' &&
              channel.followerCount &&
              channel.followerCount !== 0 &&
              formatChannelFollowerCount(channel.followerCount)}
          </Text2>
        </View>
        <View style={[t.flexRow, { gap: sizes.s3 }]}>
          <ButtonV2
            title="Decline"
            height="xs"
            variant="secondary"
            xPadding="sm"
            onPress={async () => {
              await decline({
                channelKey: channel.key,
                role,
                location: 'invite notification',
              });

              toast.hideAll();
              toast.show(`Declined ${role} invitation for ${channel.name}`, {
                type: 'generic',
              });
            }}
          />
          <ButtonV2
            title="Accept"
            height="xs"
            xPadding="sm"
            onPress={async () => {
              await accept({
                channelKey: channel.key,
                role,
                location: 'invite notification',
              });

              toast.hideAll();
              toast.show(`You are now a ${role} of ${channel.name}`, {
                type: 'generic',
              });
            }}
          />
        </View>
      </Pressable>
    );
  });
ListChannelRoleInviteNotification.displayName =
  'ListChannelRoleInviteNotification';

export {
  ChannelRoleInviteNotificationGroup,
  ListChannelRoleInviteNotification,
};
