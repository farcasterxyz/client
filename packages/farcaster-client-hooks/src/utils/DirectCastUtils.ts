import {
  ApiDirectCastConversationInfoV3,
  ApiDirectCastInboxConversationInfoV3,
  ApiDirectCastMessageType,
  ApiDirectCastMessageV3,
  ApiUser,
} from 'farcaster-client-data';

const VERIFIED_SENDER_FIDS = [9152];

const extractDirectCastConversationKey = (
  conversation:
    | ApiDirectCastConversationInfoV3
    | ApiDirectCastInboxConversationInfoV3,
) => conversation.conversationId;

const extractDirectCastKey = (directCast: ApiDirectCastMessageV3) =>
  [directCast.conversationId, directCast.messageId].join('|');

const getCanSendDirectCasts = ({ user }: { user: ApiUser }) => {
  return (
    !!user.viewerContext?.hasUploadedInboxKeys &&
    !!user.viewerContext?.canSendDirectCasts
  );
};

const buildNonGroupConversationId = ({
  participantFids,
}: {
  participantFids: number[];
}) => {
  // We can't guarantee folks passing in unique values so let's go ahead and
  // do the arr -> set -> arr dance.
  return Array.from(new Set<number>(participantFids)).sort().join('-');
};

const isVerifiedSender = ({
  conversationCounterPartyFid,
}: {
  conversationCounterPartyFid: number;
}) => {
  return VERIFIED_SENDER_FIDS.indexOf(conversationCounterPartyFid) !== -1;
};

function assertDirectCastMessageTypeOrThrow({
  type,
}: {
  type: string;
}): ApiDirectCastMessageType {
  switch (type) {
    case 'text':
      return 'text';
    case 'group_name_change':
      return 'group_name_change';
    case 'group_membership_addition':
      return 'group_membership_addition';
    case 'group_membership_removal':
      return 'group_membership_removal';
    case 'pin_message':
      return 'pin_message';
    case 'message_ttl_change':
      return 'message_ttl_change';
    case 'rich_announcement':
      return 'rich_announcement';
    default:
      throw new Error(`Message type: '${type}' is not valid`);
  }
}

const _embeds = ['group-invite', 'cast', 'url', 'image', 'video'] as const;
type DirectCastEmbeds = (typeof _embeds)[number];

function determineEmbedRenders({
  directCast,
}: {
  directCast: ApiDirectCastMessageV3;
}): { renderEmbedType: DirectCastEmbeds | undefined } {
  if (directCast.isDeleted) {
    return { renderEmbedType: undefined };
  }

  if (
    typeof directCast.payload !== 'undefined' &&
    directCast.payload.type === 'rich_announcement' &&
    directCast.payload.payload.imageUrl
  ) {
    return { renderEmbedType: 'image' };
  }

  if (typeof directCast.metadata === 'undefined') {
    return { renderEmbedType: undefined };
  }

  const metadata = directCast.metadata;

  if (typeof metadata.medias !== 'undefined' && metadata.medias.length !== 0) {
    return { renderEmbedType: 'image' };
  }

  if (typeof metadata.videos !== 'undefined' && metadata.videos.length !== 0) {
    return { renderEmbedType: 'video' };
  }

  if (
    typeof metadata.groupInvites !== 'undefined' &&
    metadata.groupInvites.length !== 0
  ) {
    return { renderEmbedType: 'group-invite' };
  }

  if (typeof metadata.casts !== 'undefined' && metadata.casts.length !== 0) {
    return { renderEmbedType: 'cast' };
  }

  if (typeof metadata.urls !== 'undefined' && metadata.urls.length !== 0) {
    return { renderEmbedType: 'url' };
  }

  return { renderEmbedType: undefined };
}

export {
  assertDirectCastMessageTypeOrThrow,
  buildNonGroupConversationId,
  determineEmbedRenders,
  extractDirectCastConversationKey,
  extractDirectCastKey,
  getCanSendDirectCasts,
  isVerifiedSender,
};
