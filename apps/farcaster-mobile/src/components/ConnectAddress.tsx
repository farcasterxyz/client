import { useSendConnectAddressLinkEmail } from 'farcaster-client-hooks';
import { AtomsButton } from 'farcaster-expo';
import React, { FC, memo, useCallback, useMemo, useState } from 'react';
import { Image, Linking, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ConnectAddressAssetsUri from '~/assets/images/ConnectAddressAssets.webp';
import { useTheme } from '~/contexts/ThemeProvider';
import { useComposeVerificationUrl } from '~/hooks/useComposeVerificationUrl';

import { Text } from './Text';

type ConnectAddressProps = {
  onConnectPressAfterNavigate: () => void;
  onSkipPress: () => void;
  loadingStateAfterConnectClick?: boolean;
  skipButtonTextOverride?: string;
};

const ConnectAddress: FC<ConnectAddressProps> = memo(
  ({
    onConnectPressAfterNavigate,
    onSkipPress,
    loadingStateAfterConnectClick = false,
    skipButtonTextOverride,
  }) => {
    const [connectingAddress, setConnectingAddress] = useState<boolean>(false);

    const t = useTheme();
    const { bottom } = useSafeAreaInsets();

    const composeVerificationUrl = useComposeVerificationUrl();
    const sendConnectAddressLinkEmail = useSendConnectAddressLinkEmail();

    const onConnectPress = useCallback(async () => {
      setConnectingAddress(loadingStateAfterConnectClick);

      const url = await composeVerificationUrl();

      Linking.openURL(url);

      onConnectPressAfterNavigate();
    }, [
      composeVerificationUrl,
      loadingStateAfterConnectClick,
      onConnectPressAfterNavigate,
    ]);

    const onSkipPressBeforeCallback = useCallback(async () => {
      await sendConnectAddressLinkEmail();
      onSkipPress();
    }, [onSkipPress, sendConnectAddressLinkEmail]);

    const skipButtonText = useMemo(() => {
      return skipButtonTextOverride || 'Skip for now';
    }, [skipButtonTextOverride]);

    return (
      <View style={[t.hFull, t.wFull, { paddingBottom: bottom }]}>
        <View
          style={[
            t.flex,
            t.flexCol,
            t.itemsCenter,
            t.justifyStart,
            t.flexGrow,
            t.mT18,
            t.mX4,
          ]}
        >
          <Image
            source={ConnectAddressAssetsUri}
            style={[t.wFull]}
            resizeMode={'contain'}
          />
          <Text style={[t.texts.primary, t.textBase, t.textCenter, t.mY6]}>
            Connect an Ethereum or Solana account to your Farcaster profile.
          </Text>
          <Text style={[t.texts.primary, t.textBase, t.textCenter, t.mB10]}>
            No onchain transaction needed.
          </Text>
        </View>
        <View style={[t.flex, t.flexCol, t.mX4]}>
          <AtomsButton
            hierarchy="primary"
            size="l"
            style={t.wFull}
            onPress={onConnectPress}
            loading={connectingAddress}
          >
            Connect
          </AtomsButton>
          <AtomsButton
            hierarchy="secondary"
            size="l"
            style={[t.wFull, t.mY2]}
            onPress={onSkipPressBeforeCallback}
          >
            {skipButtonText}
          </AtomsButton>
        </View>
      </View>
    );
  },
);

export { ConnectAddress };
