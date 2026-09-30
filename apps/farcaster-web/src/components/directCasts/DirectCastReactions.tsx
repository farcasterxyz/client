import classNames from 'classnames';
import type { ApiDirectCastMessageV3 } from 'farcaster-client-data';
import {
  useAddReactionToPlaintextDirectCast,
  useRemoveReactionFromPlaintextDirectCast,
} from 'farcaster-client-hooks';
import React from 'react';

import { useDirectCastToTakeAction } from '~/contexts/DirectCastToTakeActionProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';

import { ReactionEmoji } from './ReactionEmoji';

const COLLAPSED_REACTION_COUNT = 10;

type DirectCastReactionsProps = {
  directCast: ApiDirectCastMessageV3;
  onCollapsedStateClick?: () => void;
};

const DirectCastReactions: React.FC<DirectCastReactionsProps> = React.memo(
  ({ directCast, onCollapsedStateClick }) => {
    const { fid: currentUserFid } = useCurrentUser();

    const selfDirectCast = React.useMemo(() => {
      return directCast.senderFid === currentUserFid;
    }, [currentUserFid, directCast.senderFid]);

    const reactions = React.useMemo(() => {
      return directCast.reactions;
    }, [directCast.reactions]);

    const viewerReactions = React.useMemo(() => {
      return directCast.viewerContext?.reactions || [];
    }, [directCast.viewerContext?.reactions]);

    const { addToRecentReactions } = useDirectCastToTakeAction();
    const addReactionToDirectCast = useAddReactionToPlaintextDirectCast();
    const removeDirectCastReaction = useRemoveReactionFromPlaintextDirectCast();

    const handleEmojiPick = (emoji: string) => {
      if (viewerReactions.indexOf(emoji) === -1) {
        addReactionToDirectCast({
          fid: currentUserFid || 0,
          conversationId: directCast.conversationId,
          messageId: directCast.messageId,
          reaction: emoji,
        });
        addToRecentReactions(emoji);
      } else {
        removeDirectCastReaction({
          fid: currentUserFid || 0,
          conversationId: directCast.conversationId,
          messageId: directCast.messageId,
          reaction: emoji,
        });
      }
    };

    const shouldCollapseReactions = React.useMemo(() => {
      return reactions.length >= COLLAPSED_REACTION_COUNT;
    }, [reactions]);

    const reactionCount = React.useMemo(
      () =>
        reactions.reduce((sum, reactionSummary) => {
          return reactionSummary.count + sum;
        }, 0),
      [reactions],
    );

    const recentReactions = React.useMemo(() => {
      return reactions.slice(0, 3);
    }, [reactions]);

    if (reactions.length === 0) {
      return null;
    }

    return (
      <div
        className={classNames([
          '-mt-1 flex px-1',
          !selfDirectCast ? 'flex-row' : 'flex-row-reverse',
        ])}
      >
        {shouldCollapseReactions ? (
          <div
            onClick={onCollapsedStateClick}
            className={classNames(
              'border-3 flex cursor-pointer flex-row rounded-full border px-[4px] py-[1px] backdrop-blur-0 border-app',
              viewerReactions.length !== 0
                ? 'bg-[#D3CBE9] dark:bg-[#403465]'
                : 'bg-direct-cast',
            )}
          >
            {recentReactions.map((r) => (
              <div
                key={`dc-${directCast.messageId}-${r.reaction}`}
                className="flex flex-col justify-center px-[4px] text-[16px]"
              >
                <ReactionEmoji reaction={r.reaction} />
              </div>
            ))}
            <div className="ml-[4px] flex flex-col justify-center pr-[4px] text-[14px] text-muted">
              {reactionCount}
            </div>
          </div>
        ) : (
          reactions
            .filter((r) => r.count > 0)
            .map((r) => (
              <div
                key={`dc-${directCast.messageId}-${r.reaction}`}
                onClick={() => {
                  handleEmojiPick(r.reaction);
                }}
                className={classNames(
                  'border-3 flex cursor-pointer flex-row rounded-full border px-[4px] py-[1px] backdrop-blur-0 border-app',
                  viewerReactions.indexOf(r.reaction) !== -1
                    ? 'bg-[#D3CBE9] dark:bg-[#403465]'
                    : 'bg-direct-cast',
                )}
              >
                <div className="flex flex-col justify-center px-[4px] text-[16px]">
                  <ReactionEmoji reaction={r.reaction} />
                </div>
                <div className="ml-[4px] flex flex-col justify-center pr-[4px] text-[14px] text-muted">
                  {r.count}
                </div>
              </div>
            ))
        )}
      </div>
    );
  },
);

export { DirectCastReactions };
