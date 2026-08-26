import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  dismissBrowser,
  openBrowserAsync,
  WebBrowserPresentationStyle,
} from 'expo-web-browser';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiConnectedAccount } from 'farcaster-client-data';
import {
  useConnectedAccountsWithRefreshOnMount,
  useGetXAuthLink,
  useInvalidateConnectedAccounts,
  useInvalidateUser,
  useInvalidateUserByFid,
  useRemoveConnectedAccount,
} from 'farcaster-client-hooks';
import React from 'react';
import { Alert, Linking, Platform, View } from 'react-native';

import { ButtonV2 } from '~/components/ButtonV2';
import { XTopHatIcon } from '~/components/images/XTopHatIcon';
import { buildScreen } from '~/components/Screen';
import { Text, Text2 } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { useHaptics } from '~/hooks/useHaptics';
import { CommonStackParamList } from '~/types';

type ConnectedAccountsScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'ConnectedAccounts'
>;

const ConnectedAccountsScreen = buildScreen<ConnectedAccountsScreenProps>(
  { name: 'ConnectedAccounts' },
  ({ route: { params } }) => {
    const t = useTheme();

    const { fid: currentUserFid } = useCurrentUser_UNSAFE();

    const { data, refetch } = useConnectedAccountsWithRefreshOnMount();

    const invalidateConnectedAccounts = useInvalidateConnectedAccounts();
    const invalidateUser = useInvalidateUser();
    const invalidateUserByFid = useInvalidateUserByFid();

    const connectedAccounts = React.useMemo(
      () => data?.pages.flatMap((page) => page.result.accounts) || [],
      [data],
    );

    const connectedXAccount = React.useMemo(() => {
      return connectedAccounts.find(({ platform }) => platform === 'x');
    }, [connectedAccounts]);

    const { trackEvent } = useAnalytics();
    const { triggerImpactAsync } = useHaptics();

    const getXAuthLink = useGetXAuthLink();

    const onConnectPress = React.useCallback(async () => {
      triggerImpactAsync();

      trackEvent(AnalyticsEvent.SendUserToXToAuth, {
        via: 'socials settings',
      });

      const { result } = await getXAuthLink();

      if (Platform.OS === 'android') {
        Linking.openURL(result.url);
      } else {
        await openBrowserAsync(result.url, {
          dismissButtonStyle: 'done',
          readerMode: false,
          presentationStyle: WebBrowserPresentationStyle.POPOVER,
        });

        refetch();
      }
    }, [getXAuthLink, refetch, trackEvent, triggerImpactAsync]);

    const body = React.useMemo(() => {
      if (typeof connectedXAccount === 'undefined') {
        return (
          <View
            style={[
              t.flex,
              t.flexRow,
              t.itemsCenter,
              t.justifyBetween,
              t.borderDefault,
              t.borderBHairline,
              t.roundedLg,
              t.pY3,
              t.mX3,
            ]}
          >
            <View style={[t.flex, t.flexRow, t.itemsCenter]}>
              <XTopHatIcon
                size={14}
                color={t.colors.text.light}
                style={[t.mR2, t.bgBlack, t.roundedFull, t.p2]}
              />
              <Text style={[t.texts.primary, t.fontSemibold]}>
                X{' '}
                <Text style={[t.texts.secondary, t.fontNormal]}>
                  (formerly Twitter)
                </Text>
              </Text>
            </View>
            <ButtonV2
              title="Connect"
              variant="primary"
              height="sm"
              onPress={onConnectPress}
            />
          </View>
        );
      }

      return <ConnectedAccount connectedAccount={connectedXAccount} />;
    }, [
      connectedXAccount,
      onConnectPress,
      t.bgBlack,
      t.borderBHairline,
      t.borderDefault,
      t.colors.text.light,
      t.flex,
      t.flexRow,
      t.fontNormal,
      t.fontSemibold,
      t.itemsCenter,
      t.justifyBetween,
      t.mR2,
      t.mX3,
      t.p2,
      t.pY3,
      t.roundedFull,
      t.roundedLg,
      t.texts.primary,
      t.texts.secondary,
    ]);

    React.useEffect(() => {
      if (params.success) {
        if (Platform.OS === 'ios') {
          dismissBrowser();
        }

        invalidateConnectedAccounts();
        invalidateUser({ fid: currentUserFid });
        invalidateUserByFid({ fid: currentUserFid });
      }
    }, [
      currentUserFid,
      invalidateConnectedAccounts,
      invalidateUser,
      invalidateUserByFid,
      params.success,
    ]);

    return (
      <View style={[t.hFull, t.wFull]}>
        <Text2 color="secondary" size="base" style={[t.pX3, t.mY3]}>
          Verify your X account to display it on your profile.
        </Text2>
        <View style={[t.justifyBetween, t.hFull, t.wFull]}>{body}</View>
      </View>
    );
  },
);

ConnectedAccountsScreen.displayName = 'ConnectedAccountsScreen';

type ConnectedAccountProps = {
  connectedAccount: ApiConnectedAccount;
};

const ConnectedAccount: React.FC<ConnectedAccountProps> = React.memo(
  ({ connectedAccount }) => {
    const t = useTheme();

    const { fid: currentUserFid } = useCurrentUser_UNSAFE();

    const { trackEvent } = useAnalytics();

    const [isDisconnecting, setIsDisconnecting] =
      React.useState<boolean>(false);

    const removeConnectedAccount = useRemoveConnectedAccount();

    const remove = React.useCallback(async () => {
      trackEvent(AnalyticsEvent.PressDisconnectXAccount, {});

      setIsDisconnecting(true);

      await removeConnectedAccount({
        fid: currentUserFid,
        connectedAccountId: connectedAccount.connectedAccountId,
      });

      setIsDisconnecting(false);
    }, [
      connectedAccount.connectedAccountId,
      currentUserFid,
      removeConnectedAccount,
      trackEvent,
    ]);

    const onRemovePress = React.useCallback(() => {
      Alert.alert(
        'Are you sure you want to disconnect this account?',
        undefined,
        [
          {
            text: 'Disconnect',
            style: 'destructive',
            onPress: remove,
          },
          {
            text: 'Cancel',
          },
        ],
      );
    }, [remove]);

    return (
      <View
        style={[
          t.flex,
          t.flexRow,
          t.itemsCenter,
          t.justifyBetween,
          t.borderDefault,
          t.borderBHairline,
          t.pY3,
          t.mX3,
        ]}
      >
        <View style={[t.flex, t.flexRow, t.itemsCenter]}>
          <XTopHatIcon
            size={14}
            color={t.colors.text.light}
            style={[t.mR2, t.bgBlack, t.roundedFull, t.p2]}
          />
          <Text style={[t.texts.primary, t.fontSemibold]}>
            {connectedAccount.username}
          </Text>
        </View>
        <ButtonV2
          title="Disconnect"
          variant="tertiary"
          height="sm"
          onPress={onRemovePress}
          loading={isDisconnecting}
        />
      </View>
    );
  },
);

export { ConnectedAccountsScreen };
