import { useTheme } from 'farcaster-expo';
import React, { FC } from 'react';
import { View } from 'react-native';

type NotificationAccessoryBackgroundProps = {
  children: React.ReactNode;
  backgroundColor: string;
};

export const NotificationAccessoryBackground: FC<
  NotificationAccessoryBackgroundProps
> = ({ children, backgroundColor }) => {
  const t = useTheme();

  return (
    <View
      style={{
        backgroundColor,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: t.colors.border.background,
      }}
    >
      {children}
    </View>
  );
};
