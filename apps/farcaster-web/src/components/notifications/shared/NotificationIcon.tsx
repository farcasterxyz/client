import cn from 'classnames';
import { FC, memo, ReactNode, useMemo } from 'react';

import { NFT_IMAGE_UNAVAILABLE_URL } from '~/components/collections/CollectionNameWithImage';
import { Image } from '~/components/images/Image';
import { NotificationGraphic } from '~/components/notifications/shared/NotificationGraphic';

type NotificationIconProps = {
  children: ReactNode;
  variant: 'blue' | 'brown' | 'red' | 'green' | 'purple' | 'yellow' | 'gray';
  channelImageUrl?: string;
};

const NotificationIcon: FC<NotificationIconProps> = memo(
  ({ children, variant, channelImageUrl }) => {
    const colorClassNames = useMemo(
      () =>
        cn(
          variant === 'blue' && 'text-informative',
          variant === 'brown' && 'text-brown',
          variant === 'red' && 'text-danger',
          variant === 'green' && 'text-success',
          variant === 'purple' && 'text-brand',
          variant === 'yellow' && 'text-warning',
          variant === 'gray' && 'text-secondary',
        ),
      [variant],
    );

    if (channelImageUrl) {
      // The notification container has bottom padding of 5, but top of 4 so if we have a
      // single line of text the icon looks off vertically, therefore making the height
      // 4px less than the 42px it is
      return (
        <NotificationGraphic>
          <div className="relative h-[38px] w-[44px]">
            <div>
              <Image
                src={channelImageUrl}
                className="aspect-square rounded-full  object-cover"
                style={{
                  width: 28,
                  height: 28,
                  minWidth: 28,
                  minHeight: 28,
                }}
                alt="Channel image"
                fallback={NFT_IMAGE_UNAVAILABLE_URL}
              />
            </div>
            <div
              className={cn(
                'absolute right-0 top-[12px] flex h-[30px] w-[30px] items-center justify-center rounded-full border border-app',
                colorClassNames,
              )}
            >
              <div className="scale-[0.784]">{children}</div>
            </div>
          </div>
        </NotificationGraphic>
      );
    } else {
      return (
        <NotificationGraphic>
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-end rounded-full',
              colorClassNames,
            )}
          >
            <div>{children}</div>
          </div>
        </NotificationGraphic>
      );
    }
  },
);

NotificationIcon.displayName = 'NotificationIcon';

export { NotificationIcon };
