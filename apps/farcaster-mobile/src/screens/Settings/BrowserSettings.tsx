import { AnalyticsEvent } from 'farcaster-analytics';
import React from 'react';
import { View } from 'react-native';

import { SelectOne, SelectOneOption } from '~/components/settings/SelectOne';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import {
  BrowserPreference,
  useBrowserPreference,
} from '~/contexts/BrowserPreferenceProvider';
import { useTheme } from '~/contexts/ThemeProvider';

type BrowserOption = BrowserPreference.IN_APP | BrowserPreference.SYSTEM;

const BROWSER_OPTIONS: SelectOneOption<BrowserOption>[] = [
  {
    value: BrowserPreference.IN_APP,
    title: 'In-app browser',
    subtitle: 'Open links within Farcaster',
  },
  {
    value: BrowserPreference.SYSTEM,
    title: 'System browser',
    subtitle: 'Open links in default system browser',
  },
];

function BrowserSettings() {
  const t = useTheme();
  const { browserPreference, setBrowserPreference } = useBrowserPreference();
  const { trackEvent } = useAnalytics();

  const onBrowserPreferenceChange = React.useCallback(
    (option: BrowserOption) => {
      setBrowserPreference(option);
      trackEvent(AnalyticsEvent.SetSettingBrowser, {
        value: option,
      });
    },
    [setBrowserPreference, trackEvent],
  );

  return (
    <View style={[t.mX4]}>
      <View style={[t.mY4]}>
        <SelectOne
          options={BROWSER_OPTIONS}
          value={browserPreference}
          onChange={onBrowserPreferenceChange}
        />
      </View>
    </View>
  );
}

BrowserSettings.displayName = 'BrowserSettings';

export { BrowserSettings };
