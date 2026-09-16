import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { View } from 'react-native';

import { PreferredWalletButtonGroup } from '~/components/PreferredWalletButtonGroup';
import { buildScreen } from '~/components/Screen';
import { Text2 } from '~/components/Text';
import { useSelectPreferredWallet } from '~/contexts/SelectPreferredWalletProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { CommonStackParamList } from '~/types';

type PreferredWalletScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'PreferredWallet'
>;

const PreferredWalletScreen = buildScreen<PreferredWalletScreenProps>(
  { name: 'PreferredWallet' },
  () => {
    const t = useTheme();
    const { setPreferredWallet, preferredWalletType: preferredWallet } =
      useSelectPreferredWallet();

    return (
      <View style={[t.hFull, t.p4]}>
        <View style={[t.hFull]}>
          <Text2 style={[t.texts.tertiary]}>
            We'll use this wallet whenever you start an onchain transaction from
            Farcaster.
          </Text2>
          <View style={[t.mT4]}>
            <PreferredWalletButtonGroup
              preferredWallet={preferredWallet}
              onSelect={setPreferredWallet}
            />
          </View>
        </View>
      </View>
    );
  },
);

PreferredWalletScreen.displayName = 'PreferredWalletScreen';

export { PreferredWalletScreen };
