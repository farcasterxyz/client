import { QuestionIcon } from '@primer/octicons-react';
import {
  apiChainToChainIdOrThrow,
  ApiSwapFailedNotificationGroup,
  isNativeAsset,
  isUsdc,
  isWrappedNativeAsset,
} from 'farcaster-client-data';
import { formatTimeAgo } from 'farcaster-client-hooks';
import { X } from 'lucide-react';
import React, { FC, memo } from 'react';

import { NFT_IMAGE_UNAVAILABLE_URL } from '~/components/collections/CollectionNameWithImage';
import { useOptionalEmbeddedWalletBridge } from '~/components/EmbeddedWallet';
import { Image } from '~/components/images/Image';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { useWalletGeoRestricted } from '~/hooks/data/useWalletGeoRestricted';
import { applyCloudflarePath } from '~/utils/images';

import { NotificationGraphic } from './shared/NotificationGraphic';

type SwapFailedNotificationGroupProps = {
  group: ApiSwapFailedNotificationGroup;
};

const SwapFailedNotificationGroup: FC<SwapFailedNotificationGroupProps> = memo(
  ({ group }) => {
    const isGeoRestricted = useWalletGeoRestricted();
    const embeddedWalletBridge = useOptionalEmbeddedWalletBridge();
    const navigateInWallet = embeddedWalletBridge?.navigate;

    const notif = group.previewItems[0];
    const { sellToken, buyToken, sellAmount } = notif.content;

    const handleClick = React.useCallback(() => {
      if (!isGeoRestricted && navigateInWallet) {
        navigateInWallet({
          path: 'WalletSwap',
          params: {
            platformType: 'web',
            swapIntent: {
              sell: {
                chainId: Number(apiChainToChainIdOrThrow(sellToken.chain)),
                address: sellToken.ca,
              },
              buy: {
                chainId: Number(apiChainToChainIdOrThrow(buyToken.chain)),
                address: buyToken.ca,
              },
              sellAmount,
            },
          },
        });
      }
    }, [isGeoRestricted, navigateInWallet, sellToken, buyToken, sellAmount]);

    const isBuyNative =
      isNativeAsset(buyToken.ca) || isWrappedNativeAsset(buyToken.ca);
    const isBuyUsdc = isUsdc(buyToken.ca);
    const isSellNative =
      isNativeAsset(sellToken.ca) || isWrappedNativeAsset(sellToken.ca);
    const isSellUsdc = isUsdc(sellToken.ca);

    let mode = 'buy';
    let token = buyToken;

    if (isSellUsdc) {
      mode = 'buy';
      token = buyToken;
    } else if (isBuyUsdc) {
      mode = 'sell';
      token = sellToken;
    } else if (isSellNative) {
      mode = 'buy';
      token = buyToken;
    } else if (isBuyNative) {
      mode = 'sell';
      token = sellToken;
    }

    const title = `${mode === 'buy' ? 'Buy' : 'Sell'} failed`;
    const body = `Tap to retry your ${mode === 'buy' ? 'buy' : 'sell'} of ${token.symbol}`;

    return (
      <NotificationGroupContainer
        notificationGroup={group}
        onClick={handleClick}
      >
        <NotificationGraphic>
          <div className="relative">
            {token.imageUrl ? (
              <Image
                src={applyCloudflarePath(token.imageUrl, 48)}
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
            <SwapFailedBadge />
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

const SwapFailedBadge = () => {
  return (
    <div className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border bg-app border-default">
      <div className="flex size-4 items-center justify-center rounded-full bg-red-500">
        <X className="size-3 text-white" strokeWidth={3} />
      </div>
    </div>
  );
};

SwapFailedNotificationGroup.displayName = 'SwapFailedNotificationGroup';

export { SwapFailedNotificationGroup };
