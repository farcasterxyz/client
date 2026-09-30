import { QuestionIcon } from '@primer/octicons-react';
import { ApiTokenAlertNotificationGroup } from 'farcaster-client-data';
import {
  formatPrice,
  formatTimeAgo,
  formatTokenStat,
} from 'farcaster-client-hooks';
import { TrendingDown, TrendingUp } from 'lucide-react';
import React, { FC, memo, useCallback } from 'react';

import { NFT_IMAGE_UNAVAILABLE_URL } from '~/components/collections/CollectionNameWithImage';
import { useOptionalEmbeddedWalletBridge } from '~/components/EmbeddedWallet';
import { Image } from '~/components/images/Image';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { useWalletGeoRestricted } from '~/hooks/data/useWalletGeoRestricted';
import { applyCloudflarePath } from '~/utils/images';

import { NotificationGraphic } from './shared/NotificationGraphic';

type TokenAlertNotificationGroupProps = {
  group: ApiTokenAlertNotificationGroup;
};

const TokenAlertNotificationGroup: FC<TokenAlertNotificationGroupProps> = memo(
  ({ group }) => {
    const isGeoRestricted = useWalletGeoRestricted();
    const embeddedWalletBridge = useOptionalEmbeddedWalletBridge();
    const navigateInWallet = embeddedWalletBridge?.navigate;

    const notif = group.previewItems[0];

    const handleClick = useCallback(() => {
      if (!isGeoRestricted && navigateInWallet) {
        navigateInWallet({
          path: 'Token',
          params: {
            chain: notif.content.token.chain,
            ca: notif.content.token.ca,
            via: 'notification_token_alert_inapp',
          },
        });
      }
    }, [isGeoRestricted, navigateInWallet, notif]);

    const {
      upperTargetPriceUsd,
      lowerTargetPriceUsd,
      currentPriceUsd,
      percentChange,
    } = notif.content.metadata;

    let price;
    let hit: 'upper' | 'lower' | undefined = undefined;
    if (upperTargetPriceUsd && upperTargetPriceUsd <= currentPriceUsd) {
      price = upperTargetPriceUsd;
      hit = 'upper';
    } else if (lowerTargetPriceUsd && lowerTargetPriceUsd >= currentPriceUsd) {
      price = lowerTargetPriceUsd;
      hit = 'lower';
    }

    const badge = React.useMemo(() => {
      if (hit === 'upper') {
        return (
          <div className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-md border bg-app border-default">
            <div className="flex size-4 items-center justify-center rounded bg-green-600">
              <TrendingUp className="size-3 text-white" strokeWidth={3} />
            </div>
          </div>
        );
      } else if (hit === 'lower') {
        return (
          <div className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-md border bg-app border-default">
            <div className="flex size-4 items-center justify-center rounded bg-red-500">
              <TrendingDown className="size-3 text-white" strokeWidth={3} />
            </div>
          </div>
        );
      }
      return null;
    }, [hit]);

    let percentage;
    if (percentChange) {
      percentage = `${(percentChange * 100).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })}% `;
    }

    let ticker = notif.content.token.ticker;
    if (ticker.length > 10) {
      ticker = ticker.slice(0, 10) + '...';
    }

    let title = '';
    let body = '';
    if (notif.content.type === 'price-target') {
      title = `${ticker} at ${price ? formatPrice(price) : ''}`;
      body = `Your price target was hit`;
    } else if (notif.content.type === 'price-target-market-cap') {
      if (!notif.content.token.marketCap) {
        return null;
      }
      title = `${ticker} at ${formatTokenStat(notif.content.token.marketCap)}`;
      body = `Your market cap target was hit`;
    } else {
      if (!percentage || !currentPriceUsd || !hit) {
        return null;
      }
      if (currentPriceUsd < 0.1) {
        const priceUsd = notif.content.token.priceUsd
          ? parseFloat(notif.content.token.priceUsd)
          : 0;
        const ratio = currentPriceUsd / priceUsd;
        const marketCap = notif.content.token.marketCap ?? 0;
        const currentMarketCap = marketCap * ratio;
        title = `${ticker} is ${hit === 'upper' ? 'up' : 'down'} ${percentage}`;
        body = `Market cap at ${formatTokenStat(currentMarketCap)}`;
      } else {
        title = `${ticker} is ${hit === 'upper' ? 'up' : 'down'} ${percentage}`;
        body = `Price at ${formatPrice(currentPriceUsd)}`;
      }
    }

    return (
      <NotificationGroupContainer
        notificationGroup={group}
        onClick={handleClick}
      >
        <NotificationGraphic>
          <div className="relative">
            {notif.content.token.imageUrl ? (
              <Image
                src={applyCloudflarePath(notif.content.token.imageUrl, 48)}
                className={
                  'aspect-cover shrink-0 rounded-full border bg-app border-default'
                }
                style={{
                  width: 48,
                  height: 48,
                  minWidth: 48,
                  minHeight: 48,
                }}
                alt={`Image`}
                fallback={NFT_IMAGE_UNAVAILABLE_URL}
              />
            ) : (
              <div
                className="flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900"
                style={{
                  width: 48,
                  height: 48,
                  minWidth: 48,
                  minHeight: 48,
                }}
              >
                {notif.content.token.ticker &&
                notif.content.token.ticker.length > 0 &&
                notif.content.token.ticker.trim() !== '' &&
                notif.content.token.ticker !== '[invalid]' ? (
                  <span className="text-xl font-semibold text-primary">
                    {notif.content.token.ticker[0].toUpperCase()}
                  </span>
                ) : (
                  <QuestionIcon />
                )}
              </div>
            )}
            {badge}
          </div>
        </NotificationGraphic>
        <div className="w-full min-w-0">
          <div className="flex flex-1 flex-col gap-0.5">
            <div className="flex w-full flex-row items-start justify-between gap-x-1">
              <div className="text-base font-semibold text-default">
                {title}
              </div>
              <div className="text-faint">
                {formatTimeAgo(notif.timestamp, 'floor')}
              </div>
            </div>
            <div className="text-muted">{body}</div>
          </div>
        </div>
      </NotificationGroupContainer>
    );
  },
);

TokenAlertNotificationGroup.displayName = 'TokenAlertNotificationGroup';

export { TokenAlertNotificationGroup };
