import type { ApiAudioRoomParticipant, ApiFid } from 'farcaster-client-data';

type AudioRoomPermissionParticipant = Pick<ApiAudioRoomParticipant, 'role'> & {
  user: Pick<ApiAudioRoomParticipant['user'], 'fid'>;
};

const canUseAudioRoomFallbackHostControls = ({
  hostFid,
  viewerFid,
  participants,
  connectedParticipantFids,
}: {
  hostFid: ApiFid;
  viewerFid?: ApiFid;
  participants?: readonly AudioRoomPermissionParticipant[];
  connectedParticipantFids?: ReadonlySet<ApiFid>;
}) => {
  if (viewerFid === hostFid) {
    return true;
  }

  if (!viewerFid || !participants) {
    return false;
  }

  const hostIsActive = participants.some(
    (participant) => participant.user.fid === hostFid,
  );
  const hostIsConnected =
    connectedParticipantFids && connectedParticipantFids.size > 0
      ? connectedParticipantFids.has(hostFid)
      : true;
  if (hostIsActive && hostIsConnected) {
    return false;
  }

  return participants.some(
    (participant) =>
      participant.user.fid === viewerFid && participant.role === 'cohost',
  );
};

export { canUseAudioRoomFallbackHostControls };
