import { Octicons } from '@expo/vector-icons';
import { AnalyticsEvent } from 'farcaster-analytics';
import React from 'react';
import { View } from 'react-native';

import { Text } from '~/components/Text';
import { TextWithPress } from '~/components/TextWithPress';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCheckForOverTheAirUpdate } from '~/contexts/CheckForOverTheAirUpdateProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useUserAppContextGate } from '~/hooks/useUserAppContextGate';

const NewVersionAvailableFeedIndicator: React.FC = React.memo(() => {
  const t = useTheme();
  const { trackEvent } = useAnalytics();
  const { hasDownloadedUpdate, restart, supportsRestart } =
    useCheckForOverTheAirUpdate();
  const { checkUserAppContextGate } = useUserAppContextGate();

  const onRestartPress = React.useCallback(async () => {
    trackEvent(AnalyticsEvent.PressNewVersionRestart, undefined);

    await restart();
  }, [restart, trackEvent]);

  const shouldHideOTABanner = React.useMemo(() => {
    return !checkUserAppContextGate('ota-updates').value || !supportsRestart;
  }, [checkUserAppContextGate, supportsRestart]);

  if (shouldHideOTABanner) {
    return null;
  }

  if (!hasDownloadedUpdate) {
    return null;
  }

  return (
    <View
      style={[
        t.flex,
        t.flexRow,
        t.flexWrap,
        t.itemsCenter,
        t.justifyCenter,
        t.pY2,
        t.borderBHairline,
        t.borderDefault,
      ]}
    >
      <Octicons name={'apps'} style={[t.texts.secondary, t.mR1]} />
      <Text style={[t.texts.secondary, t.textXs]} numberOfLines={2}>
        New Farcaster version is available!
      </Text>
      <Text style={[t.textXs, t.texts.secondary]}> · </Text>
      <TextWithPress style={[t.textXs, t.texts.brand]} onPress={onRestartPress}>
        Restart
      </TextWithPress>
    </View>
  );
});

NewVersionAvailableFeedIndicator.displayName =
  'NewVersionAvailableFeedIndicator';

export { NewVersionAvailableFeedIndicator };
