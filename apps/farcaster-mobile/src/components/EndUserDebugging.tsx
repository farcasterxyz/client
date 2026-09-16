import { useRoute } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { stringifyError } from 'farcaster-client-data';
import { AtomsButton, Typography } from 'farcaster-expo';
import React, { FC, memo, useEffect, useState } from 'react';
import { ScrollView, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from 'react-native-toast-notifications';

import { useScreen } from '~/contexts/ScreenProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { logInDevOnly } from '~/utils/LogUtils';

type ErrorPayload = Record<string, unknown>;

type EndUserDebuggingProps = {
  containerStyle?: ViewStyle[];
  error: unknown;
  onFinishedDebugging: () => void;
};

const EndUserDebugging: FC<EndUserDebuggingProps> = memo(
  ({ containerStyle, error, onFinishedDebugging }) => {
    const isSignedIn = useIsSignedIn();

    if (isSignedIn) {
      return (
        <AuthedEndUserDebugging
          containerStyle={containerStyle}
          error={error}
          onFinishedDebugging={onFinishedDebugging}
        />
      );
    }

    return (
      <UnauthedEndUserDebugging
        containerStyle={containerStyle}
        error={error}
        onFinishedDebugging={onFinishedDebugging}
      />
    );
  },
);

EndUserDebugging.displayName = 'EndUserDebugging';

const AuthedEndUserDebugging: FC<EndUserDebuggingProps> = memo(
  ({ containerStyle, error, onFinishedDebugging }) => {
    const t = useTheme();

    const toast = useToast();
    const { fid, username } = useCurrentUser_UNSAFE();
    const route = useRoute();
    const queryClient = useQueryClient();

    const insets = useSafeAreaInsets();

    const { insetTop } = useScreen();

    const [errorPayload, setErrorPayload] = useState<ErrorPayload>();

    useEffect(() => {
      const init = async () => {
        const payload: ErrorPayload = {
          error: stringifyError(error),
          fid,
          localTimestamp: Date.now(),
          route,
          username,
          unauthed: false,
        };

        setErrorPayload(payload);
      };

      init();
    }, [error, fid, queryClient, route, username]);

    return (
      <View
        style={[
          t.hFull,
          t.pY4,
          insetTop ? { paddingTop: insets.top } : null,
          t.justifyBetween,
          ...(containerStyle || []),
        ]}
      >
        <ScrollView contentContainerStyle={[t.pX4]}>
          <Typography label="Body/ExtraSmall" style={t.fontMono}>
            {errorPayload
              ? JSON.stringify(errorPayload, null, 2)
              : 'Assembling error data...'}
          </Typography>
        </ScrollView>
        <View style={[t.pX4, t.mT2]}>
          <AtomsButton
            size="l"
            hierarchy="overlay"
            onPress={onFinishedDebugging}
            style={[t.mB4]}
          >
            Stop debugging
          </AtomsButton>
          <AtomsButton
            disabled={!errorPayload}
            size="l"
            hierarchy="primary"
            onPress={async () => {
              try {
                await Clipboard.setStringAsync(
                  JSON.stringify(errorPayload, null, 2),
                );
                logInDevOnly(errorPayload);
                toast.show('Copied error to clipboard.', { placement: 'top' });
              } catch (e) {
                toast.show('Unable to copy error to clipboard.', {
                  placement: 'top',
                  type: 'danger',
                });
              }
            }}
          >
            Copy error to clipboard
          </AtomsButton>
        </View>
      </View>
    );
  },
);

AuthedEndUserDebugging.displayName = 'AuthedEndUserDebugging';

const UnauthedEndUserDebugging: FC<EndUserDebuggingProps> = memo(
  ({ containerStyle, error, onFinishedDebugging }) => {
    const t = useTheme();

    const toast = useToast();

    const insets = useSafeAreaInsets();

    const { insetTop } = useScreen();

    const [errorPayload, setErrorPayload] = useState<ErrorPayload>();

    useEffect(() => {
      const init = async () => {
        const payload: ErrorPayload = {
          error: stringifyError(error),
          localTimestamp: Date.now(),
          unauthed: true,
        };

        setErrorPayload(payload);
      };

      init();
    }, [error]);

    return (
      <View
        style={[
          t.hFull,
          t.pY4,
          insetTop ? { paddingTop: insets.top } : null,
          t.justifyBetween,
          ...(containerStyle || []),
        ]}
      >
        <ScrollView contentContainerStyle={[t.pX4]}>
          <Typography
            label="Body/ExtraSmall"
            style={t.fontMono}
            color="primary"
          >
            {errorPayload
              ? JSON.stringify(errorPayload, null, 2)
              : 'Assembling error data...'}
          </Typography>
        </ScrollView>
        <View style={[t.pX4, t.mT2]}>
          <AtomsButton
            size="l"
            hierarchy="overlay"
            onPress={onFinishedDebugging}
            style={[t.mB4]}
          >
            Stop debugging
          </AtomsButton>
          <AtomsButton
            size="l"
            hierarchy="primary"
            disabled={!errorPayload}
            onPress={async () => {
              try {
                await Clipboard.setStringAsync(
                  JSON.stringify(errorPayload, null, 2),
                );
                logInDevOnly(errorPayload);
                toast.show('Copied error to clipboard.', { placement: 'top' });
              } catch (e) {
                toast.show('Unable to copy error to clipboard.', {
                  placement: 'top',
                  type: 'danger',
                });
              }
            }}
          >
            Copy error to clipboard
          </AtomsButton>
        </View>
      </View>
    );
  },
);

UnauthedEndUserDebugging.displayName = 'UnauthedEndUserDebugging';

export { EndUserDebugging };
