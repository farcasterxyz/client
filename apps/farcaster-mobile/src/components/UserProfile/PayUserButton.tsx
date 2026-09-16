import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUser } from 'farcaster-client-data';
import {
  useEmbeddedWallet,
  useEmbeddedWalletsForFid,
  useWalletGeoRestricted,
} from 'farcaster-expo';
import React, { useCallback } from 'react';
import { TouchableOpacity } from 'react-native';

import { DollarCircleIcon } from '~/components/icons/DollarCircleIcon';
import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { usePayUser } from '~/contexts/PayUserProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';

type PayUserButtonProps = {
  user: ApiUser;
};

const PayUserButton: React.FC<PayUserButtonProps> = ({ user }) => {
  const t = useTheme();
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
        origin: 'payUserButton',
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
    <TouchableOpacity
      style={[
        t.flex1,
        t.flexRow,
        t.justifyCenter,
        t.itemsCenter,
        t.borderDefault,
        t.borderHairline,
        t.h10,
        t.roundedLg,
      ]}
      activeOpacity={0.75}
      onPress={() => {
        onPress();
      }}
    >
      <DollarCircleIcon size={18} color={t.colors.text.primary} />
      <Text style={[t.texts.primary, { fontSize: 16, marginLeft: 10 }]}>
        Pay
      </Text>
    </TouchableOpacity>
  );
};

PayUserButton.displayName = 'PayUserButton';

export { PayUserButton };
