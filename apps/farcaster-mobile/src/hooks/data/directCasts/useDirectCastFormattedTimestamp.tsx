import moment from 'moment';
import React, { useMemo } from 'react';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

const useV3DirectCastFormattedTimestamp = ({
  selfDirectCast,
  timestamp,
  hasUnread,
  applyInboxStyles,
  muted,
  applyImageDirectCastStyles = false,
  applyMutedStyles = false,
}: {
  selfDirectCast: boolean;
  timestamp: number | undefined;
  hasUnread: boolean;
  applyInboxStyles: boolean;
  applyImageDirectCastStyles: boolean;
  muted: boolean;
  applyMutedStyles?: boolean;
}) => {
  const t = useTheme();

  return useMemo(() => {
    if (typeof timestamp === 'undefined') {
      return null;
    }

    const mt = moment(timestamp);

    const displayedTimestmap = applyInboxStyles
      ? mt.calendar(null, {
          sameDay: 'h:mm A',
          lastDay: '[Yesterday]',
          sameWeek: 'ddd',
          lastWeek: 'M/D/YY',
          sameElse: 'M/D/YY',
        })
      : mt.format('h:mm A');

    return (
      <Text
        style={[
          applyInboxStyles
            ? {
                fontSize: 14,
                lineHeight: 20,
                fontWeight: hasUnread && !muted ? '500' : '400',
              }
            : { fontSize: 12, marginLeft: 2 },
          !applyImageDirectCastStyles
            ? hasUnread && !muted
              ? { color: '#7C65C1' }
              : applyInboxStyles
                ? t.directCasts.textTimestamp
                : selfDirectCast
                  ? applyMutedStyles
                    ? t.directCasts.textTimestamp
                    : t.directCasts.textSelfTimestamp
                  : t.directCasts.textTimestamp
            : [t.texts.light],
        ]}
      >
        {displayedTimestmap}
      </Text>
    );
  }, [
    applyImageDirectCastStyles,
    applyInboxStyles,
    applyMutedStyles,
    selfDirectCast,
    timestamp,
    hasUnread,
    muted,
    t.directCasts.textTimestamp,
    t.texts.light,
    t.directCasts.textSelfTimestamp,
  ]);
};

export { useV3DirectCastFormattedTimestamp };
