import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDisableTotp, useTotpEnabledQuery } from 'farcaster-client-hooks';
import { useRootToast } from 'farcaster-expo';
import React from 'react';
import { View } from 'react-native';

import { ButtonV2 } from '~/components/ButtonV2';
import { Divider } from '~/components/Divider';
import { buildScreen } from '~/components/Screen';
import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { useWallet } from '~/contexts/WalletProvider';
import { usePush } from '~/hooks/navigation/usePush';
import { CommonStackParamList } from '~/types';

type DebugSecureModeScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'DebugSecureMode'
>;

const DebugSecureModeScreen = buildScreen<DebugSecureModeScreenProps>(
  { name: 'DebugSecureMode' },
  () => {
    const t = useTheme();
    const push = usePush();
    const toast = useRootToast();
    const { data, isPending, isError, refetch } = useTotpEnabledQuery();
    const disableTotp = useDisableTotp();
    const { address, account } = useWallet();

    const handleEnable = () => {
      push('SecureModeSetup', {
        onComplete: () => {
          refetch();
        },
        source: 'debug-tool',
      });
    };

    const handleDisable = () => {
      disableTotp({
        account: account!,
      })
        .then(() => {
          toast.show('Advanced Protection disabled', {
            type: 'success',
          });
          refetch();
        })
        .catch(() => {
          toast.show('Failed to disable Advanced Protection', {
            type: 'danger',
          });
        });
    };

    const handleVerify = () => {
      push('SecureModeVerifyCode', {
        mode: 'verify',
        onSuccess: () => {
          toast.show('Code verified successfully', {
            type: 'success',
          });
        },
        onCancel: () => {
          toast.show('Verification cancelled', {
            type: 'info',
          });
        },
      });
    };

    if (isPending) {
      return (
        <View style={[t.hFull, t.justifyBetween, t.pY4, t.pX4]}>
          <Text2 style={[t.textLg]} align="center">
            Loading Advanced Protection status...
          </Text2>
        </View>
      );
    }

    if (isError) {
      return (
        <View style={[t.hFull, t.justifyBetween, t.pY4, t.pX4]}>
          <Text2 style={[t.textLg]} align="center">
            Error loading Advanced Protection status
          </Text2>
        </View>
      );
    }

    if (!data?.result.enabled) {
      return (
        <View style={[t.hFull, t.justifyBetween, t.pY4, t.pX4]}>
          <View>
            <Text2 style={[t.textLg, t.mB4]} align="center">
              Advanced Protection is currently disabled
            </Text2>
            <ButtonV2
              onPress={handleEnable}
              variant="primary"
              title="Enable Advanced Protection"
            />
          </View>
        </View>
      );
    }

    return (
      <View style={[t.hFull, t.pY4, t.pX4]}>
        <View style={{ gap: 24 }}>
          <View>
            <Text2 style={[t.textLg]} align="center">
              Advanced Protection is currently enabled
            </Text2>

            <View style={[t.mT4]}>
              <ButtonV2
                disabled={address === undefined}
                onPress={handleDisable}
                variant="destructive-outline"
                title="Disable Advanced Protection"
              />
            </View>
          </View>

          <Divider marginVertical="none" />

          <View style={{ gap: 12 }}>
            <Text2 color="secondary" size="base" weight="semibold">
              Verify Code
            </Text2>

            <ButtonV2
              onPress={handleVerify}
              variant="primary"
              title="Verify Code"
            />
          </View>
        </View>
      </View>
    );
  },
);

export { DebugSecureModeScreen };
