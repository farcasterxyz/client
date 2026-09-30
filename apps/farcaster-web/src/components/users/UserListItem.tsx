import { ApiUser } from 'farcaster-cryptography';

import { BaseUserListItem } from '~/components/users/BaseUserListItem';

export function UserListItem({ user }: { user: ApiUser }) {
  return <BaseUserListItem user={user} />;
}
