import React from 'react';
import { View } from 'react-native';

import { useTheme, useWalletSurface } from '../../../../contexts';
import { ButtonV2, Text2 } from '../../../design-system';

export interface ActionButtonsProps {
  onConfirm: () => void;
  onCancel: () => void;
  isConfirming?: boolean;
  isCancelling?: boolean;
  confirmTitle?: string;
  cancelTitle?: string;
  confirmDisabled?: boolean;
  cancelDisabled?: boolean;
  disclaimerText?: string;
}

/**
 * Common component for rendering confirm/cancel buttons with a disclaimer text
 */
export function ActionButtons({
  onConfirm,
  onCancel,
  isConfirming = false,
  isCancelling = false,
  confirmTitle = 'Confirm',
  cancelTitle = 'Cancel',
  confirmDisabled = false,
  cancelDisabled = false,
  disclaimerText,
}: ActionButtonsProps) {
  const t = useTheme();
  const { surface } = useWalletSurface();

  return (
    <View
      style={[
        t.flexCol,
        { gap: 8 },
        surface === 'full_warplet' && !disclaimerText
          ? { marginBottom: 8 }
          : undefined,
      ]}
    >
      <View style={[t.flexRow, t.justifyBetween, { gap: 16 }]}>
        <View style={[t.flex1, { borderRadius: 14 }]}>
          <ButtonV2
            textSize="lg"
            variant="secondary"
            title={cancelTitle}
            onPress={onCancel}
            width="flex1"
            disabled={cancelDisabled || isCancelling || isConfirming}
            loading={isCancelling}
          />
        </View>
        <View style={[t.flex1, { borderRadius: 14 }]}>
          <ButtonV2
            textSize="lg"
            title={isConfirming ? 'Confirming...' : confirmTitle}
            onPress={onConfirm}
            width="flex1"
            disabled={confirmDisabled || isConfirming || isCancelling}
            loading={isConfirming}
          />
        </View>
      </View>
      {disclaimerText && (
        <Text2
          align="center"
          size="xs"
          color="secondary"
          style={[{ marginTop: 10 }]}
        >
          {disclaimerText}
        </Text2>
      )}
    </View>
  );
}
