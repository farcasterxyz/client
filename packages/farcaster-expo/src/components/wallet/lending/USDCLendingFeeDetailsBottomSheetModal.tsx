import { formatPrice } from 'farcaster-client-hooks';
import { View } from 'react-native';

import { useTheme } from '../../../contexts';
import { AutoDisplayingBottomSheetModal } from '../../bottom-sheet/AutoDisplayingBottomSheetModal';
import { Text2 } from '../../design-system';

export function USDCLendingFeeDetailsBottomSheetModal({
  feesUsd,
  onDismiss,
}: {
  feesUsd: number;
  onDismiss: () => void;
}) {
  const t = useTheme();

  return (
    <AutoDisplayingBottomSheetModal
      name="usdc-lending-fee-details-bottom-sheet"
      stackBehavior="push"
      onDismiss={onDismiss}
    >
      <View style={[t.flex1, t.flexCol, t.p3, { gap: 8 }]}>
        <View style={[t.pY2]}>
          <Text2 weight="semibold" color="primary" size="xl">
            Details
          </Text2>
        </View>
        <View style={[t.flexCol, { gap: 12 }]}>
          <View style={[t.flexRow, t.justifyBetween]}>
            <Text2 size="sm" weight="medium" color="secondary">
              Wallet Fees
            </Text2>
            <Text2 size="sm" weight="semibold" color="primary">
              {formatPrice(0)}
            </Text2>
          </View>
          <View style={[t.flexRow, t.justifyBetween]}>
            <Text2 size="sm" weight="medium" color="secondary">
              Market Fees
            </Text2>
            <Text2 size="sm" weight="semibold" color="primary">
              {formatPrice(feesUsd)}
            </Text2>
          </View>
        </View>
        <View style={[t.pY2]}>
          <Text2 size="sm" weight="medium" color="tertiary">
            Market fee includes blockchain, router, and dex fees.
          </Text2>
        </View>
      </View>
    </AutoDisplayingBottomSheetModal>
  );
}
