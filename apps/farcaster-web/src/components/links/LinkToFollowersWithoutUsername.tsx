import { FC, memo } from 'react';

import { Link, LinkProps } from '~/components/links/Link';

type LinkToFollowersWithoutUsernameProps = Omit<
  LinkProps<'followersWithoutUsername'>,
  'to' | 'searchParams'
>;

const LinkToFollowersWithoutUsername: FC<LinkToFollowersWithoutUsernameProps> =
  memo((props) => {
    return <Link to="followersWithoutUsername" searchParams={{}} {...props} />;
  });

LinkToFollowersWithoutUsername.displayName = 'LinkToFollowersWithoutUsername';

export { LinkToFollowersWithoutUsername };
