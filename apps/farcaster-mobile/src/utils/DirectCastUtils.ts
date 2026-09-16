import moment from 'moment';

import { DirectCast, isOptimisticDirectCast } from '~/types';

const getDirectCastTimestamp = ({ directCast }: { directCast: DirectCast }) => {
  if (isOptimisticDirectCast(directCast)) {
    return directCast.localTimestamp;
  }

  return directCast.timestamp.valueOf();
};

const COLLAPSE_WITHIN = 3 * 60 * 1000;

// Heavily influenced by Signal implementation of grouping
// https://github.com/signalapp/Signal-Desktop/blob/91399deb267c73ba0aea3efd3d927a19f25b8c8b/ts/util/timelineUtil.ts#L106
const directCastsAreInSameGroup = ({
  previousDirectCast,
  currentDirectCast,
}: {
  previousDirectCast: DirectCast;
  currentDirectCast: DirectCast;
}) => {
  if (
    currentDirectCast.messageType === 'new-device' ||
    currentDirectCast.messageType === 'decrypt-failed'
  ) {
    return false;
  }

  const currentTimestamp = getDirectCastTimestamp({
    directCast: currentDirectCast,
  });

  const previousTimestamp = getDirectCastTimestamp({
    directCast: previousDirectCast,
  });

  return (
    previousDirectCast.address === currentDirectCast.address &&
    currentTimestamp >= previousTimestamp &&
    currentTimestamp - previousTimestamp < COLLAPSE_WITHIN &&
    moment(currentTimestamp).isSame(previousTimestamp, 'day')
  );
};

const v3DirectCastsAreInSameGroup = ({
  previousDirectCastSenderFid,
  currentDirectCastSenderFid,
  previousDirectCastServerTimestamp,
  currentDirectCastServerTimestamp,
  previousDirectCastType,
  currentDirectCastType,
}: {
  previousDirectCastSenderFid: number;
  currentDirectCastSenderFid: number;
  previousDirectCastServerTimestamp: number;
  currentDirectCastServerTimestamp: number;
  previousDirectCastType: string;
  currentDirectCastType: string;
}) => {
  const currentTimestamp = currentDirectCastServerTimestamp;

  const previousTimestamp = previousDirectCastServerTimestamp;

  return (
    previousDirectCastSenderFid === currentDirectCastSenderFid &&
    currentTimestamp >= previousTimestamp &&
    currentTimestamp - previousTimestamp < COLLAPSE_WITHIN &&
    moment(currentTimestamp).isSame(previousTimestamp, 'day') &&
    previousDirectCastType === 'text' &&
    currentDirectCastType === 'text'
  );
};

export {
  directCastsAreInSameGroup,
  getDirectCastTimestamp,
  v3DirectCastsAreInSameGroup,
};
