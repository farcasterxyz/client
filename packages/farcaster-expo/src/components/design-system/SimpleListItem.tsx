import React, { ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

import { useTheme } from '../../contexts';
import { AnimatedPressable, AnimatedPressableProps } from './AnimatedPressable';

export type SimpeListItemPadding = 'slim' | 'normal';

export type SimpleListItemProps = {
  children: ReactNode;
  isStart?: boolean;
  isEnd?: boolean;
  padding?: SimpeListItemPadding;
  style?: StyleProp<ViewStyle>;
};

export type PressableSimpleListItemProps = AnimatedPressableProps &
  SimpleListItemProps;

const animation = { scale: false };

export function PressableSimpleListItem({
  isStart,
  isEnd,
  children,
  style,
  color = 'lightGray',
  ...rest
}: PressableSimpleListItemProps) {
  const t = useTheme();
  return (
    <AnimatedPressable
      animation={animation}
      style={[
        {
          padding: 12,
          borderTopLeftRadius: isStart ? 16 : 0,
          borderTopRightRadius: isStart ? 16 : 0,
          borderBottomLeftRadius: isEnd ? 16 : 0,
          borderBottomRightRadius: isEnd ? 16 : 0,
          overflow: 'hidden',
        },
        ...(isStart ? [] : [t.borderT, t.borderBackground]),
        style,
      ]}
      color={color}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
