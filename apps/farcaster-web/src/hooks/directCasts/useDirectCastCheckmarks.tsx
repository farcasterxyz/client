import {
  ApiDirectCastConversationInfoV3,
  ApiDirectCastInboxConversationInfoV3,
  ApiDirectCastMessageV3,
} from 'farcaster-client-data';
import React, { useMemo } from 'react';

import { useCurrentUser } from '~/hooks/data/useCurrentUser';

type InboxCheckmarksProps = {
  checkmarkType: 'read' | 'delivered';
  isInbox: boolean;
};

const InboxCheckmarks: React.FC<InboxCheckmarksProps> = React.memo(
  ({ checkmarkType, isInbox }) => {
    if (checkmarkType === 'delivered') {
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M13.8047 3.52861C14.0651 3.78896 14.0651 4.21107 13.8047 4.47141L6.4714 11.8047C6.21106 12.0651 5.78894 12.0651 5.5286 11.8047L2.19526 8.47141C1.93491 8.21107 1.93491 7.78896 2.19526 7.52861C2.45561 7.26826 2.87772 7.26826 3.13807 7.52861L6 10.3905L12.8619 3.52861C13.1223 3.26826 13.5444 3.26826 13.8047 3.52861Z"
            className={
              isInbox
                ? 'fill-inbox-direct-casts-checkmark'
                : 'fill-self-direct-casts-checkmark'
            }
          />
        </svg>
      );
    }

    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path
          d="M17 6L6 17L1 12"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={
            isInbox
              ? 'stroke-inbox-direct-casts-checkmark'
              : 'stroke-self-direct-casts-checkmark'
          }
        />
        <path
          d="M23 7L12.5 17.5L11 16"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={
            isInbox
              ? 'stroke-inbox-direct-casts-checkmark'
              : 'stroke-self-direct-casts-checkmark'
          }
        />
      </svg>
    );
  },
);

const useDirectCastCheckmarks = ({
  directCast,
  conversation,
  applyInboxStyles,
  applyImageOnlyDirectCastStyles = false,
}: {
  directCast: ApiDirectCastMessageV3 | undefined;
  conversation:
    | ApiDirectCastConversationInfoV3
    | ApiDirectCastInboxConversationInfoV3;
  applyInboxStyles: boolean;
  applyImageOnlyDirectCastStyles?: boolean;
}) => {
  const currentUser = useCurrentUser();

  return useMemo(() => {
    if (!directCast) {
      return null;
    }

    const selfDirectCast = directCast.senderFid === currentUser.fid;
    const otherPartyRead =
      conversation.lastReadTime >= directCast.serverTimestamp;

    if (!selfDirectCast) {
      return null;
    }

    if (applyInboxStyles) {
      return (
        <div className="mt-1 flex flex-row items-center">
          <InboxCheckmarks
            checkmarkType={otherPartyRead ? 'read' : 'delivered'}
            isInbox={true}
          />
        </div>
      );
    }

    return (
      <div className="flex w-5 flex-row items-center">
        <InboxCheckmarks
          checkmarkType={otherPartyRead ? 'read' : 'delivered'}
          isInbox={!selfDirectCast && !applyImageOnlyDirectCastStyles}
        />
      </div>
    );
  }, [
    applyImageOnlyDirectCastStyles,
    applyInboxStyles,
    conversation.lastReadTime,
    currentUser.fid,
    directCast,
  ]);
};

export { useDirectCastCheckmarks };
