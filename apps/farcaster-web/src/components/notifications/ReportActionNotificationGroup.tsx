import { ApiReportActionNotificationGroup } from 'farcaster-client-data';
import { FC, memo, useMemo } from 'react';

import { FlagIcon } from '~/components/casts/actions/icons/FlagIcon';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { NotificationIcon } from '~/components/notifications/shared/NotificationIcon';

type ReportActionNotificationGroupProps = {
  notificationGroup: ApiReportActionNotificationGroup;
};

const ReportActionNotificationGroup: FC<ReportActionNotificationGroupProps> =
  memo(({ notificationGroup }) => {
    const firstSentence = useMemo(() => {
      if (notificationGroup.totalItemCount > 1) {
        return `We've taken action on ${notificationGroup.totalItemCount} cast reports.`;
      }

      return `Your report of ${notificationGroup.previewItems[0].content.reportCastReason} content has been addressed.`;
    }, [notificationGroup.previewItems, notificationGroup.totalItemCount]);

    return (
      <NotificationGroupContainer
        notificationGroup={notificationGroup}
        clickable={false}
      >
        <NotificationIcon variant="yellow">
          <div className="pt-[3px]">
            <FlagIcon />
          </div>
        </NotificationIcon>
        <div>
          <div className="w-full min-w-0">{firstSentence}</div>
          <div>Thank you for your help.</div>
        </div>
      </NotificationGroupContainer>
    );
  });

ReportActionNotificationGroup.displayName = 'ReportActionNotificationGroup';

export { ReportActionNotificationGroup };
