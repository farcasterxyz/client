import { Octicons } from '@expo/vector-icons';
import { ApiChannelUser } from 'farcaster-client-data';
import React, { useMemo } from 'react';
import { TouchableOpacity } from 'react-native';

import { Badge } from '~/components/Badge';
import {
  BaseUserListItem,
  BaseUserListItemProps,
} from '~/components/users/BaseUserListItem';
import { FollowButton } from '~/components/users/FollowButton';
import { hitSlop } from '~/constants/Pressable';
import {
  ManageChannelUserProvider,
  useManageChannelUser,
} from '~/contexts/ManageChannelUserProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useChannelModOrOwner } from '~/hooks/useUserChannelRole';

export type ChannelUserListItemProps = {
  channelUser: ApiChannelUser;
  channelKey: string;
} & Omit<BaseUserListItemProps, 'user' | 'Badge'>;

export function ChannelUserListItem({
  channelUser,
  channelKey,
  Action: ActionOverride,
  ...rest
}: ChannelUserListItemProps) {
  const role = useChannelModOrOwner(channelKey);

  const UserBadge = useMemo(() => {
    if (channelUser.relation === 'owner') {
      return <Badge label="Owner" color="primary" size="xs" />;
    }

    if (channelUser.relation === 'moderator') {
      return <Badge label="Moderator" color="primary" size="xs" />;
    }

    if (channelUser.relation === 'pending-moderator') {
      return <Badge label="Pending" color="secondary" size="xs" />;
    }
  }, [channelUser.relation]);

  const Action = useMemo(() => {
    if (ActionOverride) {
      return ActionOverride;
    }

    if (role === 'owner' || role === 'moderator') {
      return (
        <WrappedManageUserKebab
          channelKey={channelKey}
          channelUser={channelUser}
        />
      );
    }

    return (
      <FollowButton
        targetUser={channelUser.user}
        size="sm"
        presentation="list"
      />
    );
  }, [ActionOverride, channelKey, channelUser, role]);

  return (
    <BaseUserListItem
      user={channelUser.user}
      Badge={UserBadge}
      Action={Action}
      ActionAlign={
        role === 'owner' || role === 'moderator' ? 'flex-start' : undefined
      }
      {...rest}
    />
  );
}

function WrappedManageUserKebab(props: {
  channelKey: string;
  channelUser: ApiChannelUser;
}) {
  return (
    <ManageChannelUserProvider
      channelKey={props.channelKey}
      channelUser={props.channelUser}
    >
      <ManageUserKebab />
    </ManageChannelUserProvider>
  );
}

function ManageUserKebab() {
  const t = useTheme();
  const { openManageUserBottomSheet } = useManageChannelUser();

  return (
    <TouchableOpacity
      hitSlop={hitSlop}
      onPress={openManageUserBottomSheet}
      style={[
        t.itemsCenter,
        t.justifyCenter,
        {
          height: 24,
          width: 24,
        },
      ]}
    >
      <Octicons
        name="kebab-horizontal"
        size={22}
        color={t.colors.text.primary}
      />
    </TouchableOpacity>
  );
}
