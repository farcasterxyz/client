import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { formatEthAddress } from 'farcaster-client-data';
import { useSetUserPreferences } from 'farcaster-client-hooks';
import { AtomsButton, ButtonV2 } from 'farcaster-expo';
import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useMMKVString } from 'react-native-mmkv';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from 'react-native-toast-notifications';

import { buildScreen } from '~/components/Screen';
import { Text, Text2 } from '~/components/Text';
import { useConnectedWallet } from '~/contexts/ConnectWalletProvider';
import { useSelectPreferredWallet } from '~/contexts/SelectPreferredWalletProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useIsAdmin } from '~/hooks/data/useIsAdmin';
import { CommonStackParamList } from '~/types';
import { logInDevOnly } from '~/utils/LogUtils';

type DebugConnectWalletScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'DebugConnectWallet'
>;

const DebugConnectWalletScreen = buildScreen<DebugConnectWalletScreenProps>(
  { name: 'DebugConnectWallet' },
  () => {
    const isAdmin = useIsAdmin();

    if (!isAdmin) {
      return <></>;
    }

    return <DebugConnectWalletScreenContent />;
  },
);

const SelectUnsupportedWallet = ({
  value,
  setPreferredWallet,
}: {
  value: string | undefined;
  setPreferredWallet: (value: string | undefined) => void;
}) => {
  return (
    <View>
      <ButtonV2
        title={`Select ${value ?? 'none'}`}
        onPress={() => {
          setPreferredWallet(value);
        }}
      />
    </View>
  );
};

const DebugConnectWalletScreenContent: React.FC = () => {
  const t = useTheme();
  const { bottom } = useSafeAreaInsets();
  const { bottom: bottom2 } = useSafeAreaInsets();
  const [raw, setRaw] = useMMKVString('preferredWallet');

  return (
    <ScrollView style={[t.pX4, t.pT3, { paddingBottom: bottom }]}>
      <Text2 weight="semibold" style={[t.mB2]}>
        Connect Wallet
      </Text2>
      <ConnectWallet />
      <ResetButtons />
      <View style={[t.flex, { gap: 8 }, { paddingBottom: bottom2 }]}>
        <View style={[t.flex, t.flexRow, t.itemsCenter, t.justifyBetween]}>
          <Text2 weight="semibold">Set unsupported wallet</Text2>
          <Text2 color="brand">{raw ?? 'none'}</Text2>
        </View>
        <SelectUnsupportedWallet value="coinbase" setPreferredWallet={setRaw} />
        <SelectUnsupportedWallet value="rainbow" setPreferredWallet={setRaw} />
        <SelectUnsupportedWallet
          value={undefined}
          setPreferredWallet={setRaw}
        />
      </View>
    </ScrollView>
  );
};

function ConnectWallet() {
  const { selectPreferredWallet } = useSelectPreferredWallet();

  return (
    <View>
      <AtomsButton
        size="l"
        hierarchy="primary"
        onPress={() => {
          selectPreferredWallet();
        }}
      >
        Choose Preferred Wallet
      </AtomsButton>
      <WalletInfo />
    </View>
  );
}

function ResetButtons() {
  const t = useTheme();
  const toast = useToast();
  const setUserPreferences = useSetUserPreferences();
  const { setPreferredWallet } = useSelectPreferredWallet();
  const { wallet } = useConnectedWallet();

  const clearWalletState = useCallback(async () => {
    await setUserPreferences({
      preferences: { ackFrameTransactionRisks: false },
    });
    if (wallet) {
      wallet.disconnect();
    }
    toast.show('Cleared wallet state');
  }, [wallet, setUserPreferences, toast]);

  const resetPreferredWallet = useCallback(async () => {
    setPreferredWallet(undefined);
    toast.show('Cleared. Restart to choose wallet.');
  }, [setPreferredWallet, toast]);

  return (
    <View style={[t.mB8]}>
      <Text2 weight="semibold" style={[t.mT6, t.mB2]}>
        Frame transactions
      </Text2>
      <AtomsButton
        size="l"
        hierarchy="overlay"
        onPress={() =>
          setUserPreferences({
            preferences: { ackFrameTransactionRisks: false },
          }).then(() => toast.show('Successfully reset'))
        }
        style={[t.mB2]}
      >
        Reset frame transactions risk ack
      </AtomsButton>
      <AtomsButton
        onPress={clearWalletState}
        size="l"
        hierarchy="overlay"
        style={[t.mB2]}
      >
        Clear all wallet state
      </AtomsButton>

      <AtomsButton onPress={resetPreferredWallet} size="l" hierarchy="overlay">
        Clear preferred wallet
      </AtomsButton>
    </View>
  );
}

