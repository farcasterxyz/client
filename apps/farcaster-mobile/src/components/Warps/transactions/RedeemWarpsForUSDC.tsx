import { ApiWarpsRequestRedeemWarpsForUsdTransaction } from 'farcaster-client-data';
import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '~/contexts/ThemeProvider';

import { Transaction } from './Transaction';

type RedeemWarpsForUsdcProps = {
  transaction: ApiWarpsRequestRedeemWarpsForUsdTransaction;
};

export const SwapIcon = (
  <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <Path
      d="M6 2.25L3 5.25L6 8.25"
      stroke="#7C65C1"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3 5.25H15"
      stroke="#7C65C1"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 15.75L15 12.75L12 9.75"
      stroke="#7C65C1"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M15 12.75H3"
      stroke="#7C65C1"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const RedeemWarpsForUsdc: React.FC<RedeemWarpsForUsdcProps> = ({
  transaction,
}) => {
  const t = useTheme();

  const imageIcon = (
    <View
      style={[
        t.w8,
        t.h8,
        t.roundedFull,
        t.bgLightPurple,
        t.justifyCenter,
        t.itemsCenter,
        t.mR4,
        t.selfStart,
      ]}
    >
      {SwapIcon}
    </View>
  );

  const usdcAmount = transaction.content.amount / 100;
  const hasDecimals = usdcAmount % 1 !== 0;
  const usdcAmountString = hasDecimals
    ? usdcAmount.toFixed(2)
    : Math.floor(usdcAmount).toString();
  const description = `You converted ${transaction.content.amount} warps to ${usdcAmountString} USDC`;
  return (
    <Transaction
      title={'Converted to USDC'}
      description={description}
      imageStyle="circle"
      pending={false}
      timestamp={transaction.timestamp}
      amount={transaction.content.amount}
      incomingTransaction={false}
      chain={'base'}
      imageComponent={imageIcon}
    />
  );
};

RedeemWarpsForUsdc.displayName = 'RedeemWarpsForUsdc';

export { RedeemWarpsForUsdc };
