import { useChannelFromGlobalCache } from 'farcaster-client-hooks';
import React from 'react';

import { ChannelTooltipSummary } from '~/components/channels/ChannelTooltipSummary';
import { HoverCardTooltip } from '~/components/HoverCardTooltip';
import { Link, LinkProps } from '~/components/links/Link';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';

type LinkToChannelProps = Omit<
  LinkProps<'channel'>,
  'to' | 'params' | 'searchParams'
> & {
  channelKey: string;
};

type LinkToChannelWithSummaryTooltipContentProps = {
  channelKey: string;
};

const LinkToChannelWithSummaryTooltipContent: React.FC<
  LinkToChannelWithSummaryTooltipContentProps
> = ({ channelKey }) => {
  const channel = useChannelFromGlobalCache({
    key: channelKey,
  }).data;

  return <ChannelTooltipSummary channel={channel} />;
};

const LinkToChannelWithSummaryTooltip: React.FC<LinkToChannelProps> =
  React.memo(({ channelKey, ...props }) => {
    const isSignedIn = useIsSignedIn();

    const trigger = React.useMemo(() => {
      return (
        <Link
          to="channel"
          params={{ channelKey }}
          searchParams={{}}
          {...props}
        />
      );
    }, [channelKey, props]);

    const content = React.useMemo(() => {
      return <LinkToChannelWithSummaryTooltipContent channelKey={channelKey} />;
    }, [channelKey]);

    if (!isSignedIn) {
      return trigger;
    }

    return (
      <HoverCardTooltip
        trigger={trigger}
        content={content}
        className="w-full"
      />
    );
  });

LinkToChannelWithSummaryTooltip.displayName = 'LinkToChannelWithSummaryTooltip';

export { LinkToChannelWithSummaryTooltip };
