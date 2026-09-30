import formatDistanceStrict from 'date-fns/formatDistanceStrict';
import locale from 'date-fns/locale/en-US';
import setDefaultOptions from 'date-fns/setDefaultOptions';
import { useCallback, useEffect, useState } from 'react';

export const MILLIS_PER_SECOND = 1000;
export const MILLIS_PER_MINUTE = 60 * MILLIS_PER_SECOND;
export const MILLIS_PER_HOUR = 60 * MILLIS_PER_MINUTE;
export const MILLIS_PER_DAY = 24 * MILLIS_PER_HOUR;

export const formatDuration = (
  msec: number,
  addMore: boolean = false,
): string => {
  const more = addMore ? 'more ' : '';

  if (msec > MILLIS_PER_DAY) {
    return `${Math.ceil(msec / MILLIS_PER_DAY)} ${more}days`;
  }
  if (msec > MILLIS_PER_HOUR) {
    return `${Math.ceil(msec / MILLIS_PER_HOUR)} ${more}hours`;
  }
  const numMinutes = Math.ceil(msec / MILLIS_PER_MINUTE);
  return `${numMinutes} ${more}minute${numMinutes > 1 ? 's' : ''}`;
};

export const formatTimeAgo = (
  timestamp: number,
  roundingMethod: 'floor' | 'ceil' | 'round' = 'round',
) => {
  return formatDistanceStrict(new Date(timestamp), new Date(), {
    roundingMethod,
    locale: {
      ...locale,
      formatDistance,
    },
  });
};

export const formatTimeAgoSuffix = (
  timestamp: number,
  roundingMethod: 'floor' | 'ceil' | 'round' = 'round',
) => {
  const result = formatDistanceStrict(new Date(timestamp), new Date(), {
    roundingMethod,
    locale: {
      ...locale,
      formatDistance,
    },
  });

  if (result.endsWith('s')) {
    return 'just now';
  }

  return `${result} ago`;
};

export const formatTimeAgoLong = (
  timestamp: number,
  roundingMethod: 'floor' | 'ceil' | 'round' = 'round',
) => {
  return formatDistanceStrict(new Date(timestamp), new Date(), {
    roundingMethod,
    locale: {
      ...locale,
      formatDistance: formatDistanceLong,
    },
  });
};

export const useTimeAgo = ({
  timestamp,
  suffix = false,
}: {
  timestamp: number;
  suffix?: boolean;
}) => {
  const getTimeAgo = useCallback(() => {
    const newTimeAgo = formatTimeAgo(timestamp);
    return newTimeAgo.endsWith('s')
      ? 'just now'
      : `${newTimeAgo}${suffix ? ' ago' : ''}`;
  }, [timestamp, suffix]);

  const [timeAgo, setTimeAgo] = useState<string>(getTimeAgo());

  // If timestamp changes immediately recalculate timestamps
  useEffect(() => {
    setTimeAgo(getTimeAgo());
  }, [getTimeAgo]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeAgo = getTimeAgo();
      if (newTimeAgo !== timeAgo) {
        setTimeAgo(newTimeAgo);
      }
    }, 15_000);

    return () => clearInterval(interval);
  }, [getTimeAgo, timeAgo]);

  return timeAgo;
};

const formatDistanceLocale: { [key: string]: string } = {
  lessThanXSeconds: '{{count}}s',
  xSeconds: '{{count}}s',
  halfAMinute: '30s',
  lessThanXMinutes: '{{count}}m',
  xMinutes: '{{count}}m',
  aboutXHours: '{{count}}h',
  xHours: '{{count}}h',
  xDays: '{{count}}d',
  aboutXWeeks: '{{count}}w',
  xWeeks: '{{count}}w',
  aboutXMonths: '{{count}}mo',
  xMonths: '{{count}}mo',
  aboutXYears: '{{count}}y',
  xYears: '{{count}}y',
  overXYears: '{{count}}y',
  almostXYears: '{{count}}y',
};

export const formatDistanceLongLocale: { [key: string]: string } = {
  lessThanXSeconds: '{{count}} seconds',
  xSeconds: '{{count}} seconds',
  halfAMinute: '30 seconds',
  lessThanXMinutes: '{{count}} minutes',
  xMinutes: '{{count}} minutes',
  aboutXHours: '{{count}} hours',
  xHours: '{{count}} hours',
  xDays: '{{count}} days',
  aboutXWeeks: '{{count}} weeks',
  xWeeks: '{{count}} weeks',
  aboutXMonths: '{{count}} months',
  xMonths: '{{count}} months',
  aboutXYears: '{{count}} years',
  xYears: '{{count}} years',
  overXYears: '{{count}} years',
  almostXYears: '{{count}} years',
};

const formatDistance = (token: string, count: number) => {
  const result = formatDistanceLocale[token].replace(
    '{{count}}',
    count.toString(),
  );

  return result;
};

export const formatDistanceLong = (token: string, count: number) => {
  const result = formatDistanceLongLocale[token].replace(
    '{{count}}',
    count.toString(),
  );

  if (count === 1) {
    return result.slice(0, -1);
  }

  return result;
};

export const initDateFns = () =>
  setDefaultOptions({
    locale: {
      ...locale,
      formatDistance,
    },
  });
