import React from 'react';
import { ScrollView, View } from 'react-native';

import { useTheme } from '../../../../contexts';
import { ButtonV2 } from '../../../design-system';

/**
 * Screen component for displaying warning or malicious transaction assertions
 */
export function ValidationAssertionScreen({
  onContinue,
  onCancel,
  isCancelling,
  innerView,
}: {
  onContinue: () => void;
  onCancel: () => void;
  isCancelling?: boolean;
  innerView?: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} nestedScrollEnabled>
      <View style={[t.flex1, t.flexCol, { gap: 12 }]}>
        {innerView}
        <View
          style={[
            t.flex,
            t.flexRow,
            t.justifyBetween,
            t.mT6,
            t.mB4,
            { gap: 10 },
          ]}
        >
          <View style={[t.flex1]}>
            <ButtonV2
              variant="secondary"
              title="Continue anyway"
              onPress={onContinue}
              width="flex1"
            />
          </View>
          <View style={[t.flex1]}>
            <ButtonV2
              title="Cancel"
              onPress={onCancel}
              width="flex1"
              disabled={isCancelling}
              loading={isCancelling}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
