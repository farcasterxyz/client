import { FC, memo } from 'react';

import { Link, LinkProps } from '~/components/links/Link';

type LinkToFollowersYouKnowWithUsernameProps = Omit<
  LinkProps<'followersYouKnowWithUsername'>,
  'to' | 'searchParams'
> & {
  fid: number; // For prefetching
};

const LinkToFollowersYouKnowWithUsername: FC<LinkToFollowersYouKnowWithUsernameProps> =
  memo((props) => {
    return (
      <Link to="followersYouKnowWithUsername" searchParams={{}} {...props} />
    );
  });

LinkToFollowersYouKnowWithUsername.displayName =
  'LinkToFollowersYouKnowWithUsername';

export { LinkToFollowersYouKnowWithUsername };
