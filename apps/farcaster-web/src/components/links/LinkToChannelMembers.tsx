import { FC, memo } from 'react';

import { Link, LinkProps } from '~/components/links/Link';

type LinkToChannelMembers = Omit<
  LinkProps<'channelMembers'>,
  'to' | 'params' | 'searchParams'
> & {
  channelKey: string; // For prefetching
};

const LinkToChannelMembers: FC<LinkToChannelMembers> = memo((props) => {
  return (
    <Link
      to="channelMembers"
      params={{ channelKey: props.channelKey }}
      searchParams={{}}
      {...props}
    />
  );
});

LinkToChannelMembers.displayName = 'LinkToChannelMembers';

export { LinkToChannelMembers };
