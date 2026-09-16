import { FC, memo } from 'react';

import { Link, LinkProps } from '~/components/links/Link';

type LinkToChannelFollowersYouKnow = Omit<
  LinkProps<'channelFollowersYouKnow'>,
  'to' | 'params' | 'searchParams'
> & {
  channelKey: string; // For prefetching
};

const LinkToChannelFollowersYouKnow: FC<LinkToChannelFollowersYouKnow> = memo(
  (props) => {
    return (
      <Link
        to="channelFollowersYouKnow"
        params={{ channelKey: props.channelKey }}
        searchParams={{}}
        {...props}
      />
    );
  },
);

LinkToChannelFollowersYouKnow.displayName = 'LinkToChannelFollowersYouKnow';

export { LinkToChannelFollowersYouKnow };
