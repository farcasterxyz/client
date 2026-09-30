import { Text2 } from 'farcaster-expo';
import React from 'react';

interface NotificationSecondaryTextProps {
  children: React.ReactNode;
}

export const NotificationSecondaryText = ({
  children,
}: NotificationSecondaryTextProps) => {
  return (
    <Text2
      weight="regular"
      size="sm"
      lineHeight="sm"
      color="primary"
      letterSpacing="lg"
    >
      {children}
    </Text2>
  );
};
