import React from 'react';

import { dayjs } from '~/utils/dayjs';

type TimelineDateProps = {
  messageServerTimestamp: number;
};

const TimelineDateMarker: React.FC<TimelineDateProps> = React.memo(
  ({ messageServerTimestamp }) => {
    const formattedTimelineDateMarker = React.useMemo(() => {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const now = dayjs().tz(tz).startOf('day');
      const messageDate = dayjs(messageServerTimestamp).tz(tz).startOf('day');

      const diffInDays = now.diff(messageDate, 'day');

      if (diffInDays === 0) {
        return 'Today';
      } else if (diffInDays === 1) {
        return 'Yesterday';
      } else if (diffInDays < 7) {
        return messageDate.format('ddd, MMM D'); // e.g., Mon, Aug 19
      } else {
        return messageDate.format('MMM D, YYYY'); // e.g., Nov 2, 2023
      }
    }, [messageServerTimestamp]);

    return (
      <div className="my-1 mb-3 flex w-full select-none flex-row items-center justify-center py-1">
        <div className="rounded-[14px] px-3 pb-1 pt-0.5 bg-overlay-light">
          <span className="text-center text-sm font-normal">
            {formattedTimelineDateMarker}
          </span>
        </div>
      </div>
    );
  },
);

export { TimelineDateMarker };
