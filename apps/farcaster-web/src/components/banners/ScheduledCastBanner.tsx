import { CalendarIcon } from '@primer/octicons-react';
import React, { FC, memo } from 'react';

import { dayjs } from '~/utils/dayjs';

interface ScheduledCastComposerBannerProps {
  scheduledAtDate: Date;
}

const ScheduledCastComposerBanner: FC<ScheduledCastComposerBannerProps> = memo(
  ({ scheduledAtDate }) => {
    return (
      <>
        <div className="mt-2 flex cursor-pointer flex-row items-center gap-3 rounded-lg py-2 pl-3 pr-2 bg-elevated hover:bg-overlay-medium">
          <CalendarIcon size={18} className="text-action-purple" />
          <div className="text-[14px]">
            Will send on
            <span className="ml-2 text-muted">
              {dayjs(scheduledAtDate).format('MMM D, h:mma z')}
            </span>
          </div>
        </div>
      </>
    );
  },
);
ScheduledCastComposerBanner.displayName = 'ScheduledCastComposerBanner';

export { ScheduledCastComposerBanner };
