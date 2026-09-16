import { FC, memo } from 'react';

import { Link, LinkProps } from '~/components/links/Link';

type LinkToFollowingFeedProps = Omit<
  LinkProps<'homeFeed'>,
  'to' | 'params' | 'searchParams'
>;

const LinkToFollowingFeed: FC<LinkToFollowingFeedProps> = memo((props) => {
  return <Link to="following" params={{}} searchParams={{}} {...props} />;
});

LinkToFollowingFeed.displayName = 'LinkToFollowingFeed';

export { LinkToFollowingFeed };
