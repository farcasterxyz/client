import { formatBalance } from 'farcaster-client-hooks';
import React from 'react';
import { View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { formatUnits } from 'viem';

import { useSharedNavigationContext, useTheme } from '../../../../contexts';
import { Text2 } from '../../../design-system';
import { WalletScreenHeader } from '../../../wallet/WalletScreenHeader';
import { useSwapTokens } from './SwapTokensProvider';
import { QuoteResult } from './useSwapQuotes';

export function SwapTokensDebug() {
  const { goBack } = useSharedNavigationContext();
  const { allQuotes } = useSwapTokens();

  return (
    <View>
      <WalletScreenHeader title="Debug" onBackCallback={goBack} />
      <Animated.FlatList
        data={allQuotes}
        renderItem={({ item }) => <QuoteItem quote={item} />}
        keyExtractor={(item) => item.source}
        contentContainerStyle={{ gap: 16, padding: 12 }}
        itemLayoutAnimation={LinearTransition.springify()
          .damping(15)
          .stiffness(150)}
      />
    </View>
  );
}

function QuoteItem({ quote }: { quote: QuoteResult }) {
  const t = useTheme();
  const { buyToken, preparedQuote } = useSwapTokens();
  const bestQuote = preparedQuote?.quote;

  const amount = React.useMemo(() => {
    if (!buyToken || !quote.quote?.buyAmount) {
      return 0;
    }

    return parseFloat(
      formatUnits(BigInt(quote.quote.buyAmount), buyToken.decimals ?? 18),
    );
  }, [quote.quote?.buyAmount, buyToken]);

  const value = React.useMemo(() => {
    const price = buyToken?.priceUsd ? Number(buyToken.priceUsd) : 0;
    return amount * price;
  }, [amount, buyToken?.priceUsd]);

  const diffFromBest = React.useMemo(() => {
    if (!bestQuote?.buyAmount || !buyToken) {
      return 0;
    }

    const bestAmount = parseFloat(
      formatUnits(BigInt(bestQuote.buyAmount), buyToken.decimals ?? 18),
    );

    return ((amount - bestAmount) / bestAmount) * 100;
  }, [amount, bestQuote?.buyAmount, buyToken]);

  return (
    <View
      key={quote.source}
      style={[
        t.flexRow,
        t.p3,
        t.bgLightGray,
        t.justifyBetween,
        { borderRadius: 16 },
      ]}
    >
      <View style={[t.itemsStart, { gap: 4 }]}>
        <Text2 weight="semibold">{quote.source}</Text2>
        {diffFromBest === 0 ? (
          <Text2 size="sm" style={{ color: '#43B748' }}>
            Best
          </Text2>
        ) : (
          <Text2
            size="sm"
            style={{ color: '#eca220' }}
          >{`${diffFromBest.toFixed(2)}%`}</Text2>
        )}
      </View>
      <View style={[t.itemsEnd, { gap: 4 }]}>
        <Text2 weight="semibold">{`${formatBalance(amount)} ${buyToken?.ticker}`}</Text2>
        <Text2 color="secondary">{`$${value.toFixed(2)}`} </Text2>
      </View>
    </View>
  );
}
