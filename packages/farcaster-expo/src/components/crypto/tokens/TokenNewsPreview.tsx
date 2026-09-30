import { ApiTokenNewsItem } from 'farcaster-client-data';
import { TrendingUp } from 'lucide-react-native';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';

import { useSharedNavigationContext, useTheme } from '../../../contexts';
import { useHaptics } from '../../../hooks';
import { Text2 } from '../../design-system';

export function TokenNewsPreview({
  symbol,
  newsItems,
}: {
  symbol: string;
  newsItems: ApiTokenNewsItem[];
}) {
  const t = useTheme();
  const { triggerImpactAsync } = useHaptics();
  const { push } = useSharedNavigationContext();
  const handlePress = React.useCallback(() => {
    triggerImpactAsync();
    push({
      path: 'TokenNews',
      params: {
        symbol: symbol,
        newsItems: newsItems,
      },
    });
  }, [triggerImpactAsync, push, symbol, newsItems]);

  return (
    <TouchableOpacity
      style={{ position: 'relative' }}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Background rectangles positioned behind the main content */}
      <View
        style={{
          position: 'absolute',
          top: 8,
          bottom: -8,
          left: 20,
          right: 20,
          backgroundColor: t.colors.background.brandLight,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: t.colors.violet300,
          zIndex: -2,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 4,
          bottom: -4,
          left: 10,
          right: 10,
          backgroundColor: t.colors.background.brandLight,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: t.colors.violet300,
          zIndex: -1,
        }}
      />
      {/* Main content that determines the actual height */}
      <View
        style={{
          backgroundColor: t.colors.background.brandLight,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: t.colors.violet300,
          paddingHorizontal: 16,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 8,
            paddingVertical: 12,
          }}
        >
          <TrendingUp size={16} style={[t.texts.brand, { marginTop: 1 }]} />
          <Text2
            size="sm"
            weight="medium"
            style={[
              t.texts.primary,
              { flex: 1, textAlign: 'left' },
              t.fontNormal,
              t.textSm,
            ]}
          >
            {newsItems[0].title || 'No recent news'}
          </Text2>
        </View>
      </View>
    </TouchableOpacity>
  );
}
