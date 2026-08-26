import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { AtomsButton } from 'farcaster-expo';
import React from 'react';
import { ScrollView } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { buildScreen } from '~/components/Screen';
import { useTheme } from '~/contexts/ThemeProvider';
import { CommonStackParamList } from '~/types';

type DebugImagesScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'DebugImages'
>;

const DebugImagesScreen = buildScreen<DebugImagesScreenProps>(
  { name: 'DebugImages' },
  () => {
    const t = useTheme();
    const toast = useToast();

    return (
      <ScrollView
        keyboardShouldPersistTaps="always"
        contentContainerStyle={[t.hFull, t.p4, t.justifyEnd]}
      >
        <AtomsButton
          size="l"
          style={[t.mB4]}
          onPress={() => {
            Image.clearMemoryCache().then(() => {
              toast.show('Cleared memory disk cache', { placement: 'top' });
            });
          }}
        >
          Clear Image Memory Cache
        </AtomsButton>
        <AtomsButton
          size="l"
          style={[t.mB4]}
          onPress={() => {
            Image.clearDiskCache().then(() => {
              toast.show('Cleared image disk cache', { placement: 'top' });
            });
          }}
        >
          Clear Image Disk Cache
        </AtomsButton>
      </ScrollView>
    );
  },
);

DebugImagesScreen.displayName = 'DebugImagesScreen';

export { DebugImagesScreen };
