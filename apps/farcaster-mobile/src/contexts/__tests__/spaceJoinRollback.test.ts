import { rollbackJoinedRoomOnConnectFailure } from '../spaceJoinRollback';

describe('rollbackJoinedRoomOnConnectFailure (mobile)', () => {
  test('does nothing when room id is missing', async () => {
    const leaveAudioRoom = jest.fn().mockResolvedValue(undefined);
    const invalidateAudioRoomsList = jest.fn();

    await rollbackJoinedRoomOnConnectFailure({
      roomId: null,
      leaveAudioRoom,
      invalidateAudioRoomsList,
    });

    expect(leaveAudioRoom).not.toHaveBeenCalled();
    expect(invalidateAudioRoomsList).not.toHaveBeenCalled();
  });

  test('rolls back join and invalidates list when room id exists', async () => {
    const leaveAudioRoom = jest.fn().mockResolvedValue(undefined);
    const invalidateAudioRoomsList = jest.fn();

    await rollbackJoinedRoomOnConnectFailure({
      roomId: 'room-1',
      leaveAudioRoom,
      invalidateAudioRoomsList,
    });

    expect(leaveAudioRoom).toHaveBeenCalledWith({ roomId: 'room-1' });
    expect(invalidateAudioRoomsList).toHaveBeenCalledTimes(1);
  });

  test('still invalidates list when rollback leave fails', async () => {
    const leaveAudioRoom = jest
      .fn()
      .mockRejectedValue(new Error('leave failed'));
    const invalidateAudioRoomsList = jest.fn();

    await rollbackJoinedRoomOnConnectFailure({
      roomId: 'room-1',
      leaveAudioRoom,
      invalidateAudioRoomsList,
    });

    expect(leaveAudioRoom).toHaveBeenCalledWith({ roomId: 'room-1' });
    expect(invalidateAudioRoomsList).toHaveBeenCalledTimes(1);
  });

  test('does not throw when invalidation rejects', async () => {
    const leaveAudioRoom = jest.fn().mockResolvedValue(undefined);
    const invalidateAudioRoomsList = jest
      .fn()
      .mockRejectedValue(new Error('invalidate failed'));

    await expect(
      rollbackJoinedRoomOnConnectFailure({
        roomId: 'room-1',
        leaveAudioRoom,
        invalidateAudioRoomsList,
      }),
    ).resolves.toBeUndefined();

    expect(leaveAudioRoom).toHaveBeenCalledWith({ roomId: 'room-1' });
    expect(invalidateAudioRoomsList).toHaveBeenCalledTimes(1);
  });
});
