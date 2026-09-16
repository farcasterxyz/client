import { MaterialIcons, Octicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { View } from 'react-native';

import { OrderedListItem } from '~/components/OrderedListItem';
import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { UnauthedStackParamList } from '~/types';

type OnboardingImportWalletHelpScreenProps = NativeStackScreenProps<
  UnauthedStackParamList,
  'OnboardingImportWalletHelp'
>;

const OnboardingImportWalletHelpScreen =
  buildScreen<OnboardingImportWalletHelpScreenProps>(
    { name: 'OnboardingImportWalletHelp' },
    () => {
      const t = useTheme();

      return (
        <View style={[t.hFull, t.pX4]}>
          <View style={[t.flexRow, t.mB4, t.itemsCenter]}>
            <MaterialIcons
              name="phone-iphone"
              size={20}
              style={[t.texts.primary, t.mR1]}
            />
            <Text style={[t.texts.primary, t.textXl, t.fontSemibold]}>
              Mobile
            </Text>
          </View>
          <View style={[t.mL1]}>
            <OrderedListItem
              index={0}
              text="Open Farcaster on your other device"
            />
            <OrderedListItem
              index={1}
              text={
                <Text>Tap your avatar on top right to open the sidebar</Text>
              }
            />
            <OrderedListItem
              index={2}
              text={
                <Text>
                  Tap the gear icon{' '}
                  <Octicons name="gear" size={16} style={[t.texts.primary]} />{' '}
                  to go to <Text style={[t.fontBold]}>Settings</Text>
                </Text>
              }
            />
            <OrderedListItem
              index={3}
              text={
                <Text>
                  Tap{' '}
                  <Octicons name="gear" size={16} style={[t.texts.primary]} />{' '}
                  <Text style={[t.fontBold]}>Advanced</Text>
                </Text>
              }
            />
            <OrderedListItem
              index={4}
              text={
                <Text>
                  Tap <Text style={t.fontBold}>Reveal recovery phrase</Text>
                </Text>
              }
            />
          </View>
        </View>
      );
    },
  );

OnboardingImportWalletHelpScreen.displayName =
  'OnboardingImportWalletHelpScreen';

export { OnboardingImportWalletHelpScreen };
