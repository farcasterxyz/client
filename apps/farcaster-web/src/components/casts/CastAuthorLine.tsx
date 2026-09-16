import classNames from 'classnames';
import {
  ApiCast,
  ApiCastFeedIncludeReason,
  ApiQuoteCastEmbed,
} from 'farcaster-client-data';
import {
  CastClickType,
  formatTimeAgo,
  resolveUsername,
  useTrackCastClick,
} from 'farcaster-client-hooks';
import React from 'react';

import { FarcasterProBadge } from '~/components/badges/FarcasterProBadge';
import { ChannelTag, TokenTag } from '~/components/channelsV3/ChannelTag';
import { ChannelBadge } from '~/components/channelUsers/ChannelBadge';
import { TwoPeopleIcon } from '~/components/icons/TwoPeopleIcon';
import { LinkToConversation } from '~/components/links/LinkToConversation';
import { LinkToProfileWithSummaryTooltip } from '~/components/links/LinkToProfileWithSummaryTooltip';
import { Tooltip } from '~/components/Tooltip';
import { useUserLevel } from '~/hooks/data/useUserLevel';

export function CastAuthorLine({
  cast,
  showChannel = false,
  showMemberBadge = false,
  variant = 'default',
  profileOpenIncludeReason,
}: {
  cast: ApiCast | ApiQuoteCastEmbed;
  showChannel?: boolean;
  showMemberBadge?: boolean;
  variant?: 'default' | 'direct-cast';
  profileOpenIncludeReason?: ApiCastFeedIncludeReason['type'];
}) {
  const trackCastClick = useTrackCastClick();
  const isProUser = useUserLevel(cast.author) === 'pro';

  return (
    <div
      className={classNames('flex w-full min-w-0 flex-row items-center gap-1')}
    >
      <LinkToProfileWithSummaryTooltip
        title={cast.author.displayName}
        user={cast.author}
        includeReason={profileOpenIncludeReason}
        className={classNames(
          'relative font-semibold !text-inherit hover:underline',
          variant === 'direct-cast' && '!text-default',
        )}
        onClick={() => {
          trackCastClick({ type: CastClickType.Author });
        }}
      >
        {resolveUsername({
          username: cast.author.username,
          fid: cast.author.fid,
        }).replace('@', '')}
      </LinkToProfileWithSummaryTooltip>
      {isProUser && <FarcasterProBadge size={20} className="mb-px" />}
      {showChannel && (cast.channel || cast.token) && (
        <div className="text-muted">in</div>
      )}
      {showChannel && cast.channel && (
        <ChannelTag
          channel={cast.channel}
          shouldLinkToChannel={true}
          size="feed"
          variant={variant}
        />
      )}
      {showChannel && cast.token && (
        <TokenTag
          token={cast.token}
          shouldLinkToToken={true}
          size="feed"
          variant={variant}
        />
      )}
      {showMemberBadge && (
        <ChannelBadge color="secondary" Icon={TwoPeopleIcon} />
      )}
      <LinkToConversation
        cast={cast}
        title=""
        onClick={() => {
          trackCastClick({ type: CastClickType.Cast });
        }}
      >
        <Tooltip
          trigger={
            <div
              className={classNames(
                'cursor-pointer text-base text-faint hover:underline',
              )}
            >
              {formatTimeAgo(cast.timestamp, 'floor')}
            </div>
          }
          content={
            <div className="px-1 text-sm text-light">
              {new Date(cast.timestamp).toLocaleTimeString()} ·{' '}
              {new Date(cast.timestamp).toLocaleDateString()}
            </div>
          }
        />
      </LinkToConversation>
    </div>
  );
}
