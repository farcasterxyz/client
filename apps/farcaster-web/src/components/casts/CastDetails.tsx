import { ApiCast } from 'farcaster-client-data';
import {
  formatShorthandNumber,
  formatViewCount,
  resolveUsernameShort,
} from 'farcaster-client-hooks';
import React from 'react';

import { LinkToConversationQuotes } from '~/components/links/LinkToConversationQuotes';
import { LinkToConversationReactions } from '~/components/links/LinkToConversationReactions';
import { LinkToConversationRecasts } from '~/components/links/LinkToConversationRecasts';
import { LinkToProfile } from '~/components/links/LinkToProfile';

type CastDetailsProps = { cast: ApiCast; isFocused: boolean };

type CastDetailComponent = {
  Component: React.ReactNode;
};

const CastDetails: React.FC<CastDetailsProps> = React.memo(
  ({ cast, isFocused }) => {
    const replyCount = cast.replies.count;
    const recastCount = cast.recasts.count;
    const reactionCount = cast.reactions.count;
    const quoteCount = cast.quoteCount || 0;
    const warpsTipped = cast.warpsTipped || 0;

    const castDetailItems: CastDetailComponent[] = React.useMemo(() => {
      const items: CastDetailComponent[] = [];

      if (!isFocused && replyCount !== 0) {
        items.push({
          Component: (
            <div>
              <span
                className="mr-1 text-sm font-semibold text-secondary"
                title={replyCount.toLocaleString()}
              >
                {formatShorthandNumber(replyCount)}
              </span>
              <span className="text-sm text-secondary">
                {replyCount === 1 ? 'reply' : 'replies'}
              </span>
            </div>
          ),
        });
      }

      if (!isFocused) {
        if (reactionCount !== 0) {
          items.push({
            Component: (
              <div>
                <span
                  className="mr-1 text-sm font-semibold text-secondary"
                  title={reactionCount.toLocaleString()}
                >
                  {formatShorthandNumber(reactionCount)}
                </span>
                <span className="text-sm text-secondary">
                  {reactionCount === 1 ? 'like' : 'likes'}
                </span>
              </div>
            ),
          });
        }
      } else {
        if (recastCount !== 0) {
          items.push({
            Component: (
              <LinkToConversationRecasts
                title="View recasts"
                cast={cast}
                className="text-inherit"
              >
                <span
                  className="mr-1 text-sm font-semibold text-secondary"
                  title={recastCount.toLocaleString()}
                >
                  {formatShorthandNumber(recastCount)}
                </span>
                <span className="text-sm text-secondary">
                  {recastCount === 1 ? 'recast' : 'recasts'}
                </span>
              </LinkToConversationRecasts>
            ),
          });
        }

        if (quoteCount !== 0) {
          items.push({
            Component: (
              <LinkToConversationQuotes
                title="View quotes"
                cast={cast}
                className="text-inherit"
              >
                <span
                  className="mr-1 text-sm font-semibold text-secondary"
                  title={quoteCount.toLocaleString()}
                >
                  {formatShorthandNumber(quoteCount)}
                </span>
                <span className="text-sm text-secondary">
                  {quoteCount === 1 ? 'quote' : 'quotes'}
                </span>
              </LinkToConversationQuotes>
            ),
          });
        }

        if (reactionCount !== 0) {
          items.push({
            Component: (
              <LinkToConversationReactions
                title="View reactions"
                cast={cast}
                className="text-inherit"
              >
                <span
                  className="mr-1 text-sm font-semibold text-secondary"
                  title={reactionCount.toLocaleString()}
                >
                  {formatShorthandNumber(reactionCount)}
                </span>
                <span className="text-sm text-secondary">
                  {reactionCount === 1 ? 'like' : 'likes'}
                </span>
              </LinkToConversationReactions>
            ),
          });
        }

        if (warpsTipped !== 0) {
          items.push({
            Component: (
              <div>
                <span
                  className="mr-1 text-sm font-semibold text-secondary"
                  title={warpsTipped.toLocaleString()}
                >
                  {formatShorthandNumber(warpsTipped)}
                </span>
                <span className="text-sm text-secondary">
                  {warpsTipped === 1 ? 'warp' : 'warps'}
                </span>
              </div>
            ),
          });
        }

        if (typeof cast.viewCount !== 'undefined' && cast.viewCount !== 0) {
          items.push({
            Component: (
              <div>
                <span className="mr-1 text-sm font-semibold text-secondary">
                  {formatViewCount(cast.viewCount)}
                </span>
                <span className="text-sm text-secondary">views</span>
              </div>
            ),
          });
        }

        if (typeof cast.client !== 'undefined') {
          items.push({
            Component: (
              <div>
                <span className="text-sm text-secondary">Sent from</span>
                <LinkToProfile
                  title="Sent from client"
                  user={{
                    fid: cast.client.fid,
                    username: cast.client.username,
                  }}
                  className="ml-1 text-sm text-secondary hover:underline"
                >
                  {resolveUsernameShort({
                    username: cast.client.username,
                    fid: cast.client.fid,
                  })}
                </LinkToProfile>
              </div>
            ),
          });
        }
      }

      return items;
    }, [
      cast,
      isFocused,
      quoteCount,
      reactionCount,
      recastCount,
      replyCount,
      warpsTipped,
    ]);

    return (
      <div className="flex flex-row items-center">
        {castDetailItems.map(({ Component }, index) => (
          <div className="flex flex-row items-center" key={index}>
            {Component}
            {castDetailItems.length !== 1 &&
              castDetailItems.length - 1 !== index && (
                <span className="mx-1.5 text-sm text-secondary">·</span>
              )}
          </div>
        ))}
      </div>
    );
  },
);

CastDetails.displayName = 'CastDetails';

export { CastDetails };
