import {
  ApiCastFeedIncludeReason,
  ApiCastFeedItem,
} from 'farcaster-client-data';
import { ThreadPosition } from 'farcaster-client-hooks';
import React, { FC, memo, useMemo } from 'react';

import { Cast } from '~/components/casts/Cast';

import { ShowMore } from './ShowMore';

const adminGatedFeedCastIncludeReasonTypes = new Set<string>();

type CastFeedItemProps = {
  feedItem: ApiCastFeedItem;
  castOpenIncludeReason?: ApiCastFeedIncludeReason['type'];
  index?: number;
  mainCastOmitReplyingTo?: boolean;
  showSourceLabels?: boolean;
  showChannelTag?: boolean;
  showAdminGatedFeedCastTreatment?: boolean;
};

const CastFeedItem: FC<CastFeedItemProps> = memo(
  ({
    feedItem: { cast, otherParticipants, replies, meta, pinned },
    castOpenIncludeReason,
    index,
    mainCastOmitReplyingTo = false,
    showSourceLabels = true,
    showChannelTag = true,
    showAdminGatedFeedCastTreatment = false,
  }) => {
    const lastReply = useMemo(
      () => (replies ? replies[replies.length - 1] : undefined),
      [replies],
    );

    const showMore = useMemo(() => {
      if (!lastReply) {
        return null;
      }

      // Temp: for now we want to show Show more only when the reply is not a direct child of the main cast
      // const hasOtherParticipants = otherParticipants.length > 0;
      // const hasMultipleRootReplies = cast.replies.count > 1;
      const hasCastsBetweenRootAndLastReply =
        lastReply.parentHash && lastReply.parentHash !== cast.hash;

      if (
        // !hasOtherParticipants &&
        // !hasMultipleRootReplies &&
        !hasCastsBetweenRootAndLastReply
      ) {
        return null;
      }

      return (
        <ShowMore
          castHash={cast.threadHash}
          castOpenIncludeReason={castOpenIncludeReason}
          otherParticipants={otherParticipants}
        />
      );
    }, [cast, castOpenIncludeReason, lastReply, otherParticipants]);

    return (
      <>
        <Cast
          // Don't include the key prop here, as it will prevent flashlist from recycling views
          // See https://shopify.github.io/flash-list/docs/fundamentals/performant-components#remove-key-prop
          cast={cast}
          threadPosition={((): ThreadPosition => {
            if (!replies || replies.length === 0 || pinned) {
              return 'start_and_end';
            }

            return 'start';
          })()}
          omitReplyingTo={mainCastOmitReplyingTo}
          omitReplyingToPostfix={true}
          includeReason={meta?.includeReason}
          index={index}
          castOpenIncludeReason={castOpenIncludeReason}
          isAdminGatedFeedCast={
            showAdminGatedFeedCastTreatment &&
            typeof meta?.includeReason?.type !== 'undefined' &&
            adminGatedFeedCastIncludeReasonTypes.has(meta.includeReason.type)
          }
          shouldHideRecastLabel={!showSourceLabels}
          showChannelTags={showChannelTag}
          isPinned={pinned}
          topHat={meta?.topHat}
        />
        {showMore}
        {lastReply && !pinned ? (
          <Cast
            cast={lastReply}
            threadPosition={'end_disconnected'}
            // No need to display replying to when there is a direct line between feed items
            omitReplyingTo={cast.hash === lastReply.parentHash}
            omitReplyingToPostfix={true}
            showChannelTags={false}
            shouldHideRecastLabel={true}
            showMemberBadge={lastReply.author.fid !== cast.author.fid}
            includeReason={meta?.includeReason}
            index={index}
            castOpenIncludeReason={castOpenIncludeReason}
          />
        ) : null}
      </>
    );
  },
);

CastFeedItem.displayName = 'CastFeedItem';

export { CastFeedItem };
