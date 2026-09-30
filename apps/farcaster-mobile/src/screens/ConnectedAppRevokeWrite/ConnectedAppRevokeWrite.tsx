import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Platform } from 'react-native';

import { RevokeConnectedAppKey } from '~/components/RevokeConnectedAppKey';
import { buildScreen } from '~/components/Screen';
import { CommonStackParamList } from '~/types';

type ConnectedAppScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'ConnectedAppRevokeWrite'
>;

export const ConnectedAppRevokeWriteScreen =
  buildScreen<ConnectedAppScreenProps>(
    {
      name: 'ConnectedAppRevokeWrite',
      insetBottom: true,
      insetTop: Platform.OS === 'android',
    },
    ({
      route: {
        params: { appFid },
      },
    }) => {
      return <RevokeConnectedAppKey appFid={appFid} keyType="write" />;
    },
  );

ConnectedAppRevokeWriteScreen.displayName = 'ConnectedAppRevokeWriteScreen';
