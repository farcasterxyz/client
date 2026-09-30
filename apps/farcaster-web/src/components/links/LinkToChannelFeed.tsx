import { FC, memo } from 'react';

import { Link, LinkProps } from '~/components/links/Link';

type LinkToChannelFeedProps = Omit<
  LinkProps<'channelFeed'>,
  'to' | 'params' | 'searchParams'
> & {
  channelKey: string;
  tab: string;
};

const LinkToChannelFeed: FC<LinkToChannelFeedProps> = memo(
  ({ channelKey, tab, ...props }) => {
    return (
      <Link
        to="channelFeed"
        params={{ channelKey, tab }}
        searchParams={{}}
        {...props}
      />
    );
  },
);

LinkToChannelFeed.displayName = 'LinkToChannelFeed';

export { LinkToChannelFeed };
