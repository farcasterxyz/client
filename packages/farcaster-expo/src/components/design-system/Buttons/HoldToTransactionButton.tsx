import { useUserPreference } from 'farcaster-client-hooks';
import { ScanFace } from 'lucide-react-native';
import React, { useCallback } from 'react';

import { largeTransactionUsd } from '../../../constants';
import { useTheme } from '../../../contexts';
import { useAttemptBiometricAuth } from '../../../hooks';
import {
  HoldToConfirmButton,
  HoldToConfirmButtonProps,
} from './HoldToConfirmButton';

export interface HoldToTransactButtonProps extends HoldToConfirmButtonProps {
  /**
   * Transaction value in USD as a float
   */
  usdValue: number | undefined;
  onReject?: () => void;
  showBiometricIcon?: boolean;
}

export function HoldToTransactButton({
  usdValue,
  onReject,
  onConfirm,
  showBiometricIcon,
  Icon,
  ...rest
}: HoldToTransactButtonProps) {
  const t = useTheme();
  const attemptBiometricAuth = useAttemptBiometricAuth();
  const [biometricsEnabled] = useUserPreference({
    preference: 'biometricAuthLargeTransactions',
  });

  const shouldUseBiometric = React.useMemo(() => {
    return (
      usdValue !== undefined &&
      usdValue >= largeTransactionUsd &&
      biometricsEnabled
    );
  }, [usdValue, biometricsEnabled]);

  const wrappedOnConfirm = useCallback(async () => {
    if (shouldUseBiometric) {
      const { success } = await attemptBiometricAuth();

      if (!success) {
        onReject?.();
        return;
      }
    }

    onConfirm();
  }, [shouldUseBiometric, onConfirm, attemptBiometricAuth, onReject]);

  const WithBiometricIcon = React.useCallback(
    ({ isPressing }: { isPressing: boolean }) => {
      if (showBiometricIcon && shouldUseBiometric && !isPressing) {
        return <ScanFace size={20} color={t.colors.text.light} />;
      }
      return Icon?.({ isPressing });
    },
    [showBiometricIcon, shouldUseBiometric, t.colors.text.light, Icon],
  );

  return (
    <HoldToConfirmButton
      {...rest}
      onConfirm={wrappedOnConfirm}
      Icon={WithBiometricIcon}
    />
  );
}
