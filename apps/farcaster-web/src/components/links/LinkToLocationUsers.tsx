import { FC, memo } from 'react';

import { Link, LinkProps } from '~/components/links/Link';

type LinkToLocationUsersProps = Omit<
  LinkProps<'locationUsers'>,
  'to' | 'searchParams'
>;

const LinkToLocationUsers: FC<LinkToLocationUsersProps> = memo((props) => {
  return <Link to="locationUsers" searchParams={{}} {...props} />;
});

LinkToLocationUsers.displayName = 'LinkToLocationUsers';

export { LinkToLocationUsers };
