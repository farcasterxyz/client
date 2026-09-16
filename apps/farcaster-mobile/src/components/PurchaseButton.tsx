import { ApiOnchainTransactionType } from 'farcaster-client-data';
import React from 'react';
import { ViewStyle } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { useInAppPurchases } from '~/contexts/InAppPurchasesProvider';
import { sizes, useTheme } from '~/contexts/ThemeProvider';
import { trackError } from '~/utils/ErrorUtils';

import { Button } from './Button';

type PurchaseButtonProps = {
  onchainTransactionType: ApiOnchainTransactionType;
  productId: string;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
};

// TODO: Will this work if there are multiple purchase buttons on the page?
// Will the state updates impact all components rendered? - Yes.
// We likely need to figure out if we need better handling of this.
const PurchaseButton: React.FC<PurchaseButtonProps> = ({
  onchainTransactionType,
  productId,
  disabled,
  style,
}) => {
  const t = useTheme();
  const toast = useToast();

  const {
    purchase,
    requestedPurchaseFailed,
    requestedPurchaseSucceeded,
    resetPurchaseState,
  } = useInAppPurchases();

  const [purchasing, setPurchasing] = React.useState<boolean>(false);

  const onPurchasePress = React.useCallback(() => {
    try {
      setPurchasing(true);
      purchase({ onchainTransactionType, productId });
    } catch (error) {
      trackError(error);
      setPurchasing(false);
    }
  }, [onchainTransactionType, productId, purchase]);

  React.useEffect(() => {
    if (purchasing && requestedPurchaseFailed) {
      toast.show('Purchase failed.', { placement: 'top' });
      setPurchasing(false);
      resetPurchaseState();
    }
    if (purchasing && requestedPurchaseSucceeded) {
      toast.show('Purchase successful', { placement: 'top' });
      setPurchasing(false);
      resetPurchaseState();
    }
  }, [
    purchasing,
    requestedPurchaseFailed,
    requestedPurchaseSucceeded,
    resetPurchaseState,
    toast,
  ]);

  return (
    <Button
      disabled={disabled}
      title={'Purchase'}
      onPress={onPurchasePress}
      loading={purchasing}
      variant="inverted"
      size="xs"
      minWidth={sizes.s24}
      style={[t.h8, style]}
    />
  );
};

export { PurchaseButton };
