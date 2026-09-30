import type { MutableRefObject } from 'react';

export type InFlightJoin = {
  roomId: string;
  /** joinGenerationRef value the attempt started under; bumped by leave(). */
  generation: number;
  promise: Promise<boolean>;
};

export type InFlightJoinRef = MutableRefObject<InFlightJoin | null>;

/**
 * Runs a join for `roomId` unless one is already in flight for the same room
 * and join generation, in which case the in-flight promise is returned instead
 * of starting a second LiveKit session. Two concurrent joins for one room (e.g.
 * the Go Live handler and the live screen's auto-join effect) would otherwise
 * disconnect each other and leave the participant kicked from the room. An
 * attempt invalidated by leave() (generation bumped) resolves false and must
 * not be reused, so it never matches a newer generation.
 */
export function runDedupedJoin({
  ref,
  roomId,
  generation,
  start,
}: {
  ref: InFlightJoinRef;
  roomId: string;
  generation: number;
  start: () => Promise<boolean>;
}): Promise<boolean> {
  const inFlight = ref.current;
  if (
    inFlight &&
    inFlight.roomId === roomId &&
    inFlight.generation === generation
  ) {
    return inFlight.promise;
  }

  const entry: InFlightJoin = {
    roomId,
    generation,
    promise: start().finally(() => {
      if (ref.current === entry) {
        ref.current = null;
      }
    }),
  };
  ref.current = entry;
  return entry.promise;
}
