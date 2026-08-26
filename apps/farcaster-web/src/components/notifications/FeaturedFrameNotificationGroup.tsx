import { StarIcon } from '@primer/octicons-react';
import {
  ApiFeaturedFrameNotificationGroup,
  ApiNotificationFeaturedFrame,
} from 'farcaster-client-data';
import { FC, memo, useMemo } from 'react';

import { FrameEmbedNext } from '~/components/frames/FrameEmbedNext';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { NotificationIcon } from '~/components/notifications/shared/NotificationIcon';
import { FavoriteFrameProvider } from '~/contexts/FavoriteFrameProvider';
import { useMinimizableWindowContext } from '~/contexts/MinimizableWindowProvider';

type FeaturedFrameNotificationGroupProps = {
  group: ApiFeaturedFrameNotificationGroup;
};

const FeaturedFrameNotificationGroup: FC<FeaturedFrameNotificationGroupProps> =
  memo(({ group }) => {
    const notif = useMemo(() => group.previewItems[0], [group.previewItems]);
    const isUnread = useMemo(() => group.isUnread, [group.isUnread]);

    return (
      <FavoriteFrameProvider>
        <FeaturedFrameNotification notif={notif} isUnread={isUnread} />
      </FavoriteFrameProvider>
    );
  });
FeaturedFrameNotificationGroup.displayName = 'FeaturedFrameNotificationGroup';

interface FeaturedFrameNotificationProps {
  notif: ApiNotificationFeaturedFrame;
  isUnread?: boolean;
}

const FeaturedFrameNotification: FC<FeaturedFrameNotificationProps> = ({
  notif,
  isUnread,
}) => {
  const { launchMiniApp } = useMinimizableWindowContext();
  const frame = notif.content.frame;

  return (
    <NotificationGroupContainer
      notificationGroup={{ type: 'featured-frame', isUnread }}
      trackingProps={{
        domain: frame.domain,
        name: frame.name,
      }}
      onClick={() => {
        launchMiniApp({
          context: {
            type: 'launcher',
          },
          launchConfig: {
            type: 'standalone',
            name: frame.name,
            url: frame.homeUrl,
            splashImageUrl: frame.splashImageUrl,
            splashBackgroundColor: frame.splashBackgroundColor,
            author: frame.author,
          },
        });
      }}
    >
      <NotificationIcon variant="blue">
        <StarIcon size={20} className="mt-[2px]" />
      </NotificationIcon>
      <div className="flex flex-1 flex-col gap-2">
        <div className="text-base font-semibold text-default">
          Featured Mini App
        </div>
        <FrameEmbedNext
          frameEmbed={{
            frameUrl: frame.homeUrl,
            frameEmbed: {
              version: 'next',
              imageUrl: frame.imageUrl || frame.splashImageUrl,
              button: {
                title: frame.buttonTitle || 'Launch',
                action: {
                  type: 'launch_frame',
                  name: frame.name,
                  url: frame.homeUrl,
                  splashImageUrl: frame.splashImageUrl,
                  splashBackgroundColor:
                    notif.content.frame.splashBackgroundColor,
                },
              },
            },
            author: notif.content.frame.author,
          }}
          context={{
            type: 'launcher',
          }}
        />
      </div>
    </NotificationGroupContainer>
  );
};

export { FeaturedFrameNotificationGroup };
