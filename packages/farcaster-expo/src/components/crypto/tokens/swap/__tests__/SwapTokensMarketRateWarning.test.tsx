import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { SwapTokensMarketRateWarning } from '../SwapTokensMarketRateWarning';

jest.mock('farcaster-client-hooks', () => ({
  __esModule: true,
  formatPercent: ({ value }: { value: number }) =>
    `${(value * 100).toFixed(1)}%`,
}));

jest.mock('farcaster-client-data', () => ({
  __esModule: true,
  formatDecimal: (value: number) => value.toFixed(2),
}));

jest.mock('../../../../../contexts', () => ({
  __esModule: true,
  useTheme: () => ({
    flex1: { flex: 1 },
    backgrounds: { warning: { backgroundColor: '#D97706' } },
    colors: {
      text: {
        warning: '#D97706',
        light: '#FFFFFF',
      },
    },
    justifyCenter: { justifyContent: 'center' },
    itemsCenter: { alignItems: 'center' },
  }),
}));

jest.mock('../../../../design-system', () => {
  const React = require('react');
  const { Text, Pressable } = require('react-native');
  return {
    __esModule: true,
    AnimatedPressable: ({
      children,
      onPress,
    }: {
      children: React.ReactNode;
      onPress?: () => void;
    }) => <Pressable onPress={onPress}>{children}</Pressable>,
    Text2: ({ children }: { children: React.ReactNode }) => (
      <Text>{children}</Text>
    ),
  };
});

jest.mock('../../../../bottom-sheet/AutoDisplayingBottomSheetModal', () => {
  const { View: MockView } = require('react-native');
  return {
    __esModule: true,
    AutoDisplayingBottomSheetModal: ({
      children,
    }: {
      children: React.ReactNode;
    }) => <MockView>{children}</MockView>,
  };
});

describe('<SwapTokensMarketRateWarning />', () => {
  it('renders warning copy and loss details when usd loss is present', () => {
    const onDismiss = jest.fn();
    const onConfirm = jest.fn();

    const { getByText } = render(
      <SwapTokensMarketRateWarning
        onDismiss={onDismiss}
        onConfirm={onConfirm}
        valueLossBps={750}
        valueLossUsd={12.34}
      />,
    );

    expect(getByText('Unfavorable Quote')).toBeTruthy();
    expect(getByText(/worse than market value\./)).toBeTruthy();
    expect(getByText(/Estimated value loss:/)).toBeTruthy();
    expect(getByText('7.5%')).toBeTruthy();
    expect(getByText(/\$12\.34/)).toBeTruthy();
    expect(getByText('Continue Anyway')).toBeTruthy();
  });

  it('confirms and omits usd loss section when loss usd is absent', () => {
    const onDismiss = jest.fn();
    const onConfirm = jest.fn();

    const { getByText, queryByText } = render(
      <SwapTokensMarketRateWarning
        onDismiss={onDismiss}
        onConfirm={onConfirm}
        valueLossBps={500}
      />,
    );

    fireEvent.press(getByText('Continue Anyway'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(queryByText(/Estimated value loss:/)).toBeNull();
  });
});
