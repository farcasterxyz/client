import { Octicons } from '@expo/vector-icons';
import { AnalyticsEvent } from 'farcaster-analytics';
import React, { memo } from 'react';
import { TouchableOpacity, View } from 'react-native';

import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePossiblyNavigateOrOpenUrl } from '~/utils/LinkingUtils';

type UnsupportedEmbedProps = {
  source: string;
};

const UnsupportedEmbed: React.FC<UnsupportedEmbedProps> = memo(({ source }) => {
  const t = useTheme();
  const { trackEvent } = useAnalytics();
  const possiblyNavigateOrOpenUrl = usePossiblyNavigateOrOpenUrl();

  return (
    <View
      style={[
        t.mT2,
        t.roundedLg,
        t.bgDefault,
        t.flex,
        t.flexRow,
        t.itemsCenter,
        t.justifyBetween,
        t.p2,
      ]}
    >
      <View
        style={[t.flex1, t.flex, t.flexRow, t.itemsCenter, { maxWidth: '90%' }]}
      >
        <Text style={[t.mL1, t.textXs, t.texts.secondary]} numberOfLines={1}>
          No preview found for shared link
        </Text>
      </View>
      <TouchableOpacity
        style={[t.flexRow, t.itemsCenter, t.flex, t.itemsCenter]}
        onPress={() => {
          trackEvent(AnalyticsEvent.VisitingExternalURL, { source });
          possiblyNavigateOrOpenUrl({ url: source });
        }}
        activeOpacity={0.75}
      >
        <Octicons name="link-external" size={10} color={t.colors.text.brand} />
        <Text style={[t.pR1, t.textXs, t.mL1, t.texts.brand]}>View source</Text>
      </TouchableOpacity>
    </View>
  );
});

export { UnsupportedEmbed };
