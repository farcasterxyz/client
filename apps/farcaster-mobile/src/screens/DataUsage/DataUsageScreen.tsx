import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import React, { useCallback } from 'react';
import { View } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { SelectOne } from '~/components/settings/SelectOne';
import { Switch } from '~/components/Switch';
import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { DataSaverMode, useDataSaver } from '~/contexts/DataSaverProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { CommonStackParamList } from '~/types';

type DataUsageScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'DataUsage'
>;

const DataUsageScreen = buildScreen<DataUsageScreenProps>(
  { name: 'DataUsage' },
  () => {
    const t = useTheme();
    const { trackEvent } = useAnalytics();
    const {
      mode,
      setMode,
      downloadUpdatesOnCellular,
      setDownloadUpdatesOnCellular,
    } = useDataSaver();

    const onModeChange = useCallback(
      (value: DataSaverMode) => {
        setMode(value);
        trackEvent(AnalyticsEvent.SetSettingDataUsage, {
          dataSaverMode: value,
        });
      },
      [setMode, trackEvent],
    );

    const onDownloadUpdatesOnCellularChange = useCallback(
      (value: boolean) => {
        setDownloadUpdatesOnCellular(value);
      },
      [setDownloadUpdatesOnCellular],
    );

    return (
      <View style={[t.hFull, t.p3]}>
        <Text style={[t.textSm, t.texts.secondary, t.p1, t.mB3]}>
          Farcaster won't auto-play videos and will load lower-quality images to
          improve performance and to reduce network data usage based on the
          selection below.
        </Text>
        <View
          style={[
            t.bgDefault,
            t.flex,
            t.flexRow,
            t.wFull,
            t.itemsCenter,
            t.roundedLg,
            t.borderHairline,
            t.borderDefault,
            t.mB2,
            t.mT2,
          ]}
        >
          <SelectOne
            style={[t.flexGrow]}
            options={[
              {
                title: 'Slow connection only',
                subtitle: 'Improve performance on slow networks',
                value: DataSaverMode.SLOW_CONNECTION_ONLY,
              },
              {
                title: 'Cellular only',
                subtitle: 'Save data on cellular networks',
                value: DataSaverMode.CELLULAR_ONLY,
              },
              {
                title: 'Always on',
                subtitle: 'Save data on all networks',
                value: DataSaverMode.ALWAYS_ON,
              },
            ]}
            value={mode}
            onChange={onModeChange}
            hideDividerOnLastOption
          />
        </View>
        <View style={[t.flex, t.flexCol, t.mY3]}>
          <Text style={[t.textSm, t.texts.secondary, t.textBase, t.mB3, t.p1]}>
            Additional settings
          </Text>
          <View
            style={[
              t.bgDefault,
              t.flex,
              t.flexRow,
              t.wFull,
              t.itemsCenter,
              t.justifyBetween,
              t.roundedLg,
              t.borderHairline,
              t.borderDefault,
              t.pX4,
            ]}
          >
            <View style={[t.flexCol, t.flex1, t.pR2]}>
              <Text style={[t.pT4, t.texts.primary, t.textBase]}>
                Over-the-air updates on cellular
              </Text>
              <Text style={[t.pB4, t.pT1, t.texts.secondary, t.textSm]}>
                When enabled, Farcaster will download over-the-air updates on
                cellular networks.
              </Text>
            </View>
            <Switch
              style={[t.w12]}
              value={downloadUpdatesOnCellular}
              onValueChange={onDownloadUpdatesOnCellularChange}
              newColors
            />
          </View>
        </View>
      </View>
    );
  },
);

DataUsageScreen.displayName = 'DataUsageScreen';

export { DataUsageScreen };
