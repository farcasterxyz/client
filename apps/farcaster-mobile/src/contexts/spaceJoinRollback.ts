type LeaveAudioRoomFn = (args: { roomId: string }) => Promise<unknown>;
type InvalidateAudioRoomsListFn = () => Promise<unknown> | void;

async function leaveJoinedRoom(
  roomId: string,
  leaveAudioRoom: LeaveAudioRoomFn,
) {
  await leaveAudioRoom({ roomId }).catch(() => {});
}

export async function rollbackJoinedRoomOnConnectFailure({
  roomId,
  leaveAudioRoom,
  invalidateAudioRoomsList,
}: {
  roomId: string | null;
  leaveAudioRoom: LeaveAudioRoomFn;
  invalidateAudioRoomsList: InvalidateAudioRoomsListFn;
}) {
  if (!roomId) {
    return;
  }

  await leaveJoinedRoom(roomId, leaveAudioRoom);
  await Promise.resolve(invalidateAudioRoomsList()).catch(() => {});
}
