import { QuestionIcon } from '@primer/octicons-react';
import { ApiLimitOrderMatchedNotificationGroup } from 'farcaster-client-data';
import {
  formatLimitOrderMatchedNotificationCopy,
  formatTimeAgo,
  getLimitOrderMatchedNotificationToken,
  resolveLimitOrderKind,
} from 'farcaster-client-hooks';
import { Check } from 'lucide-react';
import React, { FC, memo } from 'react';

import { NFT_IMAGE_UNAVAILABLE_URL } from '~/components/collections/CollectionNameWithImage';
import { useOptionalEmbeddedWalletBridge } from '~/components/EmbeddedWallet';
import { Image } from '~/components/images/Image';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { useWalletGeoRestricted } from '~/hooks/data/useWalletGeoRestricted';
import { applyCloudflarePath } from '~/utils/images';

import { NotificationGraphic } from './shared/NotificationGraphic';

type LimitOrderMatchedNotificationGroupProps = {
  group: ApiLimitOrderMatchedNotificationGroup;
};

const LimitOrderMatchedNotificationGroup: FC<LimitOrderMatchedNotificationGroupProps> =
  memo(({ group }) => {
    const isGeoRestricted = useWalletGeoRestricted();
    const embeddedWalletBridge = useOptionalEmbeddedWalletBridge();
    const navigateInWallet = embeddedWalletBridge?.navigate;

    const notif = group.previewItems[0];
    const limitOrderId = notif?.content.limitOrderId;

    const handleClick = React.useCallback(() => {
      if (!isGeoRestricted && navigateInWallet) {
        navigateInWallet({
          path: 'Wallet',
          params: { initialTab: 'orders', limitOrderId },
        });
      }
    }, [isGeoRestricted, navigateInWallet, limitOrderId]);

    if (!notif) {
      return null;
    }

    const { kind, sellToken, buyToken, sellAmount, buyAmount, isPartialFill } =
      notif.content;

    const resolvedKind = resolveLimitOrderKind({ kind, sellToken, buyToken });
    const token = getLimitOrderMatchedNotificationToken({
      kind: resolvedKind,
      sellToken,
      buyToken,
    });
    const { title, body } = formatLimitOrderMatchedNotificationCopy({
      kind: resolvedKind,
      sellToken,
      buyToken,
      sellAmount,
      buyAmount,
      isPartialFill,
    });

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
            <LimitOrderMatchedBadge />
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
  });

const LimitOrderMatchedBadge = () => {
  return (
    <div className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border bg-app border-default">
      <div className="flex size-4 items-center justify-center rounded-full bg-green-500">
        <Check className="size-3 text-white" strokeWidth={3} />
      </div>
    </div>
  );
};

LimitOrderMatchedNotificationGroup.displayName =
  'LimitOrderMatchedNotificationGroup';

export { LimitOrderMatchedNotificationGroup };
