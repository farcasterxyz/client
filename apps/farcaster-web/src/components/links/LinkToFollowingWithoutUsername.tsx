import { FC, memo } from 'react';

import { Link, LinkProps } from '~/components/links/Link';

type LinkToFollowingWithoutUsernameProps = Omit<
  LinkProps<'followingWithoutUsername'>,
  'to' | 'searchParams'
>;

const LinkToFollowingWithoutUsername: FC<LinkToFollowingWithoutUsernameProps> =
  memo((props) => {
    return <Link to="followingWithoutUsername" searchParams={{}} {...props} />;
  });

LinkToFollowingWithoutUsername.displayName = 'LinkToFollowingWithoutUsername';

export { LinkToFollowingWithoutUsername };
