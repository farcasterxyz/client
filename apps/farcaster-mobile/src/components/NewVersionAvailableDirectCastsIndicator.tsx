import { AnalyticsEvent } from 'farcaster-analytics';
import { LayoutGridIcon } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

import { Text } from '~/components/Text';
import { TextWithPress } from '~/components/TextWithPress';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCheckForOverTheAirUpdate } from '~/contexts/CheckForOverTheAirUpdateProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useDirectCastsVersioning } from '~/hooks/data/useDirectCastsVersioning';
import { useUserAppContextGate } from '~/hooks/useUserAppContextGate';
import { openWarpcastAppDownload } from '~/utils/UrlUtils';

const NewVersionAvailableDirectCastsIndicator: React.FC = React.memo(() => {
  const t = useTheme();
  const { trackEvent } = useAnalytics();
  const { restart, supportsRestart } = useCheckForOverTheAirUpdate();
  const { shouldUpdate, shouldRestart } = useDirectCastsVersioning();
  const { checkUserAppContextGate } = useUserAppContextGate();

  const appStoreUpdateFlow = shouldUpdate;

  const pressableText = appStoreUpdateFlow ? 'Update' : 'Restart';

  const onPress = React.useCallback(async () => {
    trackEvent(AnalyticsEvent.PressNewVersionRestartDirectCasts, undefined);

    if (appStoreUpdateFlow) {
      openWarpcastAppDownload();
    } else {
      await restart();
    }
  }, [appStoreUpdateFlow, restart, trackEvent]);

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

  if (!shouldUpdate && !shouldRestart) {
    return null;
  }

  if (shouldRestart) {
    return (
      <View
        style={[
          t.flex,
          t.flexRow,
          t.flexWrap,
          t.itemsCenter,
          t.justifyCenter,
          t.pY2,
          t._mX3,
          t.borderDefault,
          t.borderBHairline,
        ]}
      >
        <LayoutGridIcon size={12} style={[t.texts.secondary, t.mR1]} />
        <Text style={[t.texts.secondary, t.textXs]} numberOfLines={2}>
          New Farcaster version is available!
        </Text>
        <Text style={[t.textXs, t.texts.secondary]}> · </Text>
        <TextWithPress
          style={[t.textXs, t.texts.brand]}
          onPress={onRestartPress}
        >
          Restart
        </TextWithPress>
      </View>
    );
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
        t._mX3,
        t.borderDefault,
        t.borderBHairline,
      ]}
    >
      <LayoutGridIcon size={12} style={[t.texts.secondary, t.mR1]} />
      <Text style={[t.texts.secondary, t.textXs]} numberOfLines={2}>
        Get the latest improvements
      </Text>
      <Text style={[t.textXs, t.texts.secondary]}> · </Text>
      <TextWithPress style={[t.textXs, t.texts.brand]} onPress={onPress}>
        {pressableText}
      </TextWithPress>
    </View>
  );
});

NewVersionAvailableDirectCastsIndicator.displayName =
  'NewVersionAvailableDirectCastsIndicator';

export { NewVersionAvailableDirectCastsIndicator };
