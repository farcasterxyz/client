import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WalletActivity } from 'farcaster-expo';
import * as React from 'react';
import { useCallback } from 'react';

import { buildScreen } from '~/components/Screen';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';
import { useLaunchFrame } from '~/hooks/useLaunchFrame';
import { WalletStackParamList } from '~/types';

type WalletActivityScreenProps = NativeStackScreenProps<
  WalletStackParamList,
  'WalletActivity'
>;

const WalletActivityScreen = buildScreen<WalletActivityScreenProps>(
  { name: 'WalletActivity', insetTop: true, themeV2: true },
  () => {
    const launchFrame = useLaunchFrame();
    const pushToUserProfile = usePushToUserProfile();

    const handleUserPress = useCallback(
      ({ fid }: { fid: number }) => {
        pushToUserProfile({ fid });
      },
      [pushToUserProfile],
    );

    return (
      <WalletActivity
        onLaunchFrame={launchFrame}
        onUserPress={handleUserPress}
      />
    );
  },
);

WalletActivityScreen.displayName = 'WalletActivityScreen';

export { WalletActivityScreen };
