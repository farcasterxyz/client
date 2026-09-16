import { ApiAudioRoomScheduledStartNotificationGroup } from 'farcaster-client-data';
import {
  formatTimeAgo,
  useStartScheduledAudioRoom,
} from 'farcaster-client-hooks';
import React, { FC, memo, useCallback, useState } from 'react';

import { Avatar } from '~/components/avatar/Avatar';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { useSpace } from '~/contexts/SpaceContext';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { toast } from '~/utils/toast';

import { NotificationGraphic } from './shared/NotificationGraphic';

type AudioRoomScheduledStartNotificationGroupProps = {
  group: ApiAudioRoomScheduledStartNotificationGroup;
};

const AudioRoomScheduledStartNotificationGroup: FC<AudioRoomScheduledStartNotificationGroupProps> =
  memo(({ group }) => {
    const navigate = useNavigate();
    const { join } = useSpace();
    const startScheduledRoom = useStartScheduledAudioRoom();
    const [isStarting, setIsStarting] = useState(false);

    const notification = group.previewItems[0];
    const { actor, content } = notification;

    const handleClick = useCallback(async () => {
      setIsStarting(true);
      try {
        const result = await startScheduledRoom({ roomId: content.roomId });
        const didJoin = await join(result.room.id, 'spaces_list');
        if (!didJoin) {
          return;
        }
        navigate({ to: 'spaces', params: { roomId: result.room.id } });
      } catch (err) {
        toast({
          message: err instanceof Error ? err.message : 'Failed to start Space',
          type: 'error',
        });
      } finally {
        setIsStarting(false);
      }
    }, [content.roomId, join, navigate, startScheduledRoom]);

    const title = 'Your Space is scheduled to start';
    const body = isStarting
      ? 'Starting your Space...'
      : 'Tap to start and join your Space.';

    return (
      <NotificationGroupContainer
        notificationGroup={group}
        onClick={handleClick}
      >
        <NotificationGraphic>
          <Avatar user={actor} size="lg" />
        </NotificationGraphic>
        <div className="w-full min-w-0">
          <div className="flex flex-1 flex-col gap-0.5">
            <div className="flex w-full flex-row items-start justify-between gap-x-1">
              <div className="text-base font-semibold text-default">
                {title}
              </div>
              <div className="text-faint">
                {formatTimeAgo(notification.timestamp, 'floor')}
              </div>
            </div>
            <div className="line-clamp-2 text-muted">{body}</div>
          </div>
        </div>
      </NotificationGroupContainer>
    );
  });

AudioRoomScheduledStartNotificationGroup.displayName =
  'AudioRoomScheduledStartNotificationGroup';

export { AudioRoomScheduledStartNotificationGroup };
