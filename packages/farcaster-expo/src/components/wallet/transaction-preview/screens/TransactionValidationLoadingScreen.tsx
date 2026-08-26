import React from 'react';
import { View } from 'react-native';

import { useTheme } from '../../../../contexts';
import { TextPlaceholder } from '../../../design-system';
import { ActionButtons } from '../common';

/**
 * Screen component for displaying a loading state while validating transactions
 */
export function TransactionValidationLoadingScreen({
  onConfirm,
  onCancel,
  isConfirming,
  isCancelling,
  disabled,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  isConfirming?: boolean;
  isCancelling?: boolean;
  disabled?: boolean;
}) {
  const t = useTheme();

  const detailsRow = ({
    variant,
    key,
  }: {
    variant: 'normal' | 'darker';
    key: number;
  }) => (
    <View key={key} style={[t.flex, t.flexRow, t.justifyBetween]}>
      <TextPlaceholder width={150} size="sm" variant={variant} />
      <TextPlaceholder width={50} size="sm" variant={variant} />
    </View>
  );

  return (
    <View style={[t.flex, t.flexCol, { gap: 12 }]}>
      {/* First placeholder block - for state changes */}
      <View
        style={[t.flex, t.flexCol, t.p3, t.roundedLg, t.bgFaint, { gap: 16 }]}
      >
        {[...Array(2)].map((_, key) => detailsRow({ variant: 'darker', key }))}
      </View>

      {/* Second placeholder block - for transaction details */}
      <View
        style={[t.flex, t.flexCol, t.p3, t.roundedLg, t.bgFaint, { gap: 10 }]}
      >
        {[...Array(4)].map((_, key) => detailsRow({ variant: 'darker', key }))}
      </View>

      {/* Action buttons */}
      <ActionButtons
        onConfirm={onConfirm}
        onCancel={onCancel}
        isConfirming={isConfirming}
        isCancelling={isCancelling}
        confirmDisabled={disabled}
      />
    </View>
  );
}
