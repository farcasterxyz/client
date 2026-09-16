import bs58 from 'bs58';
import { useSetUserPreferences } from 'farcaster-client-hooks';
import React, { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';
import nacl from 'tweetnacl';
import { signMessage } from 'viem/actions';
import { base } from 'viem/chains';

import { useEmbeddedWallet, useTheme } from '../../contexts';
import { useWalletFidOverride } from '../../hooks/useWalletPreferences';
import { copyText } from '../../utils';
import {
  ButtonV2,
  Divider,
  FullScreenLoadingIndicator,
  Text2,
  Textarea,
} from '../design-system';

export function WalletDebug() {
  const t = useTheme();
  const { isInitializing } = useEmbeddedWallet();

  const [walletFidOverride, setWalletFidOverride] = useWalletFidOverride();
  const [walletFidValue, setWalletFidValue] = useState<string>(
    walletFidOverride?.toString() ?? '',
  );

  if (isInitializing) {
    return <FullScreenLoadingIndicator />;
  }

  return (
    <ScrollView contentContainerStyle={[t.p3, { gap: 16 }]}>
      <WalletDebugEvm />
      <Divider marginVertical="none" />
      <WalletDebugSolana />
      <Divider marginVertical="none" />
      <View style={{ gap: 8 }}>
        <Text2 color="secondary" size="lg" weight="semibold">
          Wallet FID override
        </Text2>
        <View style={[t.mT1, { gap: 12 }]}>
          <Textarea
            containerStyle={[t.flexGrow]}
            inputStyle={[t.textBase, t.p2]}
            autoCapitalize="none"
            numberOfLines={1}
            spellCheck={false}
            value={walletFidValue}
            onChangeText={setWalletFidValue}
          />
          <View style={[t.flexRow, { gap: 12 }]}>
            <ButtonV2
              title="Reset"
              variant="secondary"
              onPress={() => {
                setWalletFidValue('');
                setWalletFidOverride(undefined);
              }}
              width="flex1"
            />
            <ButtonV2
              title="Save"
              variant="primary"
              onPress={() => {
                if (walletFidValue) {
                  setWalletFidOverride(walletFidValue);
                } else {
                  setWalletFidOverride(undefined);
                }
              }}
              width="flex1"
            />
          </View>
        </View>
      </View>
      <View style={{ gap: 8 }}>
        <Text2 color="secondary" size="lg" weight="semibold">
          Reset Banners
        </Text2>
        <View style={[t.mT1, { gap: 12 }]}>
          <WalletDebugBanners />
        </View>
      </View>
    </ScrollView>
  );
}

function WalletDebugEvm() {
  const { evmAddress, isConnected, getWalletClient } = useEmbeddedWallet();
  const toast = useToast();

  const signTestMessage = useCallback(async () => {
    if (!isConnected) {
      return;
    }

    const client = await getWalletClient(base);
    const result = await signMessage(client, {
      message: 'Hello, world!',
    });

    toast.show(`Signed message: ${result}`, {
      placement: 'top',
      type: 'success',
    });
  }, [isConnected, getWalletClient, toast]);

  const copyAddress = useCallback(async () => {
    if (!isConnected) {
      return;
    }

    await copyText(evmAddress);
    toast.show('Copied address to clipboard.', { placement: 'top' });
  }, [isConnected, evmAddress, toast]);

  return (
    <>
      <View style={{ gap: 8 }}>
        <Text2 color="secondary" size="lg" weight="semibold">
          EVM Wallet
        </Text2>
        <View>
          <Text2 color="secondary" size="sm" weight="medium">
            Address
          </Text2>
          <Text2 size="sm">{evmAddress}</Text2>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <ButtonV2 onPress={copyAddress} title="Copy address" width="flex1" />
        <ButtonV2
          onPress={signTestMessage}
          title="Sign message"
          width="flex1"
        />
      </View>
    </>
  );
}

function WalletDebugSolana() {
  const { solanaAddress, isConnected, solanaWalletProvider } =
    useEmbeddedWallet();
  const toast = useToast();

  const signTestMessage = useCallback(async () => {
    if (!isConnected || !solanaAddress) {
      return;
    }

    const message = new TextEncoder().encode('Hello, world!');
    const result = await solanaWalletProvider.request({
      method: 'signMessage',
      params: { message: Buffer.from(message).toString('base64') },
    });

    const isValid = nacl.sign.detached.verify(
      message,
      Uint8Array.from(atob(result.signature), (c) => c.charCodeAt(0)),
      bs58.decode(solanaAddress),
    );

    toast.show(
      `Signed message: ${result.signature}\nSignature valid: ${isValid}`,
      { placement: 'top', type: isValid ? 'success' : 'danger' },
    );
    await copyText(result.signature);
  }, [isConnected, solanaWalletProvider, toast, solanaAddress]);

  const copyAddress = useCallback(async () => {
    if (!isConnected || !solanaAddress) {
      return;
    }

    await copyText(solanaAddress);
    toast.show('Copied address to clipboard.', { placement: 'top' });
  }, [isConnected, solanaAddress, toast]);

  return (
    <>
      <View style={{ gap: 8 }}>
        <Text2 color="secondary" size="lg" weight="semibold">
          Solana Wallet
        </Text2>
        <View>
          <Text2 color="secondary" size="sm" weight="medium">
            Address
          </Text2>
          <Text2 size="sm">{solanaAddress}</Text2>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <ButtonV2 onPress={copyAddress} title="Copy address" width="flex1" />
        <ButtonV2
          onPress={signTestMessage}
          title="Sign message"
          width="flex1"
        />
      </View>
    </>
  );
}

function WalletDebugBanners() {
  const setUserPreference = useSetUserPreferences();

  const resetBanners = React.useCallback(async () => {
    await setUserPreference({
      preferences: {
        showDepositBonusesIntro: true,
      },
    });
    await setUserPreference({
      preferences: {
        showReferralIntro: true,
      },
    });
    await setUserPreference({
      preferences: {
        showTokenNotificationsIntro: true,
      },
    });
  }, [setUserPreference]);

  return <ButtonV2 title="Reset banners" onPress={resetBanners} />;
}
