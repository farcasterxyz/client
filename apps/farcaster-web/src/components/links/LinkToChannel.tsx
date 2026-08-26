import { FC, memo, useCallback } from 'react';

import { Link, LinkProps } from '~/components/links/Link';
import { useOptimisticallyPrefetchFeed } from '~/hooks/data/useOptimisticallyPrefetchFeed';

type LinkToChannelProps = Omit<
  LinkProps<'channel'>,
  'to' | 'params' | 'searchParams'
> & {
  channelKey: string;
};

const LinkToChannel: FC<LinkToChannelProps> = memo(
  ({ channelKey, ...props }) => {
    const optimisticallyPrefetchChannelFeed = useOptimisticallyPrefetchFeed();

    const onMouseOver = useCallback(() => {
      optimisticallyPrefetchChannelFeed({ feedKey: channelKey });
    }, [channelKey, optimisticallyPrefetchChannelFeed]);

    return (
      <Link
        to="channel"
        params={{ channelKey }}
        searchParams={{}}
        onMouseOver={onMouseOver}
        {...props}
      />
    );
  },
);

LinkToChannel.displayName = 'LinkToChannel';

export { LinkToChannel };
