import { formatDecimal } from 'farcaster-client-data';
import { formatPercent } from 'farcaster-client-hooks';
import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '../../../../contexts';
import { AutoDisplayingBottomSheetModal } from '../../../bottom-sheet/AutoDisplayingBottomSheetModal';
import { AnimatedPressable, Text2 } from '../../../design-system';

export function SwapTokensPriceImpactWarning({
  onDismiss,
  priceImpact,
  priceImpactUsd,
  onConfirm,
}: {
  onDismiss: () => void;
  priceImpact: number;
  priceImpactUsd: number;
  onConfirm: () => void;
}) {
  const t = useTheme();
  const bottomSheetRef = React.useRef<{ dismiss: () => void }>(null);

  return (
    <AutoDisplayingBottomSheetModal
      name="walletSwapBottomPopup"
      onDismiss={onDismiss}
      ref={bottomSheetRef}
      displayedInModalPresentationScreen={true}
    >
      <View style={{ gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <Path
              d="M21.73 18L13.73 3.99998C13.5556 3.69218 13.3026 3.43617 12.9969 3.25805C12.6913 3.07993 12.3438 2.98608 11.99 2.98608C11.6362 2.98608 11.2888 3.07993 10.9831 3.25805C10.6774 3.43617 10.4245 3.69218 10.25 3.99998L2.25002 18C2.0737 18.3053 1.98125 18.6519 1.98203 19.0045C1.98281 19.3571 2.0768 19.7032 2.25447 20.0078C2.43214 20.3124 2.68717 20.5646 2.99372 20.7388C3.30026 20.9131 3.64743 21.0032 4.00002 21H20C20.3509 20.9996 20.6955 20.9069 20.9993 20.7313C21.3031 20.5556 21.5552 20.3031 21.7305 19.9991C21.9058 19.6951 21.9981 19.3504 21.998 18.9995C21.9979 18.6486 21.9055 18.3039 21.73 18Z"
              fill="#E03E1A"
              stroke="#E03E1A"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path d="M12 9V13V9Z" fill="#E03E1A" />
            <Path
              d="M12 9V13"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path d="M12 17.0001H12.0096H12Z" fill="#E03E1A" />
            <Path
              d="M12 17.0001H12.0096"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>

          <Text2 weight="semibold" size="xl">
            Unusually High Price Impact
          </Text2>
        </View>
        <Text2 size="sm" color="secondary">
          You might lose over{' '}
          <Text2 size="sm" color="danger">
            {formatDecimal(priceImpactUsd)} (
            {formatPercent({ value: priceImpact })})
          </Text2>{' '}
          on this trade because the market isn't very active.
        </Text2>
        <AnimatedPressable
          onPress={onConfirm}
          style={{ flex: 1, height: 48, marginTop: 4 }}
        >
          <View
            style={[
              t.flex1,
              t.bgDanger,
              { borderRadius: 32 },
              t.justifyCenter,
              t.itemsCenter,
              { height: 48 },
            ]}
          >
            <Text2 size="lg" weight="semibold" color="light">
              Confirm
            </Text2>
          </View>
        </AnimatedPressable>
      </View>
    </AutoDisplayingBottomSheetModal>
  );
}
