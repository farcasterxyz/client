import { ApiCast, ApiChannelUserRole } from 'farcaster-client-data';
import { useMemo } from 'react';

export const useChannelUserAbilities = ({
  viewerFid,
  viewerRole,
  targetFid,
  targetRole,
  targetBanned,
}: {
  viewerFid: number | undefined;
  viewerRole: ApiChannelUserRole | undefined;
  targetFid: number | undefined;
  targetRole: ApiChannelUserRole | undefined;
  targetBanned: boolean | undefined;
}) => {
  const isOwner = viewerRole === 'owner';
  const isOwnerOrMod = viewerRole === 'owner' || viewerRole === 'moderator';
  const isSelf = viewerFid === targetFid;

  return useMemo(
    () => ({
      canBanFromChannel: !isSelf && isOwnerOrMod && targetRole === 'none',
      canUnbanFromChannel: !isSelf && isOwnerOrMod && targetBanned,
      canAddAsMember: !isSelf && isOwnerOrMod && targetRole === 'none',
      canRemoveAsMember: !isSelf && isOwnerOrMod && targetRole === 'member',
      canAddAsModerator: !isSelf && isOwner && targetRole === 'member',
      canRemoveAsModerator: !isSelf && isOwner && targetRole === 'moderator',
    }),
    [isOwner, isOwnerOrMod, isSelf, targetBanned, targetRole],
  );
};

export const useChannelCastAbilities = ({
  viewerFid,
  viewerRole,
  cast,
}: {
  viewerFid: number | undefined;
  viewerRole: ApiChannelUserRole | undefined;
  cast: ApiCast;
}) => {
  const userAbilities = useChannelUserAbilities({
    viewerFid,
    viewerRole,
    targetFid: cast.author.fid,
    targetRole: cast.channel?.authorContext?.role,
    targetBanned: cast.channel?.authorContext?.banned,
  });

  const isOwnerOrMod = viewerRole === 'owner' || viewerRole === 'moderator';

  return useMemo(
    () => ({
      ...userAbilities,
      canPinCast: isOwnerOrMod && !cast.parentHash,
      canHideCast: isOwnerOrMod,
    }),
    [cast.parentHash, isOwnerOrMod, userAbilities],
  );
};
