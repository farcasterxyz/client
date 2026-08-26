import { buildAudioRoomParticipantsKey } from '../buildAudioRoomParticipantsKey';

describe('buildAudioRoomParticipantsKey', () => {
  it('uses the same key when includePast is omitted or false', () => {
    expect(
      buildAudioRoomParticipantsKey({
        roomId: 'room-1',
        includePast: false,
      }),
    ).toEqual(buildAudioRoomParticipantsKey({ roomId: 'room-1' }));
  });

  it('uses a distinct key when includePast is true', () => {
    expect(
      buildAudioRoomParticipantsKey({
        roomId: 'room-1',
        includePast: true,
      }),
    ).toEqual(['audioRoomParticipants', 'room-1', true]);
  });
});
