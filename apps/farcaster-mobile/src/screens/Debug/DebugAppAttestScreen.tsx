import * as AppIntegrity from '@expo/app-integrity';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ButtonV2, CopyIconButton, Text2 } from 'farcaster-expo';
import React, { useState } from 'react';
import { Platform, View } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { GOOGLE_CLOUD_PROJECT_NUMBER } from '~/constants/GooglePlay';
import { useTheme } from '~/contexts/ThemeProvider';
import * as DeviceCheck from '~/modules';
import { CommonStackParamList } from '~/types';
import { createUUID } from '~/utils/UUIDUtils';

type DebugAppAttestScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'DebugAppAttest'
>;

const DebugAppAttestScreen = buildScreen<DebugAppAttestScreenProps>(
  { name: 'DebugAppAttest', insetBottom: true },
  () => {
    const t = useTheme();

    return (
      <View style={[t.pX4, t.gap10]}>
        <DebugDeviceCheck />
        <DebugIntegrity />
      </View>
    );
  },
);

function DebugDeviceCheck() {
  const t = useTheme();
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [token, setToken] = useState<string>();
  const [generateError, setGenerateError] = useState<string>();

  const handleGenerateToken = async () => {
    setIsGeneratingToken(true);
    setGenerateError(undefined);
    try {
      const result = await DeviceCheck.generateToken();
      setToken(result);
    } catch (error) {
      const errorMessage = `Failed to generate token: ${error}`;
      setGenerateError(errorMessage);
    } finally {
      setIsGeneratingToken(false);
    }
  };

  return (
    <View>
      <View style={{ marginBottom: 24, gap: 8 }}>
        <Text2 color="secondary" size="xl">
          DeviceCheck
        </Text2>
      </View>
      <View style={{ marginBottom: 24, gap: 8 }}>
        <Text2 size="sm" color="secondary" weight="semibold">
          Supported
        </Text2>
        <Text2>{DeviceCheck.isSupported ? '✅' : '❌'}</Text2>
      </View>

      {generateError && (
        <View style={{ marginBottom: 24 }}>
          <Text2 size="lg" weight="semibold" style={{ marginBottom: 8 }}>
            Error
          </Text2>
          <Text2 color="danger" size="base">
            {generateError}
          </Text2>
        </View>
      )}

      {token && (
        <View style={{ marginBottom: 24 }}>
          <View style={[t.flexRow, { gap: 10 }, t.itemsCenter]}>
            <Text2 color="secondary" style={{ marginBottom: 8 }}>
              Token:
            </Text2>
            <CopyIconButton variant="secondary" text={token} size="36" />
          </View>
          <Text2 size="xs">{token}</Text2>
        </View>
      )}

      <View>
        <ButtonV2
          title="Generate Token"
          onPress={handleGenerateToken}
          width="full"
          loading={isGeneratingToken}
          disabled={DeviceCheck.isSupported === false}
        />
      </View>
    </View>
  );
}

function DebugIntegrity() {
  const t = useTheme();
  const [result, setResult] = useState<string>();
  const [error, setError] = useState<string>();

  const debugIntegrityCheck = async () => {
    try {
      setError(undefined);
      setResult(undefined);

      if (Platform.OS === 'android') {
        await AppIntegrity.prepareIntegrityTokenProviderAsync(
          GOOGLE_CLOUD_PROJECT_NUMBER,
        );
        setResult(await AppIntegrity.requestIntegrityCheckAsync(createUUID()));
      } else {
        setError('iOS debug not implemented');
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <View>
      <View style={{ marginBottom: 24, gap: 8 }}>
        <Text2 color="secondary" size="xl">
          App Integrity
        </Text2>
      </View>
      <View style={{ marginBottom: 24, gap: 8 }}>
        <Text2 size="sm" color="secondary" weight="semibold">
          Supported
        </Text2>
        <Text2>{AppIntegrity.isSupported ? '✅' : '❌'}</Text2>
      </View>

      {error && (
        <View style={{ marginBottom: 24 }}>
          <Text2 size="sm" color="secondary" weight="semibold">
            Error
          </Text2>
          <Text2 color="danger" size="base">
            {error}
          </Text2>
        </View>
      )}

      {result && (
        <View style={{ marginBottom: 24 }}>
          <View style={[t.flexRow, { gap: 10 }, t.itemsCenter]}>
            <Text2 color="secondary" style={{ marginBottom: 8 }}>
              Result:
            </Text2>
            <CopyIconButton variant="secondary" text={result} size="36" />
          </View>
          <Text2 size="xs">{result}</Text2>
        </View>
      )}

      <View>
        <ButtonV2
          title="Generate Token"
          onPress={debugIntegrityCheck}
          width="full"
          disabled={AppIntegrity.isSupported === false}
        />
      </View>
    </View>
  );
}

export { DebugAppAttestScreen };
