import React from 'react';

import {
  BaseUserListItem,
  BaseUserListItemProps,
} from '~/components/users/BaseUserListItem';
import { FollowButton } from '~/components/users/FollowButton';

export function SearchUserListItem(
  props: Omit<BaseUserListItemProps, 'Action'>,
) {
  return (
    <BaseUserListItem
      {...props}
      Action={
        <FollowButton targetUser={props.user} size="sm" presentation="list" />
      }
    />
  );
}
