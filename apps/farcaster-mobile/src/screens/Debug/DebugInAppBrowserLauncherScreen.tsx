import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AtomsButton } from 'farcaster-expo';
import React, { useState } from 'react';
import { View } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { TextInput } from '~/components/TextInput/TextInput';
import { useTheme } from '~/contexts/ThemeProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { CommonStackParamList } from '~/types';
import { isValidHttpsUrl } from '~/utils/DeepLinkUtils';

type DebugInAppBrowserLauncherScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'DebugInAppBrowserLauncher'
>;

const PRESET_URLS: ReadonlyArray<{ label: string; url: string }> = [
  { label: 'Uniswap', url: 'https://app.uniswap.org' },
  { label: 'OpenSea', url: 'https://opensea.io' },
  { label: 'Aerodrome', url: 'https://aerodrome.finance' },
  { label: 'Morpho', url: 'https://app.morpho.org' },
];

const DEFAULT_URL = 'https://app.uniswap.org';

const DebugInAppBrowserLauncherScreen =
  buildScreen<DebugInAppBrowserLauncherScreenProps>(
    { name: 'DebugInAppBrowserLauncher' },
    () => {
      const t = useTheme();
      const navigate = useNavigate();
      const [url, setUrl] = useState<string>(DEFAULT_URL);
      const [error, setError] = useState<string | undefined>(undefined);

      const launch = () => {
        const trimmed = url.trim();
        if (!isValidHttpsUrl(trimmed)) {
          setError('URL must be a parseable https:// URL');
          return;
        }
        setError(undefined);
        navigate('InAppBrowser', { url: trimmed, source: 'debug-menu' });
      };

      return (
        <View style={[t.hFull, t.pX4, t.pT4]}>
          <TextInput
            onChangeText={(next) => {
              setUrl(next);
              if (error) {
                setError(undefined);
              }
            }}
            value={url}
            placeholder="https://..."
            autoCapitalize="none"
            autoCorrect={false}
          />
          {error ? (
            <Text style={[t.texts.danger, t.textSm, t.mT2]}>{error}</Text>
          ) : null}
          <AtomsButton size="l" style={[t.mT2]} onPress={launch}>
            Open
          </AtomsButton>

          <Text
            style={[t.texts.primary, t.textSm, t.fontSemibold, t.mT4, t.mB2]}
          >
            Quick-fill
          </Text>
          <View style={[t.flexRow, t.flexWrap, { gap: 8 }]}>
            {PRESET_URLS.map(({ label, url: presetUrl }) => (
              <AtomsButton
                key={presetUrl}
                size="s"
                onPress={() => {
                  setUrl(presetUrl);
                  setError(undefined);
                }}
              >
                {label}
              </AtomsButton>
            ))}
          </View>
        </View>
      );
    },
  );

DebugInAppBrowserLauncherScreen.displayName = 'DebugInAppBrowserLauncherScreen';

export { DebugInAppBrowserLauncherScreen };
