import { FC, memo } from 'react';

import { Link, LinkProps } from '~/components/links/Link';

type LinkToNotificationsProps = Omit<
  LinkProps<'notificationsWithTabs'>,
  'to' | 'searchParams'
>;

const LinkToNotifications: FC<LinkToNotificationsProps> = memo(
  ({ params: { tab }, ...props }) => {
    return (
      <Link
        to="notificationsWithTabs"
        params={{ tab }}
        searchParams={{}}
        {...props}
      />
    );
  },
);

LinkToNotifications.displayName = 'LinkToNotifications';

export { LinkToNotifications };
