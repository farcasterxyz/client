// @vitest-environment jsdom

import { Track } from 'livekit-client';

import {
  attachLivekitAudioTrack,
  detachLivekitTrack,
  disconnectLivekitRoom,
  removeOrphanLivekitAudioElements,
} from '~/utils/livekitRoomCleanup';

describe('livekitRoomCleanup', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('attaches and detaches livekit audio elements', () => {
    const audioElement = document.createElement('audio');
    const track = {
      kind: Track.Kind.Audio,
      attach: vi.fn(() => audioElement),
      detach: vi.fn(() => [audioElement]),
    };

    attachLivekitAudioTrack(track as never);

    const attached = document.querySelector(
      '[data-livekit-audio="true"]',
    ) as HTMLAudioElement | null;
    expect(attached).toBeTruthy();
    expect(attached?.style.display).toBe('none');

    detachLivekitTrack(track);
    expect(document.querySelector('[data-livekit-audio="true"]')).toBeNull();
  });

  it('removes orphan livekit audio elements', () => {
    const el1 = document.createElement('audio');
    const el2 = document.createElement('audio');
    el1.setAttribute('data-livekit-audio', 'true');
    el2.setAttribute('data-livekit-audio', 'true');
    document.body.appendChild(el1);
    document.body.appendChild(el2);

    removeOrphanLivekitAudioElements();

    expect(
      document.querySelectorAll('[data-livekit-audio="true"]'),
    ).toHaveLength(0);
  });

  it('disconnects room and clears attached audio resources', async () => {
    const remoteAudio = document.createElement('audio');
    remoteAudio.setAttribute('data-livekit-audio', 'true');
    document.body.appendChild(remoteAudio);

    const localTrack = { detach: vi.fn(() => []) };
    const remoteTrack = { detach: vi.fn(() => [remoteAudio]) };
    const disconnect = vi.fn(async () => undefined);
    const removeAllListeners = vi.fn();
    const setMicrophoneEnabled = vi.fn(async () => undefined);

    const room = {
      localParticipant: {
        setMicrophoneEnabled,
        trackPublications: new Map([['local', { track: localTrack }]]),
      },
      remoteParticipants: new Map([
        [
          'remote',
          {
            trackPublications: new Map([['remote', { track: remoteTrack }]]),
          },
        ],
      ]),
      disconnect,
      removeAllListeners,
    };

    await disconnectLivekitRoom(room as never);

    expect(setMicrophoneEnabled).toHaveBeenCalledWith(false);
    expect(localTrack.detach).toHaveBeenCalledTimes(1);
    expect(remoteTrack.detach).toHaveBeenCalledTimes(1);
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(removeAllListeners).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[data-livekit-audio="true"]')).toBeNull();
  });
});
