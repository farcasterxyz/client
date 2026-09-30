import { FC, memo } from 'react';

import { Link, LinkProps } from '~/components/links/Link';

type LinkToFollowersWithUsernameProps = Omit<
  LinkProps<'followersWithUsername'>,
  'to' | 'searchParams'
> & {
  fid: number; // For prefetching
};

const LinkToFollowersWithUsername: FC<LinkToFollowersWithUsernameProps> = memo(
  (props) => {
    return <Link to="followersWithUsername" searchParams={{}} {...props} />;
  },
);

LinkToFollowersWithUsername.displayName = 'LinkToFollowersWithUsername';

export { LinkToFollowersWithUsername };
