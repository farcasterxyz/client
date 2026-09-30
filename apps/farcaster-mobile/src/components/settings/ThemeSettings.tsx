import { AnalyticsEvent } from 'farcaster-analytics';
import {
  darkSavedThemeNamesSet,
  festiveSavedThemeNamesSet,
  SwitchV2,
  systemSavedThemeNamesSet,
  Typography,
} from 'farcaster-expo';
import React, { useCallback, useMemo, useRef } from 'react';
import { Appearance, View } from 'react-native';

import { SelectOne, SelectOneOption } from '~/components/settings/SelectOne';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useGlobalGate } from '~/contexts/GlobalGateProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useUserSavedTheme } from '~/hooks/useAppThemeName';

type ThemeOption = 'dark' | 'light' | 'system';

const THEME_OPTIONS: SelectOneOption<ThemeOption>[] = [
  { value: 'dark', title: 'Dark' },
  { value: 'light', title: 'Light' },
  { value: 'system', title: 'System' },
];

export function ThemeSettings() {
  const t = useTheme();
  const { checkGate } = useGlobalGate();
  const { value: festiveThemeAvailable } = checkGate('festive_theme');
  const { theme: savedTheme, setTheme: setSavedTheme } = useUserSavedTheme();
  const systemToggled = systemSavedThemeNamesSet.has(savedTheme!);
  const darkToggled = darkSavedThemeNamesSet.has(savedTheme!);
  const festiveModeToggled = festiveSavedThemeNamesSet.has(savedTheme!);
  const firstRun = useRef(true);
  const { trackEvent } = useAnalytics();

  React.useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    trackEvent(AnalyticsEvent.ThemeChanged, {
      theme: savedTheme,
    });
  }, [trackEvent, savedTheme]);

  const selectedThemeOption = useMemo<ThemeOption>(() => {
    if (systemToggled) return 'system';
    if (darkToggled) return 'dark';
    return 'light';
  }, [systemToggled, darkToggled]);

  const onThemeChange = useCallback(
    (option: ThemeOption) => {
      if (option === 'system') {
        setSavedTheme('system');
        Appearance.setColorScheme('unspecified');
      } else if (option === 'dark') {
        Appearance.setColorScheme('dark');
        setSavedTheme(festiveModeToggled ? 'holiday-dark' : 'dark');
      } else {
        Appearance.setColorScheme('light');
        setSavedTheme(festiveModeToggled ? 'holiday-light' : 'light');
      }
    },
    [setSavedTheme, festiveModeToggled],
  );

  const onFestiveModeSwitch = useCallback(() => {
    if (!festiveModeToggled) {
      trackEvent(AnalyticsEvent.ToggleFestiveModeOn, {});
      if (darkToggled) {
        setSavedTheme('holiday-dark');
      } else {
        setSavedTheme('holiday-light');
      }
    } else {
      trackEvent(AnalyticsEvent.ToggleFestiveModeOff, {});
      if (darkToggled) {
        setSavedTheme('dark');
      } else {
        setSavedTheme('light');
      }
    }
  }, [festiveModeToggled, darkToggled, setSavedTheme, trackEvent]);

  return (
    <View style={[t.mX4]}>
      <View style={[t.mY4]}>
        <SelectOne
          options={THEME_OPTIONS}
          value={selectedThemeOption}
          onChange={onThemeChange}
        />
        {festiveThemeAvailable && (
          <View style={[t.flexRow, t.justifyBetween, t.pX4, t.pT4]}>
            <Typography label="Body/Medium">Festivecaster</Typography>
            <SwitchV2
              value={festiveModeToggled}
              onValueChange={onFestiveModeSwitch}
            />
          </View>
        )}
      </View>
    </View>
  );
}
