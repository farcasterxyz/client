import {
  openBrowserAsync,
  WebBrowserPresentationStyle,
} from 'expo-web-browser';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUser } from 'farcaster-client-data';
import { useConnectedAccounts, useGetXAuthLink } from 'farcaster-client-hooks';
import React from 'react';
import { Linking, Platform, Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Path, Svg } from 'react-native-svg';

import { Text2 } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { useHaptics } from '~/hooks/useHaptics';

type ConnectedAccountsSectionProps = {
  user: ApiUser;
};

const ConnectedAccountsSection: React.FC<ConnectedAccountsSectionProps> = ({
  user,
}) => {
  const { fid: currentUserFid } = useCurrentUser_UNSAFE();

  return (
    <React.Suspense>
      {currentUserFid === user.fid ? (
        <ConnectedAccountsSelf user={user} />
      ) : (
        <ConnectedAccounts user={user} />
      )}
    </React.Suspense>
  );
};

ConnectedAccountsSection.displayName = 'ConnectedAccountsSection';

const ConnectedAccountsSelf: React.FC<ConnectedAccountsSectionProps> = ({
  user: _,
}) => {
  const t = useTheme();
  const { trackEvent } = useAnalytics();
  const { triggerImpactAsync } = useHaptics();
  const navigate = useNavigate();

  const { data } = useConnectedAccounts();

  const getXAuthLink = useGetXAuthLink();

  const connectedAccounts = React.useMemo(() => {
    return data!.pages.flatMap((o) => o.result.accounts);
  }, [data]);

  const connectedXAccount = React.useMemo(() => {
    return connectedAccounts.find(({ platform }) => platform === 'x');
  }, [connectedAccounts]);

  const onConnectPress = React.useCallback(async () => {
    triggerImpactAsync();

    trackEvent(AnalyticsEvent.SendUserToXToAuth, {
      via: 'user profile',
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

      navigate('ConnectedAccounts', { success: true });
    }
  }, [getXAuthLink, navigate, trackEvent, triggerImpactAsync]);

  const onAlreadyConnectedPress = React.useCallback(async () => {
    navigate('ConnectedAccounts', { success: false });
  }, [navigate]);

  const scale = useSharedValue(1);

  // Animated style that uses the shared scale value
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  if (typeof connectedXAccount === 'undefined') {
    return (
      <Animated.View
        style={[t.flex, t.flexCol, t.relative, animatedStyle]}
        onTouchStart={() => {
          scale.value = withSpring(0.9);
        }}
        onTouchEnd={() => {
          scale.value = withSpring(1);
        }}
      >
        <Pressable
          style={[t.inset0, t.wFull, t.itemsCenter, t.justifyCenter]}
          onPress={onConnectPress}
        >
          <View style={[t.itemsCenter, t.justifyCenter, t.flexRow, { gap: 4 }]}>
            <Svg
              width="12"
              height="12"
              viewBox="0 0 14 14"
              fill="none"
              style={{ marginTop: 1.25 }}
            >
              <Path
                d="M10.6489 1.33008H12.5761L8.34476 6.14791L13.2883 12.6834H9.40887L6.37154 8.71184L2.89432 12.6834H0.967186L5.44987 7.53042L0.71582 1.33008H4.69158L7.43565 4.95812L10.6489 1.33008ZM9.97444 11.5523H11.0427L4.1302 2.41933H2.9823L9.97444 11.5523Z"
                fill={t.colors.text.secondary}
              />
            </Svg>
            <Text2 color="secondary" size="sm" weight="regular">
              Connect
            </Text2>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[t.h5, t.flex, t.flexCol, t.relative, animatedStyle]}
      onTouchStart={() => {
        scale.value = withSpring(0.9);
      }}
      onTouchEnd={() => {
        scale.value = withSpring(1);
      }}
    >
      <Pressable
        style={[t.inset0, t.wFull, t.itemsCenter, t.justifyCenter]}
        onPress={onAlreadyConnectedPress}
      >
        <View style={[t.justifyCenter, t.flexRow, t.itemsCenter, { gap: 4 }]}>
          <Svg
            width="12"
            height="12"
            viewBox="0 0 14 14"
            fill="none"
            style={{ marginTop: 1.25 }}
          >
            <Path
              d="M10.6489 1.33008H12.5761L8.34476 6.14791L13.2883 12.6834H9.40887L6.37154 8.71184L2.89432 12.6834H0.967186L5.44987 7.53042L0.71582 1.33008H4.69158L7.43565 4.95812L10.6489 1.33008ZM9.97444 11.5523H11.0427L4.1302 2.41933H2.9823L9.97444 11.5523Z"
              fill={t.colors.text.secondary}
            />
          </Svg>
          <Text2 color="secondary" size="sm" weight="regular">
            {connectedXAccount.username}
          </Text2>
        </View>
      </Pressable>
    </Animated.View>
  );
};

ConnectedAccountsSelf.displayName = 'ConnectedAccountsSelf';

const ConnectedAccounts: React.FC<ConnectedAccountsSectionProps> = ({
  user,
}) => {
  const t = useTheme();
  const { trackEvent } = useAnalytics();

  const connectedAccounts = React.useMemo(() => {
    return user.connectedAccounts || [];
  }, [user.connectedAccounts]);

  const connectedXAccount = React.useMemo(() => {
    return connectedAccounts.find(({ platform }) => platform === 'x');
  }, [connectedAccounts]);

  const onAlreadyConnectedPress = React.useCallback(async () => {
    if (typeof connectedXAccount === 'undefined') {
      return;
    }

    trackEvent(AnalyticsEvent.PressUserProfileXAccount, {});

    Linking.openURL(`https://x.com/${connectedXAccount.username}`);
  }, [connectedXAccount, trackEvent]);

  const scale = useSharedValue(1);

  // Animated style that uses the shared scale value
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  if (typeof connectedXAccount === 'undefined') {
    return null;
  }

  return (
    <Animated.View
      style={[t.h5, t.flex, t.flexCol, t.relative, animatedStyle]}
      onTouchStart={() => {
        scale.value = withSpring(0.9);
      }}
      onTouchEnd={() => {
        scale.value = withSpring(1);
      }}
    >
      <Pressable
        style={[t.inset0, t.wFull, t.itemsCenter, t.justifyCenter]}
        onPress={onAlreadyConnectedPress}
      >
        <View style={[t.itemsCenter, t.justifyCenter, t.flexRow, { gap: 4 }]}>
          <Svg
            width="12"
            height="12"
            viewBox="0 0 14 14"
            fill="none"
            style={{ marginTop: 1.25 }}
          >
            <Path
              d="M10.6489 1.33008H12.5761L8.34476 6.14791L13.2883 12.6834H9.40887L6.37154 8.71184L2.89432 12.6834H0.967186L5.44987 7.53042L0.71582 1.33008H4.69158L7.43565 4.95812L10.6489 1.33008ZM9.97444 11.5523H11.0427L4.1302 2.41933H2.9823L9.97444 11.5523Z"
              fill={t.colors.text.secondary}
            />
          </Svg>
          <Text2 color="secondary" size="sm" weight="regular">
            {connectedXAccount.username}
          </Text2>
        </View>
      </Pressable>
    </Animated.View>
  );
};

export { ConnectedAccountsSection };
