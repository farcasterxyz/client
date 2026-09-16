import { ApiCast, ApiCastFeedIncludeReason } from 'farcaster-client-data';
import { FC, memo, useMemo } from 'react';

import { CastHeaderLabel } from '~/components/casts/CastHeaderLabel';

type SourceLabelProps = {
  isFocusedCast: boolean;
  includeReason: ApiCastFeedIncludeReason;
  castChannel?: ApiCast['channel'];
};

const SourceLabel: FC<SourceLabelProps> = memo(
  ({ isFocusedCast, includeReason, castChannel }) => {
    const includeReasonType =
      includeReason.type as ApiCastFeedIncludeReason['type'];
    const icon = useMemo(
      () =>
        includeReasonType === 'pinned-in-channel' && castChannel
          ? 'pin'
          : (includeReasonType === 'popular-in-channel' && castChannel) ||
              includeReasonType === 'high-quality-unfollowed' ||
              includeReasonType === 'snap-promoted' ||
              includeReasonType === 'popular'
            ? 'highlight'
            : 'people',
      [castChannel, includeReasonType],
    );

    const text = useMemo(() => {
      switch (includeReasonType) {
        case 'pinned-in-channel':
          return castChannel ? `Pinned in ${castChannel.name}` : undefined;
        case 'popular-in-channel':
          return castChannel ? `Recommended in ${castChannel.name}` : undefined;
        case 'high-quality-unfollowed':
          return 'This cast is similar to casts you engaged with.';
        case 'popular':
          return 'Trending';
        case 'snap-promoted':
          return 'Recommended because it includes a Snap';
        case 'follow-of-follow':
          return 'Liked by people you follow';
        case 'has-reply-by-followed':
          return 'Has replies by people you follow';
        case 'recasted-by-following':
          return 'Recasted by people you follow';
        default:
          return undefined;
      }
    }, [castChannel, includeReasonType]);

    if (!text) {
      return null;
    }

    return (
      <CastHeaderLabel iconType={icon} isFocusedCast={isFocusedCast}>
        {text}
      </CastHeaderLabel>
    );
  },
);

SourceLabel.displayName = 'HighlightLabel';

export { SourceLabel };
