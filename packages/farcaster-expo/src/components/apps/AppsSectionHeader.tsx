import React, { FC, memo } from 'react';
import { View } from 'react-native';

import { Text2 } from '../design-system';

export type AppsSectionHeaderProps = {
  title: string;
  dateRange: string;
  subtitle?: string;
};

export const AppsSectionHeader: FC<AppsSectionHeaderProps> = memo(
  ({ title, dateRange }) => {
    if (!title && !dateRange) {
      return null;
    }
    return (
      <View
        style={{
          marginBottom: 16,
          flexDirection: 'column',
          gap: 8,
          paddingHorizontal: 16,
          paddingTop: 24,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text2 size="xl" weight="semibold">
            {title}
          </Text2>
          <Text2 size="sm" color="tertiary">
            {dateRange}
          </Text2>
        </View>
      </View>
    );
  },
);

AppsSectionHeader.displayName = 'AppsSectionHeader';
