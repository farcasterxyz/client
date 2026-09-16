import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { Linking, View } from 'react-native';

import { ButtonGroup, ButtonGroupOption } from '~/components/ButtonGroup';
import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { TextWithPress } from '~/components/TextWithPress';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';
import { CommonStackParamList } from '~/types';

type MyDevicesScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'MyDevices'
>;

const MyDevicesScreen = buildScreen<MyDevicesScreenProps>(
  { name: 'MyDevices' },
  () => {
    const t = useTheme();
    const push = usePush();

    const options: ButtonGroupOption[] = useMemo(
      () => [
        {
          icon: ({ size }) => (
            <MaterialIcons
              name="desktop-mac"
              size={size}
              style={[t.texts.primary]}
            />
          ),
          label: 'Pair with desktop',
          onPress: () => {
            push('MyDevicesAddADesktopDevice', {});
          },
        },
        {
          icon: ({ size }) => (
            <MaterialIcons
              name="phone-iphone"
              size={size}
              style={[t.texts.primary]}
            />
          ),
          label: 'Pair with mobile',
          onPress: () => {
            push('MyDevicesAddAMobileDevice', {});
          },
        },
      ],
      [push, t.texts.primary],
    );

    return (
      <View style={[t.hFull, t.p4]}>
        <Text style={[t.mB6, t.textSm, t.texts.secondary]}>
          Choose the type of device you would like to log in to. You can
          download the apps{' '}
          <TextWithPress
            style={[t.texts.brand]}
            onPress={() => {
              Linking.openURL('https://farcaster.xyz/~/download');
            }}
          >
            here
          </TextWithPress>
          .
        </Text>

        <View>
          <ButtonGroup options={options} />
        </View>
      </View>
    );
  },
);

export { MyDevicesScreen };
