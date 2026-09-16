import { FC, memo } from 'react';

import { Link, LinkProps } from '~/components/links/Link';

type LinkToHomeFeedProps = Omit<
  LinkProps<'homeFeed'>,
  'to' | 'params' | 'searchParams'
>;

const LinkToHomeFeed: FC<LinkToHomeFeedProps> = memo((props) => {
  return <Link to="homeFeed" params={{}} searchParams={{}} {...props} />;
});

LinkToHomeFeed.displayName = 'LinkToHomeFeed';

export { LinkToHomeFeed };