function WalletInfo() {
  const t = useTheme();
  const { wallet } = useConnectedWallet();
  const [success, setSuccess] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  const { disconnect, sendTransaction, signTypedDataV4 } = wallet;

  const send = useCallback(async () => {
    if (!sendTransaction) {
      throw new Error('sendTransaction not supported');
    }

    try {
      const result = await sendTransaction({
        toAddress: '0x000000000000000000000000000000000000dEaD',
        data: '0x',
        weiValue: '1111111',
        chainId: '8453',
        actionSource: {
          url: 'https://farcaster.xyz/~/settings/debug-connect-wallet',
        },
      });

      logInDevOnly(result);

      if (result === 'wallet-not-installed') {
        return;
      }

      if (result.success) {
        setSuccess(`tx hash ${result.transactionHash}`);
      } else {
        setError(result.errorReason);
      }
    } catch (e) {
      logInDevOnly(e);
      setError('unknown');
    }
  }, [sendTransaction]);

  const sign = useCallback(async () => {
    if (!signTypedDataV4) {
      throw new Error('signTypedDataV4 not supported');
    }

    try {
      const result = await signTypedDataV4(1, {
        domain: {
          name: 'Ether Mail',
          version: '1',
          chainId: 1,
          verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
        },
        types: {
          Person: [
            { name: 'name', type: 'string' },
            { name: 'wallet', type: 'address' },
          ],
          Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person' },
            { name: 'contents', type: 'string' },
          ],
        },
        primaryType: 'Mail',
        message: {
          from: {
            name: 'Cow',
            wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
          },
          to: {
            name: 'Bob',
            wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
          },
          contents: 'Hello, Bob!',
        },
      });

      logInDevOnly(result);
      if (result === 'wallet-not-installed') {
        return;
      }

      if (result.success) {
        setSuccess(`sig ${result.signature}`);
      } else {
        setError(result.errorReason);
      }
    } catch (e) {
      logInDevOnly(e);
      setError('unknown');
    }
  }, [signTypedDataV4]);

  const walletPreference = useMemo(() => {
    if (!wallet) {
      return null;
    }

    let name;
    if (!wallet.type) {
      return 'No preference saved';
    } else if (wallet.type === 'coinbase') {
      name = 'Coinbase Wallet';
    } else if (wallet.type === 'rainbow') {
      name = 'Rainbow';
    } else if (wallet.type === 'warpcast') {
      name = 'Farcaster';
    }
    if (name !== wallet.name) {
      name += ' (restart required)';
    }
    return name;
  }, [wallet]);

  if (!wallet?.isInitialized) {
    return null;
  }

  return (
    <>
      <View style={[t.mT4]}>
        <Text2 color="secondary" size="sm" style={[t.mB1]}>
          Preferred Wallet
        </Text2>
        <Text2>{walletPreference}</Text2>
        <Text2 color="secondary" size="sm" style={[t.mT3, t.mB1]}>
          Configured Wallet
        </Text2>
        <Text2>{wallet.name}</Text2>
        <Text2 color="secondary" size="sm" style={[t.mT3, t.mB1]}>
          Address
        </Text2>
        <Text2>
          {wallet.address ? formatEthAddress(wallet.address!) : undefined}
        </Text2>
      </View>
      <View style={[t.mT4]}>
        <AtomsButton
          onPress={send}
          size="l"
          hierarchy="overlay"
          style={[t.mB2]}
        >
          Send transaction
        </AtomsButton>
        <AtomsButton
          onPress={sign}
          size="l"
          hierarchy="overlay"
          style={[t.mB2]}
        >
          Sign typed data
        </AtomsButton>
        {error && (
          <Text style={[t.texts.danger, t.textBase]}>Error: {error}</Text>
        )}
        {success && (
          <Text style={[t.texts.success, t.textBase]}>Success: {success}</Text>
        )}
        {wallet.address && (
          <AtomsButton
            size="l"
            hierarchy="danger"
            style={[t.mY2]}
            onPress={() => disconnect?.()}
          >
            Disconnect
          </AtomsButton>
        )}
      </View>
    </>
  );
}

DebugConnectWalletScreen.displayName = 'DebugWalletConnectScreen';

export { DebugConnectWalletScreen };
