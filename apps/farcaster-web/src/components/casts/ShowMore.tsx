import { ApiCast } from 'farcaster-client-data';
import { CastClickType, useTrackCastClick } from 'farcaster-client-hooks';
import React, { FC, memo, useEffect, useMemo, useState } from 'react';

import { Threadline } from '~/components/casts/Threadline';
import { LinkToConversation } from '~/components/links/LinkToConversation';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { useNavigateToConversation } from '~/hooks/navigation/useNavigateToConversation';

export type ShowMoreProps = {
  cast: ApiCast;
  onPress?: () => void;
};

const ShowMore: FC<ShowMoreProps> = memo(({ cast, onPress }) => {
  const navigateToConversation = useNavigateToConversation();
  const trackCastClick = useTrackCastClick();
  const [showSpinner, setShowSpinnner] = useState(false);

  useEffect(() => {
    // Stop spinner if this component is re-rendered for a new cast, which
    // can happen if we have a Show more on a 2nd level reply for more 2nd level
    // replies (to the parent cast) which when clicked turns into a Show more for
    // 3rd level replies the 2nd level cast.
    setShowSpinnner(false);
  }, [cast]);

  const textComp = useMemo(
    () => (
      <div className="relative cursor-pointer py-1 text-sm text-link">
        Show replies
      </div>
    ),
    [],
  );

  return (
    <div
      className={
        'relative flex cursor-pointer flex-row items-center py-1 pl-[70px] hover:bg-overlay-faint'
      }
      onClick={() => {
        trackCastClick({ type: CastClickType.Cast });

        if (onPress) {
          setShowSpinnner(true);
          onPress();
        } else {
          navigateToConversation({
            castHash: cast.hash,
            authorUsername: cast.author.username,
          });
        }
      }}
    >
      <Threadline threadPosition={'middle_disconnected'} />
      {onPress ? (
        textComp
      ) : (
        <LinkToConversation
          title={cast.text}
          cast={cast}
          stopPropagation={true}
          onClick={() => {
            trackCastClick({ type: CastClickType.Cast });
          }}
        >
          {textComp}
        </LinkToConversation>
      )}
      {showSpinner && <LoadingIndicator containerClassName="ml-2" size="sm" />}
    </div>
  );
});

ShowMore.displayName = 'ShowMore';

export { ShowMore };
