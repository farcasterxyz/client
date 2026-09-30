import React, { memo } from 'react';
import { View } from 'react-native';

import { sizes } from '~/contexts/ThemeProvider';

type Enumerate<
  N extends number,
  Acc extends number[] = [],
> = Acc['length'] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc['length']]>;

type IntRange<F extends number, T extends number> = Exclude<
  Enumerate<T>,
  Enumerate<F>
>;

type SizesRange = IntRange<1, 43>;

export const Spacer = memo(
  ({
    size = 1,
    horizontal,
    debug = false,
  }: {
    size: SizesRange;
    horizontal?: boolean;
    debug?: boolean;
  }) => {
    const actualSize = sizes[`s${size}`];
    const horizontalStyle = { width: actualSize };
    const verticalStyle = { height: actualSize };
    const style = horizontal ? horizontalStyle : verticalStyle;
    const debugStyle = {
      ...(horizontal ? verticalStyle : horizontalStyle),
      backgroundColor: 'blue',
      alignSelf: 'center',
    };

    return <View style={[style, __DEV__ && debug && debugStyle]} />;
  },
);
