import { Text2, TextWithPress, useTheme } from 'farcaster-expo';
import React from 'react';
import { type StyleProp, type TextProps, type TextStyle } from 'react-native';

interface NotificationTitleTextProps extends TextProps {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}

/**
 * Notification title text
 * @param children - The text to display
 * @returns A styled text component
 */
export const NotificationTitleText = (props: NotificationTitleTextProps) => {
  return (
    <Text2
      weight={'medium'}
      size="base"
      lineHeight="sm"
      color="primary"
      letterSpacing="lg"
      numberOfLines={2}
      ellipsizeMode="tail"
      {...props}
    />
  );
};

interface NotificationTitleTextWithPressProps {
  children: React.ReactNode;
  onPress: () => void;
  style?: StyleProp<TextStyle>;
}

export const NotificationTitleTextWithPress = ({
  children,
  onPress,
}: NotificationTitleTextWithPressProps) => {
  const t = useTheme();
  return (
    <TextWithPress
      onPress={onPress}
      style={[
        t.texts.primary,
        t.textBase,
        t.fontMedium,
        {
          letterSpacing: -0.15,
        },
      ]}
    >
      {children}
    </TextWithPress>
  );
};
