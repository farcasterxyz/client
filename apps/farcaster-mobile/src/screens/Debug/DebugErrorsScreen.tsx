import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import * as Clipboard from 'expo-clipboard';
import { stringifyError } from 'farcaster-client-data';
import { FakeError } from 'farcaster-client-hooks';
import { AtomsButton, Text2 } from 'farcaster-expo';
import moment from 'moment';
import React, { FC, useMemo } from 'react';
import { Alert, View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { Empty } from '~/components/Empty';
import { buildScreen } from '~/components/Screen';
import { useErrorHistory } from '~/contexts/ErrorHistoryProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { CommonStackParamList } from '~/types';
import { trackError } from '~/utils/ErrorUtils';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';

type DebugErrorsScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'DebugErrors'
>;

type ProcessedError = {
  message: string;
  timestamp: number;
};

class NestedFakeError extends Error {
  readonly nestedFoo: string;

  constructor(nestedFoo: string) {
    super('This is a nested fake error');
    this.nestedFoo = nestedFoo;
  }
}

const DebugErrorsScreen = buildScreen<DebugErrorsScreenProps>(
  { name: 'DebugErrors' },
  () => {
    const t = useTheme();
    const { errors: errorHistory } = useErrorHistory();

    const toast = useToast();

    const errors: ProcessedError[] = useMemo(
      () =>
        errorHistory.map(({ timestamp, error }) => ({
          timestamp,
          message: stringifyError(error),
        })),
      [errorHistory],
    );

    return (
      <View style={[t.hFull, t.justifyBetween, t.pY4]}>
        <FlashList
          data={errors}
          keyExtractor={keyExtractor}
          ListEmptyComponent={() => (
            <Empty message="There haven't been any errors this session." />
          )}
          {...STANDARD_FLASHLIST_PERF_PROPS}
          renderItem={renderItem}
        />
        <View style={[t.pX4]}>
          <AtomsButton
            size="l"
            onPress={() => {
              Clipboard.setStringAsync(JSON.stringify(errors));
              toast.show('Copied errors to clipboard', { placement: 'top' });
            }}
          >
            Copy errors to clipboard
          </AtomsButton>
          <AtomsButton
            style={[t.mT2]}
            size="l"
            onPress={() => {
              trackError(
                new FakeError({
                  simpleFoo: 'bar',
                  complexFoo: {
                    bar: { baz: 'qux' },
                  },
                  error: new NestedFakeError('nestedBar'),
                }),
              );
              Alert.alert('Tracked fake error');
            }}
          >
            Track fake error
          </AtomsButton>
        </View>
      </View>
    );
  },
);

const keyExtractor = (error: ProcessedError) =>
  [error.timestamp, error.message].join('|');

const renderItem = ({ item: error }: { item: ProcessedError }) => (
  <ProcessedError error={error} />
);

type ProcessedErrorProps = {
  error: ProcessedError;
};

const ProcessedError: FC<ProcessedErrorProps> = ({ error }) => {
  const t = useTheme();

  return (
    <View style={[t.pX4]}>
      <Text2 style={[t.fontMono, t.mB1, { fontSize: 10 }]} color="primary">
        {moment(error.timestamp).format('YYYY-MM-DD hh:mm:ss Z')}
      </Text2>
      <Text2 style={[t.fontMono, { fontSize: 10 }]} color="primary">
        {error.message}
      </Text2>
    </View>
  );
};

ProcessedError.displayName = 'ProcessedError';

export { DebugErrorsScreen };
