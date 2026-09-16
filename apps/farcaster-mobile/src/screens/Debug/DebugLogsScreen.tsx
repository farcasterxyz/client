import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import * as Clipboard from 'expo-clipboard';
import { AtomsButton } from 'farcaster-expo';
import moment from 'moment';
import React, { FC, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { Empty } from '~/components/Empty';
import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { DebugLog, useDebugLogs } from '~/contexts/DebugLogsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { CommonStackParamList } from '~/types';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';

type DebugLogsScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'DebugLogs'
>;

const DebugLogsScreen = buildScreen<DebugLogsScreenProps>(
  { name: 'DebugLogs' },
  () => {
    const t = useTheme();
    const { getLogs, addLog, clearLogs } = useDebugLogs();

    const [, setForcedRerenderAt] = useState(0);

    const toast = useToast();

    useEffect(() => {
      let hasUnmounted = false;

      const scheduleAndRerender = () => {
        setTimeout(() => {
          setForcedRerenderAt(Date.now());
          if (!hasUnmounted) {
            scheduleAndRerender();
          }
        }, 2000);
      };

      scheduleAndRerender();
      return () => {
        hasUnmounted = true;
      };
    }, []);

    return (
      <View style={[t.hFull, t.justifyBetween, t.pY4]}>
        <FlashList
          data={getLogs()}
          keyExtractor={keyExtractor}
          ListEmptyComponent={() => (
            <Empty message="There are no debug logs." />
          )}
          {...STANDARD_FLASHLIST_PERF_PROPS}
          renderItem={renderItem}
        />
        <View style={[t.pX2]}>
          <AtomsButton
            size="l"
            onPress={() => {
              Clipboard.setStringAsync(JSON.stringify(getLogs()));
              toast.show('Copied logs to clipboard', { placement: 'top' });
            }}
          >
            Copy logs to clipboard
          </AtomsButton>
          <AtomsButton
            size="l"
            style={[t.mT2]}
            onPress={() => {
              addLog('Dummy log');
              setForcedRerenderAt(Date.now());
            }}
          >
            Add dummy log
          </AtomsButton>
          <AtomsButton
            size="l"
            style={[t.mT2]}
            onPress={() => {
              clearLogs();
              setForcedRerenderAt(Date.now());
            }}
          >
            Clear logs
          </AtomsButton>
        </View>
      </View>
    );
  },
);

const keyExtractor = (log: DebugLog) => [log.timestamp, log.text].join('|');

const renderItem = ({ item: log }: { item: DebugLog }) => (
  <DebugLogLine log={log} />
);

type DebugLogLineProps = {
  log: DebugLog;
};

const DebugLogLine: FC<DebugLogLineProps> = ({ log }) => {
  const t = useTheme();

  return (
    <View style={[t.pX2]}>
      <Text style={[t.texts.secondary, t.fontMono, t.mB1, { fontSize: 10 }]}>
        {moment(log.timestamp).format('YYYY-MM-DD hh:mm:ss Z')}
      </Text>
      <Text style={[t.texts.primary, t.fontMono, t.mB2, { fontSize: 10 }]}>
        {log.text}
      </Text>
    </View>
  );
};

DebugLogLine.displayName = 'DebugLog';

export { DebugLogsScreen };
