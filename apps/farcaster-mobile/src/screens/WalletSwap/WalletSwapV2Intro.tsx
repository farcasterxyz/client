import { useSetUserPreferences } from 'farcaster-client-hooks';
import {
  useCurrentUser,
  useEmbeddedWallet,
  useTheme,
  useUserLevel,
  useWalletGeoRestricted,
  WalletNotAvailableInRegion,
  WalletNotConnected,
} from 'farcaster-expo';
import { BadgePercent, Gift, ScanSearch } from 'lucide-react-native';
import * as React from 'react';
import { ScrollView } from 'react-native';

import { FeatureIntro } from '~/components/FeatureIntro';
import { useGoBack } from '~/hooks/navigation/useGoBack';
import { usePush } from '~/hooks/navigation/usePush';

export function WalletSwapV2Intro({ onClose }: { onClose: () => void }) {
  const t = useTheme();
  const { evmAddress } = useEmbeddedWallet();
  const geoRestricted = useWalletGeoRestricted();
  const user = useCurrentUser();
  const isPro = useUserLevel(user) === 'pro';
  const goBack = useGoBack();
  const push = usePush();
  const setUserPreference = useSetUserPreferences();

  const primaryActionOnPress = React.useCallback(() => {
    if (isPro) {
      onClose();
    } else {
      push('FarcasterProUpsell', { source: 'swap-v2-intro' });
    }
  }, [isPro, onClose, push]);

  React.useEffect(() => {
    void setUserPreference({
      preferences: {
        showSwapV2Intro: false,
      },
    });
  }, [setUserPreference]);

  if (geoRestricted) {
    return <WalletNotAvailableInRegion />;
  }

  if (!evmAddress) {
    return <WalletNotConnected source="wallet-swap" />;
  }

  return (
    <ScrollView
      contentContainerStyle={[
        { flex: 1, paddingTop: 12 },
        t.backgrounds.default,
      ]}
    >
      <FeatureIntro
        titleLabel="New"
        title="Pro Trading"
        bannerImage={require('./intro.png')}
        bullets={[
          {
            icon: <BadgePercent color={t.colors.text.primary} />,
            title: 'Best prices for every swap',
            description:
              'Farcaster Pro will find the exchange that gives you the best prices, every time.',
          },
          {
            icon: <ScanSearch color={t.colors.text.primary} />,
            title: 'Lower fees on every swap',
            description:
              'Farcaster Pro charges the lowest fees of any wallet. You earn more on every trade.',
          },
          {
            icon: <Gift color={t.colors.text.primary} />,
            title: 'Earn by swapping',
            description:
              'Swap $100 to earn a boost to your weekly creator rewards. Limited time offer.',
          },
        ]}
        primaryActionText={isPro ? 'Continue' : 'Upgrade to Pro'}
        primaryActionOnPress={primaryActionOnPress}
        secondaryActionText="Skip"
        secondaryActionOnPress={goBack}
      />
    </ScrollView>
  );
}
