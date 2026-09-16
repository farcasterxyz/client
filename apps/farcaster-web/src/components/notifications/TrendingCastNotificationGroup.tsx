import { ApiTrendingCastNotificationGroup } from 'farcaster-client-data';
import React from 'react';

import { FlameFillIcon } from '~/components/casts/actions/icons/FlameFillIcon';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { NotificationIcon } from '~/components/notifications/shared/NotificationIcon';
import { useNavigateToConversation } from '~/hooks/navigation/useNavigateToConversation';
import { useNavigateToNotificationGroupCasts } from '~/hooks/navigation/useNavigateToNotificationGroupCasts';

import { NotificationGroupCastText } from './shared/NotificationGroupCastText';

type TrendingCastNotificationGroupProps = {
  notificationGroup: ApiTrendingCastNotificationGroup;
};

const TrendingCastNotificationGroup: React.FC<TrendingCastNotificationGroupProps> =
  React.memo(({ notificationGroup }) => {
    const navigateToConversation = useNavigateToConversation();
    const navigateToNotificationGroup = useNavigateToNotificationGroupCasts();

    const firstPreviewItem = React.useMemo(
      () => notificationGroup.previewItems[0],
      [notificationGroup.previewItems],
    );

    const multipleCastsAreTrending = React.useMemo(() => {
      return notificationGroup.totalItemCount !== 1;
    }, [notificationGroup.totalItemCount]);

    return (
      <NotificationGroupContainer
        notificationGroup={notificationGroup}
        onClick={() => {
          if (multipleCastsAreTrending) {
            navigateToNotificationGroup({
              groupId: notificationGroup.id,
              type: notificationGroup.type,
            });
          } else {
            navigateToConversation({
              castHash: firstPreviewItem.content.cast.hash,
              authorUsername: firstPreviewItem.content.cast.author.username,
            });
          }
        }}
      >
        <NotificationIcon variant="yellow">
          <FlameFillIcon />
        </NotificationIcon>
        <div className="group w-full min-w-0">
          <div className="line-clamp-2 font-semibold break-gracefully">
            {multipleCastsAreTrending
              ? `You have ${notificationGroup.totalItemCount} casts trending!`
              : 'Your cast is trending!'}
          </div>
          <NotificationGroupCastText cast={firstPreviewItem.content.cast} />
          {multipleCastsAreTrending && (
            <div className="mt-1 text-sm text-action-purple group-hover:underline">
              Show more
            </div>
          )}
        </div>
      </NotificationGroupContainer>
    );
  });

TrendingCastNotificationGroup.displayName = 'TrendingCastNotificationGroup';

export { TrendingCastNotificationGroup };
