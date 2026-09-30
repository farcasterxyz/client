import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiAuthSession, isHandledFetchError } from 'farcaster-client-data';
import { useAuthSessions, useRevokeAuthSession } from 'farcaster-client-hooks';
import { AnimatedPressable, Text2 } from 'farcaster-expo';
import { Shield, ShieldAlert, Smartphone } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ListRenderItem,
  View,
} from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { Empty } from '~/components/Empty';
import { buildScreen } from '~/components/Screen';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useAuthToken } from '~/contexts/AuthTokenProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useAppState } from '~/hooks/useAppState';
import { useRefreshOnFocus } from '~/hooks/useRefreshOnFocus';
import { CommonStackParamList } from '~/types';

import {
  extractAppVersion,
  formatCountryCode,
  formatSessionDate,
  parseUserAgent,
  sortSessions,
} from './sessionUtils';

type SessionsScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'Sessions'
>;

const SessionsScreen = buildScreen<SessionsScreenProps>(
  { name: 'Sessions' },
  () => {
    const t = useTheme();
    const { trackEvent } = useAnalytics();
    const toast = useToast();
    const revokeAuthSession = useRevokeAuthSession();
    const { signOut } = useAuthToken();

    const { data, refetch, isLoading, isError, error } = useAuthSessions();

    useRefreshOnFocus(refetch);

    // Refetch when app returns to foreground (cross-device consistency)
    const appState = useAppState();
    const prevAppStateRef = React.useRef(appState);
    React.useEffect(() => {
      if (prevAppStateRef.current !== 'active' && appState === 'active') {
        refetch();
      }
      prevAppStateRef.current = appState;
    }, [appState, refetch]);

    const [revokingId, setRevokingId] = useState<string | null>(null);

    useFocusEffect(
      useCallback(() => {
        trackEvent(AnalyticsEvent.SessionsScreenViewed, {});
      }, [trackEvent]),
    );

    React.useEffect(() => {
      if (data) {
        trackEvent(AnalyticsEvent.SessionsLoadedSuccess, {
          count: data.result.sessions.length,
        });
      }
    }, [data, trackEvent]);

    React.useEffect(() => {
      if (isError) {
        trackEvent(AnalyticsEvent.SessionsLoadedFailed, {});
      }
    }, [isError, trackEvent]);

    const sessions = useMemo(() => {
      if (!data?.result.sessions) return [];
      return sortSessions(data.result.sessions);
    }, [data]);

    const handleRevoke = useCallback(
      (session: ApiAuthSession) => {
        trackEvent(AnalyticsEvent.SessionRevokeTapped, {
          sessionId: session.id,
        });

        Alert.alert(
          'Revoke session',
          "If you don't recognize this session, revoke it. The device will be signed out.",
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Revoke',
              style: 'destructive',
              onPress: async () => {
                trackEvent(AnalyticsEvent.SessionRevokeConfirmed, {
                  sessionId: session.id,
                });

                setRevokingId(session.id);
                try {
                  await revokeAuthSession({ id: session.id });
                  trackEvent(AnalyticsEvent.SessionRevokeSuccess, {
                    sessionId: session.id,
                  });
                  toast.show('Session revoked', { placement: 'top' });
                } catch {
                  trackEvent(AnalyticsEvent.SessionRevokeFailed, {
                    sessionId: session.id,
                  });
                  toast.show('Failed to revoke session', {
                    placement: 'top',
                    type: 'danger',
                  });
                } finally {
                  setRevokingId(null);
                }
              },
            },
          ],
        );
      },
      [revokeAuthSession, trackEvent, toast],
    );

    const renderItem = useCallback<ListRenderItem<ApiAuthSession>>(
      ({ item, index }) => (
        <SessionItem
          session={item}
          isFirst={index === 0}
          isLast={index === sessions.length - 1}
          onRevoke={handleRevoke}
          isRevoking={revokingId === item.id}
          isAnyRevoking={revokingId !== null}
        />
      ),
      [sessions.length, handleRevoke, revokingId],
    );

    if (isLoading) {
      return (
        <View style={[t.flexGrow, t.justifyCenter, t.itemsCenter]}>
          <ActivityIndicator size="large" color={t.colors.loadingIndicator} />
        </View>
      );
    }

    if (isError) {
      const is401 = isHandledFetchError(error) && error.status === 401;
      return (
        <Empty
          message={is401 ? 'Session expired' : 'Could not load sessions'}
          subMessage={
            is401
              ? 'Your session has expired. Please sign in again.'
              : 'Something went wrong. Please try again.'
          }
          refresh={is401 ? signOut : refetch}
        />
      );
    }

    if (sessions.length === 0) {
      return (
        <Empty
          message="No active sessions found"
          icon={
            <Shield
              size={48}
              color={t.colors.text.secondary}
              strokeWidth={1.5}
            />
          }
        />
      );
    }

    return (
      <FlatList
        data={sessions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          ...t.pX3,
          ...t.pB3,
          ...t.pT2,
        }}
      />
    );
  },
);

