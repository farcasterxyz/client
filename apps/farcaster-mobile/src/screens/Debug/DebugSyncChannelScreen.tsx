import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFetchSyncChannel } from 'farcaster-client-hooks';
import { logError } from 'farcaster-cryptography';
import { AtomsButton } from 'farcaster-expo';
import React from 'react';
import { Alert, View } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { CommonStackParamList } from '~/types';

const base64PublicKey = 'eztuuz8ulbnasj7pza7i2q8kfyzycjjzb/82lzpbule=';
const base64Signature =
  '+j1fmsf3nmnks6pnf3v1ytmr+eccf6esmiojmac4h9zxiugo+7iw/ltztrfihysacndx5hhguyej+gq66oceag==';
const channelId = '0a9589ad-243c-4f26-9dab-3b571f6e4ac0';

type DebugStorageScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'DebugSyncChannel'
>;

const DebugSyncChannelScreen = buildScreen<DebugStorageScreenProps>(
  { name: 'DebugSyncChannel' },
  () => {
    const t = useTheme();

    const fetchSyncChannel = useFetchSyncChannel();

    return (
      <View style={[t.hFull, t.p4, t.justifyBetween]}>
        <View>
          <View style={[t.mB2]}>
            <Text style={[t.texts.primary, t.fontMono, t.fontBold]}>
              base64PublicKey
            </Text>
            <Text style={[t.texts.primary, t.fontMono]} selectable>
              {base64PublicKey}
            </Text>
          </View>
          <View style={[t.mB2]}>
            <Text style={[t.texts.primary, t.fontMono, t.fontBold]}>
              base64Signature
            </Text>
            <Text style={[t.texts.primary, t.fontMono]} selectable>
              {base64Signature}
            </Text>
          </View>
          <View style={[t.mB2]}>
            <Text style={[t.texts.primary, t.fontMono, t.fontBold]}>
              channelId
            </Text>
            <Text style={[t.texts.primary, t.fontMono]} selectable>
              {channelId}
            </Text>
          </View>
        </View>
        <View>
          <AtomsButton
            style={[t.mB2]}
            size="l"
            hierarchy="primary"
            onPress={async () => {
              try {
                const response = await fetchSyncChannel({
                  base64PublicKey,
                  base64Signature,
                  channelId,
                });

                Alert.alert(JSON.stringify(response, null, 2));
              } catch (error) {
                logError(error as Error);
                Alert.alert(
                  `Error fetching channel: ${(error as Error)?.message}`,
                );
              }
            }}
          >
            Fetch channel
          </AtomsButton>
        </View>
      </View>
    );
  },
);

DebugSyncChannelScreen.displayName = 'DebugSyncChannelScreen';

export { DebugSyncChannelScreen };
