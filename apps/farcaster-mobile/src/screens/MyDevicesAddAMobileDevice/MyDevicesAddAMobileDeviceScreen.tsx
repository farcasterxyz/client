import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { View } from 'react-native';

import { OrderedListItem } from '~/components/OrderedListItem';
import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { CommonStackParamList } from '~/types';

type MyDevicesAddAMobileDeviceScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'MyDevicesAddADesktopDevice'
>;

const MyDevicesAddAMobileDeviceScreen =
  buildScreen<MyDevicesAddAMobileDeviceScreenProps>(
    { name: 'MyDevicesAddADesktopDevice' },
    () => {
      const t = useTheme();

      return (
        <View style={[t.hFull, t.pX4, t.justifyBetween]}>
          <View>
            <View style={[t.mT4]}>
              <OrderedListItem
                index={0}
                text="Open Farcaster on your new mobile device "
              />
              <OrderedListItem
                index={1}
                text={
                  <>
                    Tap <Text style={[t.fontBold]}>Log in</Text>, then choose{' '}
                    <Text style={[t.fontBold]}>Mobile</Text>
                  </>
                }
              />
              <OrderedListItem
                index={2}
                text={
                  <Text>
                    On this device, open the{' '}
                    <Text style={[t.fontBold]}>Camera</Text> app and scan the QR
                    code on your new mobile device
                  </Text>
                }
              />
            </View>
          </View>
        </View>
      );
    },
  );

export { MyDevicesAddAMobileDeviceScreen };
