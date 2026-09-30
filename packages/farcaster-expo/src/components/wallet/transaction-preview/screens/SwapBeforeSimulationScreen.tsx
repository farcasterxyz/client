import { Feather } from '@expo/vector-icons';
import { ApiSwapQuote } from 'farcaster-client-data';
import React, { useMemo } from 'react';
import { ScrollView, View } from 'react-native';

import { useTheme } from '../../../../contexts';
import { Text2 } from '../../../design-system';
import { getConversionTextFromQuote } from '../../GaslessConversionText';
import { ActionButtons } from '../common';

/**
 * Screen component displayed when a token swap is needed for gas before transaction simulation
 */
export function SwapBeforeSimulationScreen({
  gaslessQuote,
  onConfirmTransaction,
  onCancelTransaction,
  isConfirming = false,
  isCancelling = false,
}: {
  gaslessQuote: ApiSwapQuote;
  onConfirmTransaction: () => Promise<void>;
  onCancelTransaction: () => void;
  isConfirming?: boolean;
  isCancelling?: boolean;
}) {
  const t = useTheme();

  const sourceToken = gaslessQuote?.price?.sell?.token?.symbol || 'tokens';
  const destToken = gaslessQuote?.price?.buy?.token?.symbol || 'ETH';

  const title = useMemo(() => {
    if (!sourceToken || !destToken) {
      return 'Gas Fee Swap Required';
    }
    return `Swap ${sourceToken} for ${destToken} to pay gas fees`;
  }, [sourceToken, destToken]);

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} nestedScrollEnabled>
      <View style={[t.flex1, t.flexCol, { gap: 12 }]}>
        {/* Information panel */}
        <View
          style={[
            t.flex,
            t.flexCol,
            t.p4,
            t.roundedLg,
            { backgroundColor: t.colors.bgNewLightGray, gap: 12 },
          ]}
        >
          <View style={[t.flexRow, t.itemsCenter, { gap: 8 }]}>
            <Feather name="repeat" size={20} color={t.colors.text.primary} />
            <Text2 size="base" weight="semibold">
              {title}
            </Text2>
          </View>

          <Text2 size="sm" color="secondary">
            {getConversionTextFromQuote(gaslessQuote)} After the swap completes,
            we'll re-check the transaction for safety before you sign.
          </Text2>
        </View>

        <View style={{ flexGrow: 1 }} />

        {/* Action buttons */}
        <ActionButtons
          onConfirm={onConfirmTransaction}
          onCancel={onCancelTransaction}
          isConfirming={isConfirming}
          isCancelling={isCancelling}
          confirmTitle="Swap & Continue"
        />
      </View>
    </ScrollView>
  );
}