function SessionItem({
  session,
  isFirst,
  isLast,
  onRevoke,
  isRevoking,
  isAnyRevoking,
}: {
  session: ApiAuthSession;
  isFirst: boolean;
  isLast: boolean;
  onRevoke: (session: ApiAuthSession) => void;
  isRevoking: boolean;
  isAnyRevoking: boolean;
}) {
  const t = useTheme();

  const rawDeviceLabel = parseUserAgent(session.userAgent);
  const deviceLabel =
    session.current && rawDeviceLabel === 'Unknown device'
      ? 'This device'
      : rawDeviceLabel;
  const dateLabel = formatSessionDate(session.createdAt);
  const countryLabel = formatCountryCode(session.country);
  const appVersion = extractAppVersion(session.userAgent);

  const secondaryParts: string[] = [];
  if (countryLabel) secondaryParts.push(countryLabel);
  if (dateLabel) secondaryParts.push(dateLabel);
  if (appVersion) secondaryParts.push(appVersion);
  const secondaryText = secondaryParts.join(' \u00B7 ');

  return (
    <AnimatedPressable
      style={[
        t.p4,
        t.flexRow,
        t.justifyBetween,
        t.itemsCenter,
        {
          gap: 12,
          borderTopLeftRadius: isFirst ? 16 : 0,
          borderTopRightRadius: isFirst ? 16 : 0,
          borderBottomLeftRadius: isLast ? 16 : 0,
          borderBottomRightRadius: isLast ? 16 : 0,
        },
        isFirst ? [] : [t.borderT, t.borderBackground],
      ]}
      onPress={session.current ? undefined : () => onRevoke(session)}
      disabled={session.current || isAnyRevoking}
      color="lightGray"
    >
      <View style={[t.flexRow, t.itemsCenter, { gap: 12, flex: 1 }]}>
        <View
          style={[
            t.itemsCenter,
            t.justifyCenter,
            {
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: session.current
                ? t.colors.text.brand + '15'
                : t.colors.background.tertiary,
            },
          ]}
        >
          {session.current ? (
            <ShieldAlert size={20} color={t.colors.text.brand} />
          ) : (
            <Smartphone size={20} color={t.colors.text.secondary} />
          )}
        </View>
        <View style={[{ flex: 1 }]}>
          <View style={[t.flexRow, t.itemsCenter, { gap: 6 }]}>
            <Text2 weight="semibold" numberOfLines={1} style={[{ flex: 1 }]}>
              {deviceLabel}
            </Text2>
            {session.current && (
              <View
                style={[
                  {
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 6,
                    backgroundColor: t.colors.text.brand + '20',
                  },
                ]}
              >
                <Text2 size="xs" color="brand" weight="semibold">
                  Current
                </Text2>
              </View>
            )}
          </View>
          {secondaryText !== '' && (
            <Text2 color="secondary" size="sm" numberOfLines={1}>
              {secondaryText}
            </Text2>
          )}
        </View>
      </View>

      {!session.current && (
        <View style={[t.flexNone]}>
          {isRevoking ? (
            <ActivityIndicator size="small" color={t.colors.text.secondary} />
          ) : (
            <Text2 color="danger" size="sm" weight="semibold">
              Revoke
            </Text2>
          )}
        </View>
      )}
    </AnimatedPressable>
  );
}

SessionsScreen.displayName = 'SessionsScreen';

export { SessionsScreen };
