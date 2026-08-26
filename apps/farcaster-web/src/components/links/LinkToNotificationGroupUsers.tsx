import { ApiNotificationGroup } from 'farcaster-client-data';
import { FC, memo } from 'react';

import { Link, LinkProps } from '~/components/links/Link';

type LinkToNotificationGroupUsersProps = Omit<
  LinkProps<'notificationGroupUsers'>,
  'to' | 'params' | 'searchParams'
> & {
  notificationGroup: ApiNotificationGroup;
  title?: string;
};

const LinkToNotificationGroupUsers: FC<LinkToNotificationGroupUsersProps> =
  memo(({ notificationGroup, title, ...props }) => {
    return (
      <Link
        to="notificationGroupUsers"
        title={title}
        params={{
          type: notificationGroup.type,
          groupId: notificationGroup.id,
          title,
        }}
        searchParams={{}}
        {...props}
      />
    );
  });

LinkToNotificationGroupUsers.displayName = 'LinkToNotificationGroupUsers';

export { LinkToNotificationGroupUsers };
