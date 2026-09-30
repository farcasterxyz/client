import { ApiDirectCastMessageV3 } from 'farcaster-client-data';

const getShouldLabelDirectCastAsFromYou = ({
  currentUserFid,
  directCast,
}: {
  currentUserFid: number;
  directCast: ApiDirectCastMessageV3 | undefined;
}) => {
  if (!directCast) {
    return false;
  }

  return directCast.senderFid === currentUserFid;
};

const directCastsAreInSameGroup = ({
  previousDirectCast,
  currentDirectCast,
}: {
  previousDirectCast: ApiDirectCastMessageV3;
  currentDirectCast: ApiDirectCastMessageV3;
}) => {
  return (
    previousDirectCast.senderFid === currentDirectCast.senderFid &&
    previousDirectCast.type === currentDirectCast.type
  );
};

// When introducing DC message search, we needed a way to display the same
// conversation multiple times in the inbox, without highlighting all of them
// if a single one was pressed. To achieve this, for search results we use a
// more specific key for the activeConversationId
function getConversationIdFromActiveConversationId(
  activeConversationId: string | undefined,
): string | undefined {
  if (!activeConversationId) {
    return activeConversationId;
  }
  const [conversationId] = activeConversationId.split('|');
  return conversationId;
}

// When loading a conversation from a search result, the activeConversationId
// includes a messageId that should be focused on first mount. See above for
// more details
function getMessageIdFromActiveConversationId(
  activeConversationId: string | undefined,
): string | undefined {
  if (!activeConversationId) {
    return activeConversationId;
  }
  const [, messageId] = activeConversationId.split('|');
  return messageId;
}

export {
  directCastsAreInSameGroup,
  getConversationIdFromActiveConversationId,
  getMessageIdFromActiveConversationId,
  getShouldLabelDirectCastAsFromYou,
};
