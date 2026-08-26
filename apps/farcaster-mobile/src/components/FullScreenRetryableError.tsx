import { Ionicons } from '@expo/vector-icons';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  isFarcasterApiError,
  isHandledFetchError,
} from 'farcaster-client-data';
import { generateIdempotencyKey } from 'farcaster-client-hooks';
import { ButtonV2 } from 'farcaster-expo';
import React, {
  FC,
  memo,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { TouchableOpacity, View, ViewStyle } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { AppBackButton } from '~/components/AppBackButton';
import { Text2 } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useSplash } from '~/contexts/SplashProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useIsAdmin } from '~/hooks/data/useIsAdmin';
import { useManuallyTrackView } from '~/hooks/datadog/useManuallyTrackView';
import { trackError } from '~/utils/ErrorUtils';

import { EndUserDebugging } from './EndUserDebugging';
import { ErrorDebuggingExtras } from './ErrorDebuggingExtras';
import { ErrorIconWithDebugActions } from './ErrorIconWithDebugActions';

type FullScreenRetryableErrorProps = {
  containerStyle?: ViewStyle[];
  error: unknown;
  resetErrorBoundary: () => void;
  onBack?: () => void;
};

const getErrorDescription = (error: unknown) => {
  if (isFarcasterApiError(error)) {
    switch (error.endpointName) {
      case 'getCastLikes':
        return 'We were unable to retrieve the likes.';
      case 'getCastRecasters':
        return 'We were unable to retrieve the recasters.';
      case 'getClientConfig':
        return 'We were unable to retrieve the client config.';
      case 'getDirectCastConversationMessages':
        return 'We were unable to load the messages.';
      case 'getDirectCastKeys':
        return 'We were unable to retrieve the public keys.';
      case 'getFname':
        return 'We were unable to retrieve the fname';
      case 'getFollowers':
        return 'We were unable to retrieve the users.';
      case 'getFollowing':
        return 'We were unable to retrieve the users.';
      case 'getHealth':
        return 'We were unable to retrieve the health status.';
      case 'getIsUserInvited':
        return 'We were unable to retrieve the invite status.';
      case 'getNotificationsInGroup':
        return 'We were unable to retrieve the notifications.';
      case 'getNotificationActorsInGroup':
        return 'We were unable to retrieve the notification details.';
      case 'getOnboardingState':
        return 'We were unable to retrieve your session.';
      case 'getOnboardingStateAndAuthToken':
        return 'We were unable to retrieve your session.';
      case 'getThread':
        return 'We were unable to retrieve the thread.';
      case 'getUnseen':
        return 'We were unable to retrieve the unseen notifications.';
      case 'getUser':
        return 'We were unable to retrieve the user.';
      case 'getUserCasts':
        return 'We were unable to retrieve the casts.';
      case 'getUserPreferences':
        return 'We were unable to retrieve the user preferences.';
      case 'getVerifications':
        return 'We were unable to retrieve the verifications.';
      case 'searchUsers':
        return 'We were unable to retrieve the users.';
    }
    // If we don't have an error description and the request was a timeout
    // we'll just show the timeout message without an error description.
    if (error.hasTimedOut || error.isOffline) {
      return '';
    }
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'We encountered an unexpected error.';
};

const useSafeSafeAreaInsets = () => {
  const insets = useContext(SafeAreaInsetsContext) ?? {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  };

  return insets;
};

const FullScreenRetryableError: FC<FullScreenRetryableErrorProps> = memo(
  ({ containerStyle, error, resetErrorBoundary, onBack }) => {
    const t = useTheme();
    const { trackEvent } = useAnalytics();
    const insets = useSafeSafeAreaInsets();
    const [isDebugging, setIsDebugging] = useState(false);
    const { onAppInitialized } = useSplash();
    const isAdmin = useIsAdmin();

    const errorDescription = getErrorDescription(error);
    const hasTimeout = isFarcasterApiError(error) && error.hasTimedOut;
    const isOffline = isFarcasterApiError(error) && error.isOffline;

    useEffect(() => {
      trackEvent(AnalyticsEvent.ViewNonRetryableError, {
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : 'Unknown',
      });
    }, [error, trackEvent]);

    const errorTrackingId = useMemo(() => {
      return generateIdempotencyKey();
    }, []);

    useEffect(() => {
      // We call onAppInitialized to ensure that the faux splash screen
      // transitions out in cases where one of the top-level API requests
      // (e.g. fetching the current user profile + activity) fails
      // before we even get a chance to render the navigation container
      // and a screen that would typically trigger this behavior.
      onAppInitialized();
    }, [onAppInitialized]);

    useEffect(() => {
      const properties: Record<string, string | number | boolean> = {
        message: errorDescription,
        trackingId: errorTrackingId,
        hasTimeout,
      };

      if (error instanceof Error) {
        properties.errorName = error.name;
        properties.errorMessage = error.message;
      }

      if (isFarcasterApiError(error)) {
        properties.errorEndpointName = error.endpointName;
      }

      if (isHandledFetchError(error)) {
        properties.errorStatus = error.status;
      }

      trackEvent(AnalyticsEvent.ViewRetryableError, properties);
      trackError(errorDescription, properties);
    }, [error, errorDescription, errorTrackingId, hasTimeout, trackEvent]);

    useManuallyTrackView({
      key: 'FullScreenRetryableError',
      name: 'FullScreenRetryableError',
      context: useMemo(
        () =>
          error instanceof Error
            ? {
                errorName: error.name,
                errorMessage: error.message,
                errorDescription,
              }
            : {},
        [error, errorDescription],
      ),
    });

    if (isDebugging) {
      return (
        <View
          style={[
            t.hFull,
            t.flexCol,
            t.justifyEnd,
            t.bgDefault,
            t.pX4,
            t.pT8,
            t.pB6,
            ...(containerStyle || []),
          ]}
        >
          <EndUserDebugging
            containerStyle={containerStyle}
            error={error}
            onFinishedDebugging={() => setIsDebugging(false)}
          />
        </View>
      );
    }

    const showDebuggingExtras = !hasTimeout && !isOffline;

    return (
      <View
        style={[
          t.hFull,
          t.flexCol,
          t.justifyEnd,
          t.bgDefault,
          t.pX4,
          t.pB8,
          ...(containerStyle || []),
        ]}
      >
        {onBack && (
          <AppBackButton
            onPress={onBack}
            style={{
              marginTop: insets.top,
            }}
          />
        )}
        <View style={[t.flexCol, t.justifyCenter, t.flexGrow, t.itemsCenter]}>
          <View
            style={[
              t.flexCol,
              t.justifyBetween,
              t.itemsCenter,
              t.mB8,
              { height: 239 },
            ]}
          >
            <ErrorIconWithDebugActions
              connectionError={hasTimeout || isOffline}
              onReset={async () => {
                await resetErrorBoundary();
              }}
            />
            {errorDescription && (
              <View
                style={[
                  t.flexCol,
                  t.justifyCenter,
                  t.itemsCenter,
                  t.pB16,
                  { gap: 4 },
                ]}
              >
                <Text2 size="xl" weight="semibold" align="center">
                  {errorDescription}
                </Text2>
              </View>
            )}
            {(hasTimeout || isOffline) && (
              <View
                style={[
                  t.flexCol,
                  t.justifyCenter,
                  t.itemsCenter,
                  t.pB16,
                  { gap: 4 },
                ]}
              >
                <Text2 size="xl" weight="semibold">
                  Couldn't connect to Farcaster
                </Text2>
                <Text2 color="secondary">
                  Check your connection and try again
                </Text2>
              </View>
            )}
          </View>
        </View>
        {showDebuggingExtras && (
          <View style={[t.itemsCenter, t.mB2]}>
            <ErrorDebuggingExtras errorTrackingId={errorTrackingId} />
            {isAdmin && (
              <TouchableOpacity
                style={[
                  t.flexRow,
                  t.p2,
                  t.mY4,
                  t.pX4,
                  t.justifyCenter,
                  t.itemsCenter,
                  t.bgMuted,
                  t.roundedFull,
                  { gap: 4 },
                ]}
                onPress={() => setIsDebugging(true)}
                activeOpacity={0.75}
              >
                <Text2 color="secondary">Debug error</Text2>
                <Ionicons
                  name="bug-outline"
                  size={14}
                  color={t.colors.textMutedDark}
                />
              </TouchableOpacity>
            )}
          </View>
        )}
        <ButtonV2
          title="Try again"
          onPress={async () => {
            await resetErrorBoundary();
          }}
        />
      </View>
    );
  },
);

FullScreenRetryableError.displayName = 'FullScreenRetryableError';

export { FullScreenRetryableError };
