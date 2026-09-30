import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import { formatDate } from 'farcaster-client-data';
import { resolveUsername, useConnectedApp } from 'farcaster-client-hooks';
import { ButtonV2, RemoteImage, Text2, useTheme } from 'farcaster-expo';
import React, { useCallback } from 'react';
import { Linking, View } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { TextWithPress } from '~/components/TextWithPress';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { usePush } from '~/hooks/navigation/usePush';
import { useRefreshOnFocus } from '~/hooks/useRefreshOnFocus';
import { CommonStackParamList } from '~/types';

type ConnectedAppScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'ConnectedApp'
>;

const NEYNAR_FID = 6131;
const WARPCAST_FID = 9152;

export const ConnectedAppScreen = buildScreen<ConnectedAppScreenProps>(
  { name: 'ConnectedApp' },
  ({
    route: {
      params: { appFid },
    },
  }) => {
    const t = useTheme();
    const push = usePush();
    const { trackEvent } = useAnalytics();

    const { data, refetch } = useConnectedApp(
      {
        appFid,
      },
      {
        refetchOnMount: true,
      },
    );

    useRefreshOnFocus(refetch);

    useFocusEffect(
      useCallback(() => {
        trackEvent(AnalyticsEvent.ViewConnectedApp, {
          appFid,
          appUsername: data.connectedApp.appUser.username,
        });
      }, [appFid, data.connectedApp.appUser.username, trackEvent]),
    );

    const app = data.connectedApp;
    const hasWritePermission = data.connectedApp.writeKeys.length > 0;
    const hasAuthPermission = data.connectedApp.authKeys.length > 0;
    const isConnected = hasWritePermission || hasAuthPermission;

    const revokeWrite = useCallback(() => {
      push('ConnectedAppRevokeWrite', {
        appFid: app.appUser.fid,
      });
    }, [app.appUser.fid, push]);

    const revokeAuth = useCallback(() => {
      push('ConnectedAppRevokeAuth', {
        appFid: app.appUser.fid,
      });
    }, [app.appUser.fid, push]);

    return (
      <View style={[t.p3]}>
        <View style={[t.pY3, t.flexRow, t.itemsCenter, { gap: 16 }]}>
          <RemoteImage
            uri={app.appUser.pfp?.url}
            height={56}
            width={56}
            style={[{ borderRadius: 12, backgroundColor: 'white' }]}
          />
          <View>
            <Text2 size="lg" weight="semibold">
              {app.appUser.displayName}
            </Text2>
            <Text2 color="secondary">{resolveUsername(app.appUser)}</Text2>
          </View>
        </View>
        {isConnected ? (
          <>
            <View style={[t.pY3]}>
              <View
                style={[
                  t.bgLightGray,
                  {
                    borderRadius: 16,
                    overflow: 'hidden',
                  },
                ]}
              >
                <View style={[t.p4, t.flexRow, t.justifyBetween]}>
                  <Text2 color="secondary">Added</Text2>
                  <Text2>{formatDate(app.connectedAt as number)}</Text2>
                </View>
              </View>
            </View>
            <View style={[t.pY3]}>
              <Text2 color="secondary" size="sm" weight="semibold">
                Permissions
              </Text2>
              <View
                style={[
                  t.bgLightGray,
                  t.mT2,
                  {
                    borderRadius: 16,
                    overflow: 'hidden',
                  },
                ]}
              >
                {hasWritePermission && (
                  <View
                    style={[
                      t.p3,
                      t.flexRow,
                      t.itemsCenter,
                      t.borderB,
                      t.borderBackground,
                      { gap: 12 },
                    ]}
                  >
                    <View style={[t.flex1]}>
                      <Text2 weight="medium">Read and write</Text2>
                      <Text2 color="secondary" size="sm">
                        Update your profile, like, and cast.
                      </Text2>
                      {app.appUser.fid === NEYNAR_FID && (
                        <Text2 color="secondary" size="sm" style={[t.mT2]}>
                          Revoking will remove activity from Neynar apps.
                          Disconnect individual apps at
                          <TextWithPress
                            style={[t.textSm, t.texts.brand]}
                            onPress={() =>
                              Linking.openURL(
                                'https://app.neynar.com/connections',
                              )
                            }
                          >
                            {' '}
                            app.neynar.com/connections
                          </TextWithPress>
                        </Text2>
                      )}
                    </View>
                    {app.appUser.fid !== WARPCAST_FID && (
                      <View style={[t.flexNone]}>
                        <ButtonV2
                          title="Revoke"
                          variant="destructive"
                          height="sm"
                          onPress={revokeWrite}
                        />
                      </View>
                    )}
                  </View>
                )}
                {hasAuthPermission && (
                  <View
                    style={[
                      t.p3,
                      t.borderB,
                      t.borderBackground,
                      t.flexRow,
                      { gap: 12 },
                    ]}
                  >
                    <View style={[t.flex1]}>
                      <Text2 weight="medium">Sign in</Text2>
                      <Text2 color="secondary" size="sm">
                        Sign you into other apps.
                      </Text2>
                    </View>
                    {app.appUser.fid !== WARPCAST_FID && (
                      <View style={[t.flexNone]}>
                        <ButtonV2
                          title="Revoke"
                          variant="destructive"
                          height="sm"
                          onPress={revokeAuth}
                        />
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>
          </>
        ) : (
          <Text2>This app has no permissions.</Text2>
        )}
      </View>
    );
  },
);

ConnectedAppScreen.displayName = 'ConnectedAppScreen';
