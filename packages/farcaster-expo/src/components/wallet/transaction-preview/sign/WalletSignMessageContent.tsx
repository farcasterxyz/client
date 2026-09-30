import React from 'react';
import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import { useTheme } from '../../../../contexts';
import { ButtonV2, Text2 } from '../../../design-system';

export function WalletSignMessageContent({
  message,
  approve,
  cancel,
  status,
  surface,
}: {
  message: string;
  approve: () => void;
  cancel: () => void;
  status: 'pending' | 'approved' | 'rejected';
  surface?: string;
}) {
  const t = useTheme();

  return (
    <View style={[t.flex1]}>
      <ScrollView
        style={[t.bgFaint, t.roundedLg, t.p3, { gap: 12, maxHeight: 360 }]}
        alwaysBounceVertical={false}
      >
        <Text2 weight="medium">Message</Text2>
        <Text2>{message}</Text2>
      </ScrollView>
      <View
        style={[
          t.flex,
          t.flexRow,
          t.justifyBetween,
          t.mT6,
          surface === 'full_warplet' ? t.mB12 : undefined,
          { gap: 10 },
        ]}
      >
        <View style={[t.flex1]}>
          <ButtonV2
            variant="secondary"
            title="Cancel"
            width="flex1"
            disabled={status !== 'pending'}
            onPress={cancel}
          />
        </View>
        <View style={[t.flex1]}>
          <ButtonV2
            width="flex1"
            title="Approve"
            disabled={status !== 'pending'}
            onPress={() => {
              if (status === 'pending') {
                approve();
              }
            }}
          />
        </View>
      </View>
    </View>
  );
}
