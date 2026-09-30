import { HeartFillIcon, SyncIcon } from '@primer/octicons-react';
import {
  ApiCastFeedItemTopHat,
  ApiCastFeedItemTopHatInteractions,
} from 'farcaster-client-data';
import { formatTimeAgo } from 'farcaster-client-hooks';
import React, { FC, memo, useMemo } from 'react';

import { CommentFillIcon } from '~/components/casts/actions/icons/CommentFillIcon';
import { UserMinimalMention } from '~/components/casts/UserMinimalMention';
import { mdAvatarDiameter } from '~/constants/avatar';

interface FeedItemTopHatProps {
  topHat: ApiCastFeedItemTopHat;
}

const FeedItemTopHat: FC<FeedItemTopHatProps> = memo(({ topHat }) => {
  if (topHat.type === 'interactions') {
    return <FeedItemTopHatInteractions topHat={topHat} />;
  }

  return null;
});

FeedItemTopHat.displayName = 'FeedItemTopHat';

interface FeedItemTopHatInteractionsProps {
  topHat: ApiCastFeedItemTopHatInteractions;
}

const FeedItemTopHatInteractions: FC<FeedItemTopHatInteractionsProps> = memo(
  ({ topHat }) => {
    return useMemo(() => {
      let verb = '';
      let icon: React.ReactNode = null;
      if (topHat.interactionType === 'like') {
        verb = ' liked';
        icon = <HeartFillIcon size={12} />;
      } else if (topHat.interactionType === 'recast') {
        verb = ' recasted';
        icon = <SyncIcon size={12} />;
      } else if (topHat.interactionType === 'reply') {
        verb = ' replied';
        icon = <CommentFillIcon />;
      }

      return (
        <FeedItemTopHatContainer icon={icon}>
          <UserMinimalMention user={topHat.actor1} />
          {topHat.actor2 && topHat.numActors <= 2 ? (
            <>
              {' and '}
              <UserMinimalMention user={topHat.actor2} />
            </>
          ) : topHat.numActors > 2 ? (
            <>
              {' and '}
              {topHat.numActors - 1}
              {topHat.numActors > 2 ? ' others' : ' other'}
            </>
          ) : null}
          {verb}
          {!topHat.actor2 ? (
            <> {formatTimeAgo(topHat.lastInteractionAt)} ago</>
          ) : null}
        </FeedItemTopHatContainer>
      );
    }, [topHat]);
  },
);
FeedItemTopHatInteractions.displayName = 'FeedItemTopHatInteractions';

interface FeedItemTopHatContainerProps {
  icon: React.ReactNode;
  children: React.ReactNode;
  trailing?: React.ReactNode;
}

const FeedItemTopHatContainer: FC<FeedItemTopHatContainerProps> = memo(
  ({ icon, children, trailing }) => {
    return (
      <div
        className={
          trailing
            ? 'mb-px flex flex-row items-center justify-between pl-[16px] pr-4 text-[12px] text-faint'
            : 'mb-px flex flex-row items-center pl-[16px] text-[12px] text-faint'
        }
      >
        <div className="flex min-w-0 flex-row items-center">
          <div
            className="mr-2 flex flex-row items-center justify-end text-right"
            style={{ width: mdAvatarDiameter }}
          >
            {icon}
          </div>
          <div>{children}</div>
        </div>
        {trailing}
      </div>
    );
  },
);

export { FeedItemTopHat, FeedItemTopHatContainer };
