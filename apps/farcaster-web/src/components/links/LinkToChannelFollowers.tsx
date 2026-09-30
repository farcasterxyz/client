import { FC, memo } from 'react';

import { Link, LinkProps } from '~/components/links/Link';

type LinkToChannelFollowers = Omit<
  LinkProps<'channelFollowers'>,
  'to' | 'params' | 'searchParams'
> & {
  channelKey: string; // For prefetching
};

const LinkToChannelFollowers: FC<LinkToChannelFollowers> = memo((props) => {
  return (
    <Link
      to="channelFollowers"
      params={{ channelKey: props.channelKey }}
      searchParams={{}}
      {...props}
    />
  );
});

LinkToChannelFollowers.displayName = 'LinkToChannelFollowers';

export { LinkToChannelFollowers };
