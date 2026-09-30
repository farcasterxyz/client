import { Bug, EarthLock } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSharedNavigationContext } from '../../../contexts/SharedNavigationContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useWalletFeatures } from '../../../contexts/WalletFeaturesProvider';
import { useIsAdmin } from '../../../hooks/useIsAdmin';
import { IconButton } from '../../design-system/Buttons/IconButton';
import { ButtonV2 } from '../../design-system/ButtonV2';
import { CircleIconBadge } from '../../design-system/CircleIconBadge';
import { Text2 } from '../../design-system/Text';

export function WalletNotAvailableInRegion() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const isAdmin = useIsAdmin();
  const { navigate, push } = useSharedNavigationContext();

  const rightIcon = useMemo(
    () =>
      isAdmin ? (
        <IconButton
          size="32"
          onPress={() => {
            navigate({ path: 'DebugEmbeddedWallet' });
          }}
          Icon={(props) => <Bug {...props} />}
          variant="tertiary"
        />
      ) : undefined,
    [isAdmin, navigate],
  );

  const { supportedFeatures } = useWalletFeatures();
  const { walletExport } = supportedFeatures;

  const exportWallet = React.useMemo(() => {
    if (!walletExport) {
      return null;
    }
    return (
      <>
        <Text2 align="center" color="secondary">
          You can export your wallet key to use it elsewhere or back it up.
        </Text2>
        <ButtonV2
          variant="secondary"
          title="Export Wallet"
          onPress={() => push({ path: 'RecoverWalletAccount' })}
        />
      </>
    );
  }, [walletExport, push]);

  return (
    <View style={[t.flex1, t.pX3, { paddingBottom: insets.bottom }]}>
      <View style={[t.flexRow, t.justifyEnd]}>{rightIcon}</View>
      <View style={[t.flex1, t.pT6]}>
        <View
          style={[{ height: 414, gap: 12 }, t.itemsCenter, t.justifyCenter]}
        >
          <CircleIconBadge
            variant="warn"
            size="64"
            Icon={(props) => <EarthLock {...props} />}
          />
          <Text2 weight="semibold" size="2xl">
            Unsupported Region
          </Text2>
          {exportWallet}
        </View>
      </View>
    </View>
  );
}
