import { Octicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { View } from 'react-native';

import { OrderedListItem } from '~/components/OrderedListItem';
import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { useOnboardingScreen } from '~/hooks/useOnboardingScreen';
import { UnauthedStackParamList } from '~/types';

type OnboardingSignInWithDesktopScreenProps = NativeStackScreenProps<
  UnauthedStackParamList,
  'OnboardingSignInWithDesktop'
>;

const title = 'Log in with desktop';

const OnboardingSignInWithDesktopScreen =
  buildScreen<OnboardingSignInWithDesktopScreenProps>(
    { name: 'OnboardingSignInWithDesktop' },
    () => {
      const t = useTheme();

      useOnboardingScreen({ title, noBackWarning: true });

      return (
        <View style={[t.hFull, t.p4]}>
          <View style={[t.mT4]}>
            <OrderedListItem index={0} text="Open Farcaster on your desktop" />
            <OrderedListItem
              index={1}
              text={
                <>
                  Click on <Text style={[t.fontBold]}>Settings</Text>{' '}
                  <Octicons name="gear" size={16} style={[t.texts.primary]} />{' '}
                  in the top left
                </>
              }
            />
            <OrderedListItem
              index={2}
              text={
                <>
                  On the <Text style={[t.fontBold]}>My Devices</Text> tab, click{' '}
                  <Text style={[t.fontBold]}>Add mobile device</Text>
                </>
              }
            />
            <OrderedListItem
              index={3}
              text={
                <>
                  On this device, open the{' '}
                  <Text style={[t.fontBold]}>Camera</Text> app and scan the QR
                  code on your desktop
                </>
              }
            />
          </View>
        </View>
      );
    },
  );

OnboardingSignInWithDesktopScreen.displayName =
  'OnboardingSignInWithDesktopScreen';

export { OnboardingSignInWithDesktopScreen };
