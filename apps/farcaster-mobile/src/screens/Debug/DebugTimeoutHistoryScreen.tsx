import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import moment from 'moment';
import React, { FC, memo } from 'react';
import { View } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import {
  StoredTimeoutInfo,
  TimeoutInfo,
  useTimeoutHistory,
} from '~/contexts/TimeoutHistoryProvider';
import { CommonStackParamList } from '~/types';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';

type DebugTimeoutHistoryScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'DebugTimeoutHistory'
>;

const DebugTimeoutHistoryScreen = buildScreen<DebugTimeoutHistoryScreenProps>(
  { name: 'DebugTimeoutHistory' },
  () => {
    const t = useTheme();
    const { timeouts } = useTimeoutHistory();

    return (
      <View style={[t.hFull, t.pY4, t.justifyBetween]}>
        <FlashList
          data={timeouts}
          keyExtractor={(item) => String(item.id)}
          {...STANDARD_FLASHLIST_PERF_PROPS}
          renderItem={renderItem}
        />
      </View>
    );
  },
);

const renderItem = ({ item }: { item: StoredTimeoutInfo }) => (
  <Timeout timeout={item} />
);

type TimeoutProps = {
  timeout: TimeoutInfo;
};

const Timeout: FC<TimeoutProps> = memo(({ timeout }) => {
  const t = useTheme();

  return (
    <View style={[t.p4]}>
      <Text style={[t.texts.secondary, t.textXs]}>
        {moment(timeout.timedOutAt).format()}
      </Text>
      <Text style={[t.texts.primary, t.textSm]}>
        {timeout.requestInfo.method} {timeout.requestInfo.absoluteUrl}
      </Text>
      <Text style={[t.texts.primary, t.textSm]}>
        Timed out after {timeout.timeSinceRequestStart}ms
      </Text>
    </View>
  );
});

export { DebugTimeoutHistoryScreen };
