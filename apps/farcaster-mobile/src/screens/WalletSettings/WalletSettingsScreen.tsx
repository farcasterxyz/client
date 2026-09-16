import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { hitSlop, useIsAdmin, WalletScreenHeader } from 'farcaster-expo';
import { Bug } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { useTheme } from '~/contexts/ThemeProvider';
import { useGoBack } from '~/hooks/navigation/useGoBack';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { CommonStackParamList } from '~/types';

import { WalletBiometricAuthLargeTransactionsSection } from './WalletBiometricAuthLargeTransactionsSection';

type WalletSettingsScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'WalletSettings'
>;

const WalletSettingsScreen = buildScreen<WalletSettingsScreenProps>(
  { name: 'WalletSettings', insetTop: true, themeV2: true },
  () => {
    const t = useTheme();
    const navigate = useNavigate();
    const isAdmin = useIsAdmin();
    const goBack = useGoBack();

    const rightIcon = useMemo(() => {
      if (!isAdmin) {
        return;
      }

      return (
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => {
            navigate('DebugEmbeddedWallet', {});
          }}
          hitSlop={hitSlop}
        >
          <Bug size={20} style={t.texts.primary} />
        </TouchableOpacity>
      );
    }, [isAdmin, navigate, t.texts.primary]);

    return (
      <View>
        <WalletScreenHeader
          title="Wallet Settings"
          onBackCallback={goBack}
          rightIcon={rightIcon}
        />
        <ScrollView style={[t.hFull]} contentContainerStyle={[t.mB4, t.pT4]}>
          <WalletBiometricAuthLargeTransactionsSection />
        </ScrollView>
      </View>
    );
  },
);

WalletSettingsScreen.displayName = 'WalletSettingsScreen';

export { WalletSettingsScreen };
