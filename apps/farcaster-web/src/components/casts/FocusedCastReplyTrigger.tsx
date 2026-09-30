import classNames from 'classnames';
import { ApiCast } from 'farcaster-client-data';
import { CastClickType, useTrackCastClick } from 'farcaster-client-hooks';
import React from 'react';

import { Avatar } from '~/components/avatar/Avatar';
import { ComposeCastButton } from '~/components/forms/buttons/ComposeCastButton';
import { ComposeCastModal } from '~/components/modals/ComposeCastModal';
import { useCachedCurrentUser } from '~/hooks/data/useCachedCurrentUser';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { ApiCastWithContext } from '~/types';

type FocusedCastReplyTriggerProps = {
  parentCast: ApiCast;
  parentCastContext: ApiCastWithContext['context'];
};

const FocusedCastReplyTrigger: React.FC<FocusedCastReplyTriggerProps> = ({
  parentCast,
  parentCastContext,
}) => {
  const isSignedIn = useIsSignedIn();
  const currentUser = useCachedCurrentUser();
  const trackCastClick = useTrackCastClick();

  const [isComposingCast, setIsComposingCast] = React.useState<boolean>(false);

  if (
    !isSignedIn ||
    !currentUser ||
    parentCast.author.viewerContext?.blockedBy
  ) {
    return null;
  }

  return (
    <>
      <div
        className={classNames(
          'mt-3 flex cursor-pointer flex-row items-center justify-between border-t px-4 py-2 border-faint',
          parentCastContext.isLastInList && 'border-b',
        )}
        onClick={() => {
          trackCastClick({ type: CastClickType.Reply });
          setIsComposingCast(true);
        }}
      >
        <div className="flex flex-row items-center space-x-2">
          <Avatar user={currentUser} className="relative mr-2" />
          <div className="text-base text-faint">Cast your reply</div>
        </div>
        <ComposeCastButton className="!hover:bg-current opacity-50">
          Reply
        </ComposeCastButton>
      </div>
      {isComposingCast && (
        <ComposeCastModal
          onClose={() => {
            setIsComposingCast(false);
          }}
          intent={{
            parentCastHash: parentCast.hash,
            parentCast,
          }}
        />
      )}
    </>
  );
};

export { FocusedCastReplyTrigger };
