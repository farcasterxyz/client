import { useRequireBiometricAuth } from 'farcaster-expo';
import * as React from 'react';
import { View } from 'react-native';

import { AutoDisplayingBottomSheetModal } from '~/components/BottomSheet/AutoDisplayingBottomSheetModal';
import { ButtonV2 } from '~/components/ButtonV2';
import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

import { SecurityModeIcon } from './SecurityModeIcon';

const SecureModeBottomDisableSheet = ({
  onConfirm,
  onDismiss,
}: {
  onConfirm: () => void;
  onDismiss: () => void;
}) => {
  const t = useTheme();
  const biometricAuthPromise = useRequireBiometricAuth();

  const onDisableStartedRef = React.useRef(false);
  const onDisable = React.useCallback(async () => {
    if (onDisableStartedRef.current) {
      return;
    }
    onDisableStartedRef.current = true;
    await biometricAuthPromise;
    onConfirm();
  }, [biometricAuthPromise, onConfirm]);

  return (
    <AutoDisplayingBottomSheetModal
      name="secure-mode-bottom-disable-sheet"
      onDismiss={onDismiss}
    >
      <View style={[{ gap: 12 }]}>
        <View style={[t.flexRow, t.itemsCenter, { gap: 8 }]}>
          <SecurityModeIcon variant="crossed" size={32} />
          <Text2 weight="semibold" size="xl">
            Disable Advanced Protection
          </Text2>
        </View>
        <Text2 color="primary">
          You'll no longer be required to enter a code from your authentication
          app when taking key actions.
        </Text2>
        <View style={[t.pT3, t.flexRow, { gap: 8 }]}>
          <ButtonV2
            variant="secondary"
            title="Cancel"
            onPress={onDismiss}
            width="flex1"
          />
          <ButtonV2
            variant="primary"
            title="Disable"
            onPress={onDisable}
            width="flex1"
          />
        </View>
      </View>
    </AutoDisplayingBottomSheetModal>
  );
};

export { SecureModeBottomDisableSheet };
