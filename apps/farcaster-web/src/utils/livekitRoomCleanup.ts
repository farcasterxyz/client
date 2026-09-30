import { type RemoteTrack, Room, Track } from 'livekit-client';

const LIVEKIT_AUDIO_TRACK_ATTRIBUTE = 'data-livekit-audio';
const LIVEKIT_AUDIO_TRACK_SELECTOR = `[${LIVEKIT_AUDIO_TRACK_ATTRIBUTE}="true"]`;

function removeElements(elements: Iterable<Element>) {
  for (const element of elements) {
    element.remove();
  }
}

function detachTrackElements(
  track: { detach?: () => Element[] } | null | undefined,
) {
  if (!track || typeof track.detach !== 'function') {
    return;
  }
  removeElements(track.detach());
}

function attachLivekitAudioTrack(track: RemoteTrack) {
  if (track.kind !== Track.Kind.Audio) {
    return;
  }

  const element = track.attach();
  element.setAttribute(LIVEKIT_AUDIO_TRACK_ATTRIBUTE, 'true');
  element.style.display = 'none';
  document.body.appendChild(element);
}

function detachLivekitTrack(track: { detach?: () => Element[] }) {
  detachTrackElements(track);
}

function removeOrphanLivekitAudioElements() {
  if (typeof document === 'undefined') {
    return;
  }

  removeElements(document.querySelectorAll(LIVEKIT_AUDIO_TRACK_SELECTOR));
}

async function disconnectLivekitRoom(
  room: Room | null | undefined,
  options: { disableLocalMicrophone?: boolean } = {},
) {
  if (!room) {
    removeOrphanLivekitAudioElements();
    return;
  }

  if (options.disableLocalMicrophone !== false) {
    await room.localParticipant.setMicrophoneEnabled(false).catch(() => {});
  }

  for (const participant of room.remoteParticipants.values()) {
    for (const publication of participant.trackPublications.values()) {
      detachTrackElements(publication.track);
    }
  }

  for (const publication of room.localParticipant.trackPublications.values()) {
    detachTrackElements(publication.track);
  }

  await room.disconnect().catch(() => {});
  (room as { removeAllListeners?: () => void }).removeAllListeners?.();
  removeOrphanLivekitAudioElements();
}

export {
  attachLivekitAudioTrack,
  detachLivekitTrack,
  disconnectLivekitRoom,
  removeOrphanLivekitAudioElements,
};
