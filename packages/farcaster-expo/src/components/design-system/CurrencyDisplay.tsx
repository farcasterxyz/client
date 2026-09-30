import React from 'react';
import { View } from 'react-native';

import { useTheme } from '../../contexts';
import { Text, Text2 } from './Text';

export function CurrencyDisplay({ amount }: { amount?: number }) {
  if (!amount || amount === 0) {
    return <Zero />;
  }
  return <NonZero amount={amount} />;
}

function NonZero({ amount }: { amount: number }) {
  const t = useTheme();

  const { dollars, cents } = React.useMemo(() => {
    const balance = amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const [dollars, cents] = balance.split('.');
    return { dollars, cents };
  }, [amount]);

  return (
    <View style={[t.flexRow, t.itemsStart]}>
      <Text2 size="2xl" weight="medium" lineHeight="xl">
        $
      </Text2>
      <Text2 size="5xl" weight="semibold">
        {dollars}
      </Text2>
      <Text2 size="5xl" weight="semibold" color="tertiary">
        .{cents}
      </Text2>
    </View>
  );
}

function Zero() {
  const t = useTheme();

  return (
    <View style={[t.flexRow, t.text5xl]}>
      <Text
        style={[
          t.text2xl,
          t.fontSemibold,
          { textAlignVertical: 'top' },
          t.mT2,
          t.texts.tertiary,
        ]}
      >
        $
      </Text>
      <Text
        style={[t.flex, t.text5xl, t.fontSemibold, t.flexRow, t.texts.tertiary]}
      >
        0<Text style={[t.texts.tertiary]}>.00</Text>
      </Text>
    </View>
  );
}
