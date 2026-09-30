import {
  apiChainToViemChain,
  ApiWalletActivityNotificationGroup,
  getTransactionExplorerUrl,
} from 'farcaster-client-data';
import { formatTimeAgo } from 'farcaster-client-hooks';
import React, { FC, memo, useCallback, useMemo } from 'react';
import { formatUnits } from 'viem';

import { Avatar } from '~/components/avatar/Avatar';
import { WalletIcon } from '~/components/icons/WalletIcon';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { useExternalNavigate } from '~/hooks/navigation/useExternalNavigate';

import { NotificationGraphic } from './shared/NotificationGraphic';

type WalletActivityNotificationGroupProps = {
  group: ApiWalletActivityNotificationGroup;
};

const WalletActivityNotificationGroup: FC<WalletActivityNotificationGroupProps> =
  memo(({ group }) => {
    const navigate = useExternalNavigate();
    const user = useMemo(() => {
      for (const item of group.previewItems) {
        if ('fromUser' in item.content && item.content.fromUser) {
          return item.content.fromUser;
        }
      }
      return null;
    }, [group.previewItems]);

    const handlePress = useCallback(() => {
      const chain = apiChainToViemChain(
        group.previewItems[0].content.token.chain,
      );
      if (!chain) {
        return;
      }
      const url = getTransactionExplorerUrl({
        type: 'tx',
        chainId: chain.id.toString(),
        hash: group.previewItems[0].content.hash,
      });
      if (url) {
        navigate({ to: url, openInNewTab: true });
      }
    }, [group.previewItems, navigate]);

    const message = useMemo(() => {
      const item = group.previewItems[0];
      switch (item.content.type) {
        case 'mint':
          return (
            <div>
              <span>You minted </span>
              <span className="font-semibold">{item.content.token.name}</span>
            </div>
          );
        case 'receive': {
          const address =
            item.content.fromAddress.substring(0, 6) +
            '...' +
            item.content.fromAddress.substring(
              item.content.fromAddress.length - 4,
            );

          const amount = parseFloat(
            formatUnits(
              BigInt(item.content.amount),
              item.content.token.decimals ?? 18,
            ),
          );

          let amountDisplay = amount.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          });
          if (amount < 0.01) {
            amountDisplay = amount.toFixed(6);
          } else if (amount < 1) {
            amountDisplay = amount.toFixed(4);
          } else if (amount < 100) {
            amountDisplay = amount.toFixed(2);
          }

          return (
            <div>
              <span>{user?.username ?? address}</span>
              <span> sent you </span>
              <span className="font-semibold">{`${amountDisplay} ${item.content.token.ticker.slice(0, 10)}${
                item.content.token.ticker.length > 10 ? '...' : ''
              }`}</span>
            </div>
          );
        }
      }
    }, [group.previewItems, user?.username]);

    return (
      <NotificationGroupContainer
        notificationGroup={group}
        onClick={handlePress}
      >
        <NotificationGraphic>
          {user?.pfp?.url ? (
            <div className="relative">
              <Avatar
                user={user}
                size="md"
                isHighlighted={true}
                hideFollowButton
              />
              <div className="absolute bottom-0 right-[-3px] flex size-[20px] items-center justify-center rounded-full border-2 border-[#F5F4FF] bg-purple-200 dark:border-[#1F182C]">
                <WalletIcon width={12} height={12} />
              </div>
            </div>
          ) : (
            <div className="flex size-10 items-center justify-center rounded-full bg-faint">
              <WalletIcon />
            </div>
          )}
        </NotificationGraphic>
        <div className="flex flex-1 flex-col gap-0.5">
          <div className="flex w-full flex-row items-start justify-between">
            <div className="shrink">{message}</div>
            <div className="text-faint">
              {formatTimeAgo(group.previewItems[0].timestamp, 'floor')}
            </div>
          </div>
          <div className="text-muted">View funds in your Farcaster wallet</div>
        </div>
      </NotificationGroupContainer>
    );
  });

WalletActivityNotificationGroup.displayName = 'WalletActivityNotificationGroup';

export { WalletActivityNotificationGroup };
