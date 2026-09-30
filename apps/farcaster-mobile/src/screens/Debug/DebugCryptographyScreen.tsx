import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import * as Clipboard from 'expo-clipboard';
import { wipeKeystore } from 'farcaster-cryptography';
import { AtomsButton } from 'farcaster-expo';
import moment from 'moment';
import React, { FC, memo, useState } from 'react';
import { View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { useDebugCryptography } from '~/contexts/DebugCryptographyProvider';
import { useFarcasterCryptographyKeyStore } from '~/contexts/FarcasterCryptographyKeyStoreProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { CommonStackParamList } from '~/types';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';

type DebugCryptographyScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'DebugCryptography'
>;

const DebugCryptographyScreen = buildScreen<DebugCryptographyScreenProps>(
  { name: 'DebugCryptography' },
  () => {
    const t = useTheme();
    const { getCryptographyLogs } = useDebugCryptography();
    const toast = useToast();
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    const { keyStore } = useFarcasterCryptographyKeyStore();

    const wipe = async () => {
      await wipeKeystore({
        keyStore,
      });
    };

    return (
      <View style={[t.hFull, t.justifyBetween]}>
        <FlashList
          data={getCryptographyLogs()}
          keyExtractor={(item) => String(item.id)}
          {...STANDARD_FLASHLIST_PERF_PROPS}
          renderItem={({ item }) => <CryptographyLog {...item} />}
        />
        <View style={[t.p4]}>
          <AtomsButton
            size="l"
            style={[t.mB2]}
            onPress={() => {
              Clipboard.setStringAsync(
                JSON.stringify(getCryptographyLogs(), null, 2),
              );
              toast.show('Copied to clipboard', { placement: 'top' });
            }}
          >
            Copy to clipboard
          </AtomsButton>
          <AtomsButton
            size="l"
            onPress={() => {
              setIsDeleting(true);
              wipe().then(() => {
                setIsDeleting(false);
              });
            }}
            loading={isDeleting}
          >
            Delete all Direct Cast data
          </AtomsButton>
        </View>
      </View>
    );
  },
);

DebugCryptographyScreen.displayName = 'DebugCryptographyScreen';

type CryptographyLogProps = {
  message: string;
  timestamp: number;
};

const CryptographyLog: FC<CryptographyLogProps> = memo(
  ({ message, timestamp }) => {
    const t = useTheme();

    return (
      <View style={[t.p4, t.borderB, t.borderDefault, t.flex, t.flexCol]}>
        <Text style={[t.texts.secondary]}>{moment(timestamp).format()}</Text>
        <Text style={[t.texts.primary]}>{message}</Text>
      </View>
    );
  },
);

export { DebugCryptographyScreen };
