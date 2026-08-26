import { QuestionIcon } from '@primer/octicons-react';
import {
  ApiTraderAlertNotificationGroup,
  isNativeAsset,
  isUsdc,
  isWrappedNativeAsset,
} from 'farcaster-client-data';
import {
  formatPrice,
  formatTimeAgo,
  formatTokenStat,
} from 'farcaster-client-hooks';
import React, { FC, memo, useCallback } from 'react';

import { Avatar } from '~/components/avatar/Avatar';
import { FarcasterProBadge } from '~/components/badges/FarcasterProBadge';
import { NFT_IMAGE_UNAVAILABLE_URL } from '~/components/collections/CollectionNameWithImage';
import { useOptionalEmbeddedWalletBridge } from '~/components/EmbeddedWallet';
import { Image } from '~/components/images/Image';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { useUserLevel } from '~/hooks/data/useUserLevel';
import { useWalletGeoRestricted } from '~/hooks/data/useWalletGeoRestricted';
import { applyCloudflarePath } from '~/utils/images';

import { NotificationGraphic } from './shared/NotificationGraphic';

type TraderAlertNotificationGroupProps = {
  group: ApiTraderAlertNotificationGroup;
};

const TraderAlertNotificationGroup: FC<TraderAlertNotificationGroupProps> =
  memo(({ group }) => {
    const isGeoRestricted = useWalletGeoRestricted();
    const embeddedWalletBridge = useOptionalEmbeddedWalletBridge();
    const navigateInWallet = embeddedWalletBridge?.navigate;

    const notif = group.previewItems[0];
    const { sentToken, sentAmount, receivedToken, receivedAmount } =
      notif.content.metadata;

    const isReceivedNative =
      isNativeAsset(receivedToken.ca) || isWrappedNativeAsset(receivedToken.ca);
    const isSentNative =
      isNativeAsset(sentToken.ca) || isWrappedNativeAsset(sentToken.ca);
    const isReceivedUsdc = isUsdc(receivedToken.ca);
    const isSentUsdc = isUsdc(sentToken.ca);

    const sentValue = (sentToken.priceUsd ?? 0) * sentAmount;
    const receivedValue = (receivedToken.priceUsd ?? 0) * receivedAmount;

    const sentValueDisplay = formatPrice(sentValue || receivedValue);
    const receivedValueDisplay = formatPrice(receivedValue || sentValue);

    const sentMarketCapDisplay = sentToken.marketCap
      ? formatTokenStat(sentToken.marketCap)
      : undefined;
    const receivedMarketCapDisplay = receivedToken.marketCap
      ? formatTokenStat(receivedToken.marketCap)
      : undefined;

    const username = notif.content.targetUser.username;
    let verb = 'Bought';
    let body = `${sentValueDisplay} ${receivedToken.symbol}${receivedMarketCapDisplay ? ` at ${receivedMarketCapDisplay} MC` : ''}`;
    let token = receivedToken;
    if (
      isSentUsdc &&
      ['token-bought', 'token-swapped'].includes(notif.content.type)
    ) {
      verb = 'Bought';
      body = `${sentValueDisplay} of ${receivedToken.symbol}${receivedMarketCapDisplay ? ` at ${receivedMarketCapDisplay} MC` : ''}`;
      token = receivedToken;
    } else if (
      isReceivedUsdc &&
      ['token-sold', 'token-swapped'].includes(notif.content.type)
    ) {
      verb = 'Sold';
      body = `${receivedValueDisplay} of ${sentToken.symbol}${sentMarketCapDisplay ? ` at ${sentMarketCapDisplay} MC` : ''}`;
      token = sentToken;
    } else if (
      isSentNative &&
      ['token-bought', 'token-swapped'].includes(notif.content.type)
    ) {
      verb = 'Bought';
      body = `${sentValueDisplay} of ${receivedToken.symbol}${receivedMarketCapDisplay ? ` at ${receivedMarketCapDisplay} MC` : ''}`;
      token = receivedToken;
    } else if (
      isReceivedNative &&
      ['token-sold', 'token-swapped'].includes(notif.content.type)
    ) {
      verb = 'Sold';
      body = `${receivedValueDisplay} of ${sentToken.symbol}${sentMarketCapDisplay ? ` at ${sentMarketCapDisplay} MC` : ''}`;
      token = sentToken;
    }

    const handleClick = useCallback(() => {
      if (!isGeoRestricted && navigateInWallet) {
        navigateInWallet({
          path: 'Token',
          params: {
            chain: token.chain,
            ca: token.ca,
            via: 'notification_trader_alert_inapp',
          },
        });
      }
    }, [isGeoRestricted, navigateInWallet, token.ca, token.chain]);

    const isPro = useUserLevel(notif.content.targetUser) === 'pro';

    return (
      <NotificationGroupContainer
        notificationGroup={group}
        onClick={handleClick}
      >
        <NotificationGraphic>
          <div className="relative">
            <Avatar
              size="md"
              user={notif.content.targetUser}
              hideFollowButton={true}
            />
            {token.imageUrl ? (
              <Image
                src={applyCloudflarePath(token.imageUrl, 20)}
                className={
                  'aspect-cover absolute -bottom-0.5 -right-0.5 shrink-0 rounded-full border bg-app border-default'
                }
                style={{
                  width: 20,
                  height: 20,
                  minWidth: 20,
                  minHeight: 20,
                }}
                alt={`Image`}
                fallback={NFT_IMAGE_UNAVAILABLE_URL}
              />
            ) : (
              <div
                className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900"
                style={{
                  width: 20,
                  height: 20,
                  minWidth: 20,
                  minHeight: 20,
                }}
              >
                {token.symbol &&
                token.symbol.length > 0 &&
                token.symbol.trim() !== '' &&
                token.symbol !== '[invalid]' ? (
                  <span className="text-xl font-semibold text-primary">
                    {token.symbol[0].toUpperCase()}
                  </span>
                ) : (
                  <QuestionIcon />
                )}
              </div>
            )}
          </div>
        </NotificationGraphic>
        <div className="w-full min-w-0">
          <div className="flex flex-1 flex-col gap-0.5">
            <div className="flex w-full flex-row items-start justify-between gap-x-1">
              <div className="flex flex-row items-center space-x-0.5">
                <div className="text-base font-semibold text-default">
                  {username}
                </div>
                {isPro && <FarcasterProBadge size={18} className="mb-1" />}
              </div>
              <div className="text-faint">
                {formatTimeAgo(notif.timestamp, 'floor')}
              </div>
            </div>
            <div className="text-muted">{`${verb} ${body}`}</div>
          </div>
        </div>
      </NotificationGroupContainer>
    );
  });

TraderAlertNotificationGroup.displayName = 'TraderAlertNotificationGroup';

export { TraderAlertNotificationGroup };
