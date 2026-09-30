import classNames from 'classnames';
import React, { useMemo } from 'react';

import { Tooltip } from '~/components/Tooltip';
import { dayjs } from '~/utils/dayjs';

const useDirectCastFormattedTimestamp = ({
  selfDirectCast,
  timestamp,
  hasUnread,
  applyInboxStyles,
  muted,
  applyImageOnlyDirectCastStyles = false,
  applyMutedStyles = false,
}: {
  selfDirectCast: boolean;
  timestamp?: number;
  hasUnread: boolean;
  applyInboxStyles: boolean;
  muted: boolean;
  applyImageOnlyDirectCastStyles?: boolean;
  applyMutedStyles?: boolean;
}) => {
  return useMemo(() => {
    if (!timestamp) {
      return null;
    }

    const dt = dayjs(timestamp);

    const displayedTimestmap = applyInboxStyles
      ? dt.calendar(null, {
          sameDay: 'h:mm A',
          lastDay: '[Yesterday]',
          sameWeek: 'ddd',
          lastWeek: 'M/D/YY',
          sameElse: 'M/D/YY',
        })
      : dt.format('h:mm A');

    if (applyInboxStyles) {
      return (
        <div
          className={classNames(
            'flex-shrink-0 select-none text-sm',
            hasUnread && !muted && '!text-[#7C65C1]',
            hasUnread && muted && 'text-muted',
            applyMutedStyles && 'text-muted',
          )}
        >
          {displayedTimestmap}
        </div>
      );
    }

    return (
      <Tooltip
        trigger={
          <div
            className={classNames(
              'mr-0.5 min-w-[50px] cursor-default select-none text-xs',
              selfDirectCast
                ? 'text-self-direct-casts-timestamp'
                : 'text-direct-casts-timestamp',
              applyMutedStyles && 'text-muted',
              applyImageOnlyDirectCastStyles
                ? 'w-max !min-w-0 !text-light'
                : 'w-max !min-w-0 text-end',
            )}
          >
            {displayedTimestmap}
          </div>
        }
        content={
          <div className="px-1 text-sm text-white">
            {new Date(dt.toDate()).toLocaleTimeString()} ·{' '}
            {new Date(dt.toDate()).toLocaleDateString()}
          </div>
        }
      />
    );
  }, [
    applyImageOnlyDirectCastStyles,
    applyInboxStyles,
    applyMutedStyles,
    hasUnread,
    selfDirectCast,
    muted,
    timestamp,
  ]);
};

export { useDirectCastFormattedTimestamp };
