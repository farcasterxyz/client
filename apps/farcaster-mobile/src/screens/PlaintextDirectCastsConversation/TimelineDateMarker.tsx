import { useCalendars } from 'expo-localization';
import moment from 'moment';
import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

type TimelineDateProps = {
  messageServerTimestamp: number;
};

const TimelineDateMarker: React.FC<TimelineDateProps> = ({
  messageServerTimestamp,
}) => {
  const t = useTheme();
  const calendars = useCalendars();

  const computeFormattedDate = useCallback(() => {
    const timeZone = calendars?.[0]?.timeZone || undefined;

    const now = new Date();
    const messageDate = new Date(messageServerTimestamp);

    // Get year, month, day in the target timezone for both dates
    const nowYear = parseInt(
      now.toLocaleDateString('en-US', { timeZone, year: 'numeric' }),
    );
    const nowMonth = parseInt(
      now.toLocaleDateString('en-US', { timeZone, month: 'numeric' }),
    );
    const nowDay = parseInt(
      now.toLocaleDateString('en-US', { timeZone, day: 'numeric' }),
    );

    const msgYear = parseInt(
      messageDate.toLocaleDateString('en-US', { timeZone, year: 'numeric' }),
    );
    const msgMonth = parseInt(
      messageDate.toLocaleDateString('en-US', { timeZone, month: 'numeric' }),
    );
    const msgDay = parseInt(
      messageDate.toLocaleDateString('en-US', { timeZone, day: 'numeric' }),
    );

    // Create dates for comparison (using UTC to avoid timezone issues)
    const nowDayStart = Date.UTC(nowYear, nowMonth - 1, nowDay);
    const msgDayStart = Date.UTC(msgYear, msgMonth - 1, msgDay);

    // Calculate difference in days
    const diffInMs = nowDayStart - msgDayStart;
    const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      // Format as "ddd, MMM D"
      return messageDate.toLocaleDateString('en-US', {
        timeZone,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } else {
      // Format as "MMM D, YYYY"
      return messageDate.toLocaleDateString('en-US', {
        timeZone,
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  }, [calendars, messageServerTimestamp]);

  const computeFormattedDateErrorHandled = React.useCallback(() => {
    try {
      return computeFormattedDate();
    } catch {
      const mt = moment(messageServerTimestamp);
      return mt.calendar(null, {
        sameDay: 'h:mm A',
        lastDay: '[Yesterday]',
        sameWeek: 'ddd',
        lastWeek: 'M/D/YY',
        sameElse: 'M/D/YY',
      });
    }
  }, [computeFormattedDate, messageServerTimestamp]);

  // Compute synchronously on first render (lazy initializer) so the marker
  // paints its date immediately instead of flashing empty and popping in a
  // frame later via setTimeout(0). The effect keeps it correct if the timezone
  // (calendars) resolves late or the row recycles to a new timestamp.
  const [formattedDate, setFormattedDate] = useState<string>(
    computeFormattedDateErrorHandled,
  );

  useEffect(() => {
    setFormattedDate(computeFormattedDateErrorHandled());
  }, [computeFormattedDateErrorHandled]);

  return (
    <View
      style={[
        { position: 'static' },
        t.bottom0,
        t.flex,
        t.flexRow,
        t.itemsCenter,
        t.justifyCenter,
        t.mT3,
        t.mX2,
        t.mB5,
      ]}
    >
      <View
        style={[
          { borderRadius: 11 },
          t.dark ? t.bgPillHighlight : t.bgDefault,
          t.pY1,
          t.pX2,
        ]}
      >
        <Text
          style={[t.textXs, t.texts.primary, t.textCenter, { fontWeight: 400 }]}
        >
          {formattedDate}
        </Text>
      </View>
    </View>
  );
};

export { TimelineDateMarker };
