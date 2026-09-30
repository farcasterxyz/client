import { Feather } from '@expo/vector-icons';
import { ApiSwapQuote } from 'farcaster-client-data';
import { formatTokenQuantity } from 'farcaster-client-hooks';
import React, { useMemo, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { formatUnits } from 'viem';

import { hitSlop } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';
import { AutoDisplayingBottomSheetModal } from '../bottom-sheet';
import { ButtonV2, Text2, TextAlign } from '../design-system';

function DetailsPanelBottomSheet({
  onDismiss,
  gaslessQuote,
}: {
  onDismiss: () => void;
  gaslessQuote: ApiSwapQuote;
}) {
  const t = useTheme();
  const bottomSheetRef = React.useRef<{ dismiss: () => void }>(null);

  const tokenAmount = useMemo(() => {
    if (!gaslessQuote) {
      return 'a small amount';
    }

    const { sell } = gaslessQuote.price;
    if (sell.amount !== undefined && sell.token.decimals !== undefined) {
      return `${formatTokenQuantity({
        quantity: BigInt(sell.amount),
        decimals: sell.token.decimals,
        price: sell.token.price,
      })} ${sell.token.symbol || ''}`;
    }
    return 'a small amount';
  }, [gaslessQuote]);

  return (
    <AutoDisplayingBottomSheetModal
      name="detailsPanelInfoBottomSheet"
      onDismiss={onDismiss}
      ref={bottomSheetRef}
      displayedInModalPresentationScreen={true}
    >
      <View
        style={[t.flexGrow, t.flex, t.flexCol, t.justifyBetween, { gap: 8 }]}
      >
        <View style={[t.flex, t.flexRow, t.itemsCenter, { gap: 8 }]}>
          <View style={[t.roundedFull]}>
            <Feather name="info" size={18} style={[t.texts.secondary]} />
          </View>
          <Text2 weight="semibold" size="lg">
            Gasless Swap
          </Text2>
        </View>
        <Text2 color="secondary" size="base" weight="regular" style={[t.mB1]}>
          We'll convert {tokenAmount} to cover this and future transaction fees.
        </Text2>
        <ButtonV2
          title={'Okay'}
          onPress={() => {
            bottomSheetRef.current?.dismiss();
          }}
          width="full"
          height="normal"
          textSize="lg"
        />
      </View>
    </AutoDisplayingBottomSheetModal>
  );
}

function formatNumbering(val: number, maximumFractionDigits: number): string {
  return Number(val).toLocaleString('en-US', {
    minimumFractionDigits: 0, // Don't require any decimal places
    maximumFractionDigits,
    useGrouping: false, // Don't use commas for thousands separators
  });
}

export function getConversionTextFromQuote(gaslessQuote: ApiSwapQuote) {
  const { sell } = gaslessQuote.price;
  let amount = 'N/A';
  if (
    sell.token.price !== undefined &&
    sell.amount !== undefined &&
    sell.token.decimals !== undefined
  ) {
    const unitAmounts = formatUnits(BigInt(sell.amount), sell.token.decimals);
    const usdUnitAmount = Number(unitAmounts) * sell.token.price;
    amount = `$${formatNumbering(usdUnitAmount, 2)}`;
  } else if (sell.amount !== undefined) {
    amount = `${formatNumbering(Number(sell.amount), 5)}`;
  }
  return `Converting ${amount} ${gaslessQuote.price.sell.token.symbol ?? 'N/A'} to cover for fees.`;
}

export function GaslessConversionText({
  gaslessQuote,
  disabledTooltip,
  fullWidth = true,
  align = 'center',
}: {
  gaslessQuote: ApiSwapQuote;
  disabledTooltip?: boolean;
  fullWidth?: boolean;
  align?: TextAlign;
}) {
  const t = useTheme();
  const [isInfoBottomSheetOpen, setIsInfoBottomSheetOpen] = useState(false);

  const bottomSheet = useMemo(() => {
    if (!isInfoBottomSheetOpen || !gaslessQuote) {
      return null;
    }
    return (
      <DetailsPanelBottomSheet
        onDismiss={() => setIsInfoBottomSheetOpen(false)}
        gaslessQuote={gaslessQuote}
      />
    );
  }, [isInfoBottomSheetOpen, gaslessQuote]);

  if (!gaslessQuote) {
    return null;
  }

  return (
    <>
      <View
        style={[
          t.flex,
          t.pX4,
          t.flexRow,
          { columnGap: 4 },
          t.itemsCenter,
          t.justifyCenter,
          fullWidth ? t.wFull : undefined,
        ]}
      >
        <Text2 size="xs" color="tertiary" align={align}>
          {getConversionTextFromQuote(gaslessQuote)}
        </Text2>
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => setIsInfoBottomSheetOpen(true)}
          hitSlop={hitSlop}
          disabled={disabledTooltip}
          style={[disabledTooltip ? t.hidden : undefined]}
        >
          <Feather name="info" size={12} style={[t.texts.secondary, t.mL1]} />
        </TouchableOpacity>
      </View>
      {bottomSheet}
    </>
  );
}
