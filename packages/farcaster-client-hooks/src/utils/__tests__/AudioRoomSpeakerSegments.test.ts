import type { ApiAudioRoomSpeakerSegment } from 'farcaster-client-data';

import {
  buildSpeakerSegmentIndex,
  hasActiveSpeakerSegmentAt,
} from '../AudioRoomSpeakerSegments';

const segment = ({
  fid,
  startMs,
  endMs,
}: {
  fid: number;
  startMs: number;
  endMs: number;
}) =>
  ({
    fid,
    startMs,
    endMs,
  }) as ApiAudioRoomSpeakerSegment;

describe('AudioRoomSpeakerSegments', () => {
  describe('buildSpeakerSegmentIndex', () => {
    it('returns an empty index for missing or empty input', () => {
      expect(buildSpeakerSegmentIndex()).toEqual(new Map());
      expect(buildSpeakerSegmentIndex([])).toEqual(new Map());
    });

    it('groups segments by fid and sorts each group by start time', () => {
      const index = buildSpeakerSegmentIndex([
        segment({ fid: 1, startMs: 400, endMs: 500 }),
        segment({ fid: 2, startMs: 100, endMs: 200 }),
        segment({ fid: 1, startMs: 100, endMs: 300 }),
      ]);

      expect(index.get(1)).toEqual([
        segment({ fid: 1, startMs: 100, endMs: 300 }),
        segment({ fid: 1, startMs: 400, endMs: 500 }),
      ]);
      expect(index.get(2)).toEqual([
        segment({ fid: 2, startMs: 100, endMs: 200 }),
      ]);
    });
  });

  describe('hasActiveSpeakerSegmentAt', () => {
    const segments = [
      segment({ fid: 1, startMs: 100, endMs: 300 }),
      segment({ fid: 1, startMs: 400, endMs: 500 }),
    ];

    it('returns false when there are no candidate segments', () => {
      expect(hasActiveSpeakerSegmentAt([], 100)).toBe(false);
    });

    it('treats startMs as inclusive and endMs as exclusive', () => {
      expect(hasActiveSpeakerSegmentAt(segments, 99)).toBe(false);
      expect(hasActiveSpeakerSegmentAt(segments, 100)).toBe(true);
      expect(hasActiveSpeakerSegmentAt(segments, 299)).toBe(true);
      expect(hasActiveSpeakerSegmentAt(segments, 300)).toBe(false);
    });

    it('finds the latest segment that starts before playback time', () => {
      expect(hasActiveSpeakerSegmentAt(segments, 450)).toBe(true);
      expect(hasActiveSpeakerSegmentAt(segments, 550)).toBe(false);
    });
  });
});
