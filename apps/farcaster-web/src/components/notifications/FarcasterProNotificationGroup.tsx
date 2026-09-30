import { ApiFarcasterProNotificationGroup } from 'farcaster-client-data';
import React, { FC, memo, useCallback } from 'react';

import { FarcasterProBadge } from '~/components/badges/FarcasterProBadge';
import { useOptionalEmbeddedWalletBridge } from '~/components/EmbeddedWallet';
import { useWalletGeoRestricted } from '~/hooks/data/useWalletGeoRestricted';
import { useExternalNavigate } from '~/hooks/navigation/useExternalNavigate';

import { NotificationGroupContainer } from './shared/NotificationGroupContainer';
import { NotificationIcon } from './shared/NotificationIcon';

type FarcasterProNotificationGroupProps = {
  group: ApiFarcasterProNotificationGroup;
};

const FarcasterProNotificationGroup: FC<FarcasterProNotificationGroupProps> =
  memo(({ group }) => {
    const isGeoRestricted = useWalletGeoRestricted();
    const embeddedWalletBridge = useOptionalEmbeddedWalletBridge();
    const navigateInWallet = embeddedWalletBridge?.navigate;
    const navigate = useExternalNavigate();

    const clickTarget = group.previewItems[0].content.clickTarget;
    const title = group.previewItems[0].content.title;
    const body = group.previewItems[0].content.body;

    const handleClick = useCallback(() => {
      if (clickTarget === 'https://farcaster.xyz/~/wallet/collectibles') {
        if (!isGeoRestricted && navigateInWallet) {
          navigateInWallet({
            path: 'collectibles',
          });
        }
      } else {
        if (clickTarget) {
          navigate({ to: clickTarget, openInNewTab: true });
        }
      }
    }, [clickTarget, isGeoRestricted, navigateInWallet, navigate]);

    return (
      <NotificationGroupContainer
        notificationGroup={group}
        onClick={handleClick}
      >
        <NotificationIcon variant="purple">
          <FarcasterProBadge size={20} />
        </NotificationIcon>
        <div className="flex flex-1 flex-col gap-0.5 self-center">
          <div className="flex w-full flex-row items-start justify-between">
            <div className="shrink font-semibold">{title}</div>
          </div>
          <div className="text-muted">{body}</div>
        </div>
      </NotificationGroupContainer>
    );
  });

FarcasterProNotificationGroup.displayName = 'FarcasterProNotificationGroup';

export { FarcasterProNotificationGroup };
