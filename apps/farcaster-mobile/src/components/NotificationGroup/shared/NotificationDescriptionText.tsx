import { Text2, TextColor } from 'farcaster-expo';
import React from 'react';
import { type TextProps as RNTextProps } from 'react-native';

type NotificationDescriptionTextProps = RNTextProps & {
  color?: TextColor;
};

export const NotificationDescriptionText = (
  props: NotificationDescriptionTextProps,
) => {
  return (
    <Text2
      weight="regular"
      size="sm"
      color="secondary"
      letterSpacing="lg"
      {...props}
    />
  );
};
