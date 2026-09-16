import React, { FC, memo, ReactNode } from 'react';
import { TextStyle, View } from 'react-native';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

type OrderedListItemProps = {
  index: number;
  text: ReactNode;
  textStyle?: TextStyle[];
};

const OrderedListItem: FC<OrderedListItemProps> = memo(
  ({ index, text, textStyle }) => {
    const t = useTheme();

    return (
      <View style={[t.flexRow]}>
        <Text
          style={[
            t.texts.primary,
            t.textBase,
            t.mR2,
            { width: 15 },
            ...(textStyle || []),
          ]}
        >
          {index + 1}.
        </Text>
        <View style={[t.flexRow, t.flexWrap, t.flexShrink]}>
          <Text
            style={[
              t.texts.primary,
              t.textBase,
              t.pB3,
              t.flexWrap,
              ...(textStyle || []),
            ]}
          >
            {text}
          </Text>
        </View>
      </View>
    );
  },
);

OrderedListItem.displayName = 'OrderedListItem';

export { OrderedListItem };
