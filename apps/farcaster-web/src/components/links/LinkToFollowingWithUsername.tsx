import { FC, memo } from 'react';

import { Link, LinkProps } from '~/components/links/Link';

type LinkToFollowingWithUsernameProps = Omit<
  LinkProps<'followingWithUsername'>,
  'to' | 'searchParams'
> & {
  fid: number; // For prefetching
};

const LinkToFollowingWithUsername: FC<LinkToFollowingWithUsernameProps> = memo(
  (props) => {
    return <Link to="followingWithUsername" searchParams={{}} {...props} />;
  },
);

LinkToFollowingWithUsername.displayName = 'LinkToFollowingWithUsername';

export { LinkToFollowingWithUsername };
