import type { ApiAudioRoomSpeakerSegment } from 'farcaster-client-data';

function buildSpeakerSegmentIndex(
  speakerSegments?: ApiAudioRoomSpeakerSegment[],
) {
  const segmentsByFid = new Map<number, ApiAudioRoomSpeakerSegment[]>();

  for (const segment of speakerSegments ?? []) {
    const fidSegments = segmentsByFid.get(segment.fid);
    if (fidSegments) {
      fidSegments.push(segment);
    } else {
      segmentsByFid.set(segment.fid, [segment]);
    }
  }

  for (const fidSegments of segmentsByFid.values()) {
    fidSegments.sort((a, b) => a.startMs - b.startMs);
  }

  return segmentsByFid;
}

/** Expects segments sorted by startMs ascending, such as values returned from buildSpeakerSegmentIndex. */
function hasActiveSpeakerSegmentAt(
  segments: ApiAudioRoomSpeakerSegment[],
  playbackMs: number,
) {
  let low = 0;
  let high = segments.length;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (segments[mid].startMs <= playbackMs) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  const segment = segments[low - 1];
  return !!segment && playbackMs < segment.endMs;
}

export { buildSpeakerSegmentIndex, hasActiveSpeakerSegmentAt };
