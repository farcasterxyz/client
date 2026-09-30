import { Room } from 'livekit-client';

async function disconnectLivekitRoom(
  room: Room | null | undefined,
  { disableLocalMicrophone = true }: { disableLocalMicrophone?: boolean } = {},
) {
  if (!room) {
    return;
  }

  if (disableLocalMicrophone) {
    await room.localParticipant.setMicrophoneEnabled(false).catch(() => {});
  }

  await room.disconnect().catch(() => {});
  (room as { removeAllListeners?: () => void }).removeAllListeners?.();
}

export { disconnectLivekitRoom };
