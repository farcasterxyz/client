import { Feather } from '@expo/vector-icons';
import { AnalyticsEvent } from 'farcaster-analytics';
import React from 'react';
import { Linking, Pressable } from 'react-native';

import { Text } from '~/components/Text';
import { hitSlop } from '~/constants/Pressable';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';

type ExternalLinkProps = {
  label: string;
  externalUrl: string | undefined;
};

const ExternalLink: React.FC<ExternalLinkProps> = ({ label, externalUrl }) => {
  const t = useTheme();
  const { trackEvent } = useAnalytics();

  if (!externalUrl) {
    return null;
  }

  return (
    <Pressable
      style={[t.flexRow, t.itemsCenter, t.mR4, t.mB1]}
      onPress={() => {
        trackEvent(AnalyticsEvent.VisitingExternalURL, { externalUrl });
        Linking.openURL(externalUrl);
      }}
      hitSlop={hitSlop}
    >
      <Text style={[t.pR1, t.texts.secondary, t.textSm]}>{label}</Text>
      <Feather name="external-link" size={12} color={t.colors.text.secondary} />
    </Pressable>
  );
};

ExternalLink.displayName = 'ExternalLink';

export { ExternalLink };
