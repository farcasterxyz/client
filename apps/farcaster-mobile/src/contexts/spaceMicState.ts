import type { ApiAudioRoomRole } from 'farcaster-client-data';
import { type Room, Track } from 'livekit-client';

function isPublishingRole(role: ApiAudioRoomRole): boolean {
  return role === 'host' || role === 'cohost' || role === 'speaker';
}

function preservesMicrophoneState(role: ApiAudioRoomRole): boolean {
  return role === 'cohost' || role === 'speaker';
}

function getInitialMicrophoneEnabledForRoleRefresh({
  currentRole,
  nextRole,
  currentMicrophoneEnabled,
}: {
  currentRole: ApiAudioRoomRole;
  nextRole: ApiAudioRoomRole;
  currentMicrophoneEnabled: boolean;
}): boolean {
  if (
    !preservesMicrophoneState(currentRole) ||
    !preservesMicrophoneState(nextRole)
  ) {
    return false;
  }

  return currentMicrophoneEnabled;
}

function resolveEffectiveRole({
  joinedRole,
  connectRole,
  sameSession,
}: {
  joinedRole: ApiAudioRoomRole | null;
  connectRole: ApiAudioRoomRole;
  sameSession: boolean;
}): ApiAudioRoomRole {
  if (!sameSession || !joinedRole) {
    return connectRole;
  }
  // Demotion wins over stale publishing tokens from in-flight joins.
  if (joinedRole === 'listener') {
    return 'listener';
  }
  if (isPublishingRole(joinedRole)) {
    return joinedRole;
  }
  return joinedRole;
}

async function applySpeakerMicrophoneState({
  participant,
  enabled,
  previousRole,
}: {
  participant: Room['localParticipant'];
  enabled: boolean;
  previousRole: ApiAudioRoomRole;
}): Promise<void> {
  if (enabled) {
    await participant.setMicrophoneEnabled(true);
    return;
  }
  const hasMicrophonePublication =
    participant.getTrackPublication(Track.Source.Microphone) !== undefined;
  // Fresh LiveKit rooms (and listener→publisher) have no mic publication yet.
  // Do not trust previousRole alone: in-place promotion can update joined.role
  // before a fallback reconnect creates a new Room.
  if (!hasMicrophonePublication || !isPublishingRole(previousRole)) {
    // Enable first so mute creates a muted publication.
    await participant.setMicrophoneEnabled(true);
    await participant.setMicrophoneEnabled(false);
    return;
  }
  await participant.setMicrophoneEnabled(false);
}

export {
  applySpeakerMicrophoneState,
  getInitialMicrophoneEnabledForRoleRefresh,
  resolveEffectiveRole,
};
