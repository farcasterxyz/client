import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUser } from 'farcaster-client-data';
import {
  useEmbeddedWallet,
  useEmbeddedWalletsForFid,
  useWalletGeoRestricted,
} from 'farcaster-expo';
import { DollarSign } from 'lucide-react-native';
import React, { useCallback } from 'react';

import { IconPressable } from '~/components/UserProfileWithBanner/IconPressable';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { usePayUser } from '~/contexts/PayUserProvider';
import { usePush } from '~/hooks/navigation/usePush';

type UpdatedPayUserButtonProps = {
  user: ApiUser;
};

const UpdatedPayUserButton: React.FC<UpdatedPayUserButtonProps> = ({
  user,
}) => {
  const push = usePush();
  const { launchPayUser } = usePayUser();
  const { evmAddress: evmTargetAddress, solanaAddress: solanaTargetAddress } =
    useEmbeddedWalletsForFid({
      fid: user.fid,
    });

  const { evmAddress } = useEmbeddedWallet();
  const geoRestricted = useWalletGeoRestricted();
  const { trackEvent } = useAnalytics();

  const onPress = useCallback(() => {
    if (evmTargetAddress) {
      trackEvent(AnalyticsEvent.PayUserViaWarplet, {});
      push('WalletSend', {
        origin: 'PayUserButton',
        platformType: 'mobile',
        sendIntent: {
          recipientUser: user,
          recipientAddress: evmTargetAddress,
          recipientSolanaAddress: solanaTargetAddress,
        },
      });
    } else {
      trackEvent(AnalyticsEvent.PayUserViaLegacyFlow, {});
      launchPayUser({
        user,
        via: 'profile',
      });
    }
  }, [
    evmTargetAddress,
    solanaTargetAddress,
    launchPayUser,
    push,
    user,
    trackEvent,
  ]);

  if (!evmAddress || geoRestricted) {
    return null;
  }

  return (
    <IconPressable
      Icon={({ color, size }) => <DollarSign size={size} color={color} />}
      onPress={onPress}
    />
  );
};

UpdatedPayUserButton.displayName = 'UpdatedPayUserButton';

export { UpdatedPayUserButton };
