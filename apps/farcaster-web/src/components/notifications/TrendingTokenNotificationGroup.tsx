import { ApiTrendingTokenNotificationGroup } from 'farcaster-client-data';
import React, { FC, memo, useCallback } from 'react';

import { useOptionalEmbeddedWalletBridge } from '~/components/EmbeddedWallet';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { TokenIcon } from '~/components/tokens/TokenIcon';
import { useWalletGeoRestricted } from '~/hooks/data/useWalletGeoRestricted';

import { NotificationGraphic } from './shared/NotificationGraphic';

type TrendingTokenNotificationGroupProps = {
  group: ApiTrendingTokenNotificationGroup;
};

const TrendingTokenNotificationGroup: FC<TrendingTokenNotificationGroupProps> =
  memo(({ group }) => {
    const isGeoRestricted = useWalletGeoRestricted();
    const embeddedWalletBridge = useOptionalEmbeddedWalletBridge();
    const navigateInWallet = embeddedWalletBridge?.navigate;

    const notif = group.previewItems[0];
    let ticker = notif.content.token.ticker;
    if (ticker.length > 14) {
      ticker = ticker.slice(0, 14) + '...';
    }

    const title = `$${ticker} is trending!`;
    const body =
      notif.content.buyersYouKnow > 1
        ? `${notif.content.buyersYouKnow} people you know just bought it`
        : 'Someone you know just bought it';

    const handleClick = useCallback(() => {
      if (!isGeoRestricted && navigateInWallet) {
        navigateInWallet({
          path: 'Token',
          params: {
            chain: notif.content.token.chain,
            ca: notif.content.token.ca,
            via: 'notification_trending_inapp',
          },
        });
      }
    }, [isGeoRestricted, navigateInWallet, notif]);

    return (
      <NotificationGroupContainer
        notificationGroup={group}
        onClick={handleClick}
      >
        <NotificationGraphic>
          <TokenIcon
            iconUrl={notif.content.token.imageUrl}
            symbol={notif.content.token.ticker}
            diameter={48}
            imageBordered
          />
        </NotificationGraphic>
        <div className="w-full min-w-0">
          <div className="flex flex-1 flex-col gap-0.5">
            <div className="text-base font-semibold text-default">{title}</div>
            <div className="text-muted">{body}</div>
          </div>
        </div>
      </NotificationGroupContainer>
    );
  });

TrendingTokenNotificationGroup.displayName = 'TrendingTokenNotificationGroup';

export { TrendingTokenNotificationGroup };
