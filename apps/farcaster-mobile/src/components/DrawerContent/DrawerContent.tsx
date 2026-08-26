import { DrawerNavigationProp } from '@react-navigation/drawer';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { resolveUsername } from 'farcaster-client-hooks';
import { getStoredPasskeys, isPasskeysSupported } from 'farcaster-cryptography';
import { Pill } from 'farcaster-expo';
import {
  Bookmark,
  LogOutIcon,
  Megaphone,
  Mic,
  QrCodeIcon,
  SettingsIcon,
  Sparkle,
  UserPlusIcon,
} from 'lucide-react-native';
import { memo, useCallback, useMemo } from 'react';
import { Alert, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '~/components/Avatar';
import { Divider } from '~/components/Divider';
import { DrawerItem } from '~/components/DrawerContent/DrawerItem';
import { useDrawerTouchablePress } from '~/components/DrawerContent/drawerPressHandlers';
import { Text2 } from '~/components/Text';
import { topBarHeight } from '~/components/TopBar';
import { miniAppBarHeight } from '~/constants/MiniApp';
import { userProfileQRCodePromptKey } from '~/constants/Storage';
import { useAuthToken } from '~/contexts/AuthTokenProvider';
import { useBottomTab } from '~/contexts/BottomTabProvider';
import { SWIPE_EDGE_WIDTH, useDrawer } from '~/contexts/DrawerProvider';
import { useFarcasterCryptographyKeyStore } from '~/contexts/FarcasterCryptographyKeyStoreProvider';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { useMinimizedMiniApp } from '~/contexts/MinimizedMiniAppProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useWallet } from '~/contexts/WalletProvider';
import { useGloballyCachedCurrentUser } from '~/hooks/data/useGloballyCachedCurrentUser';
import { useUnmediatedNavigate } from '~/hooks/navigation/methods/navigate';
import { useNavigateToNestedScreen } from '~/hooks/navigation/useNavigateToNestedScreen';
import { useNavigateToUserProfile } from '~/hooks/navigation/useNavigateToUserProfile';
import { useUserAppContextGate } from '~/hooks/useUserAppContextGate';
import { useXPNewEntrypoint } from '~/hooks/useXPNewEntrypoint';
import { DrawerParamList } from '~/types/navigation';

import { DrawerFeedsFavorites } from './DrawerFeedsFavorites';

function LogOutDrawerItem() {
  const t = useTheme();
  const { address } = useWallet();
  const { signOut } = useAuthToken();
  const { keyStore } = useFarcasterCryptographyKeyStore();

  const handleLogOut = useCallback(async () => {
    const shouldPromptToLogout = await (async () => {
      try {
        const isSupported = await isPasskeysSupported({ keyStore });

        if (!isSupported) {
          return true;
        }

        const storedPasskeys = await getStoredPasskeys({ keyStore });
        const hasOtherAccountPasskeys =
          storedPasskeys.filter((passkey) => passkey.address !== address)
            .length > 0;

        return !hasOtherAccountPasskeys;
      } catch {
        return true;
      }
    })();

    if (shouldPromptToLogout) {
      return Alert.alert(
        'Warning!',
        'Please ensure you have your recovery phrase backed up, otherwise you will lose access to your Farcaster username.',
        [
          {
            text: 'Log out',
            style: 'destructive',
            onPress: async () => {
              signOut({ reason: 'user_initiated' });
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ],
      );
    } else {
      signOut({ reason: 'user_initiated' });
    }
  }, [address, keyStore, signOut]);

  const logOutPressProps = useDrawerTouchablePress(handleLogOut);

  return (
    <TouchableOpacity
      style={[t.flexRow, t.itemsCenter, t.mB3, t.gap2, { paddingLeft: 18 }]}
      {...logOutPressProps}
      activeOpacity={0.7}
    >
      <View style={[t.flexRow, t.itemsCenter, t.justifyCenter, t.w6, t.h6]}>
        <LogOutIcon size={20} color={t.colors.text.primary} />
      </View>
      <Text2 color="primary" size="base" weight="regular">
        Log Out
      </Text2>
    </TouchableOpacity>
  );
}

export const InnerDrawerContent = memo(() => {
  const t = useTheme();

  const insets = useSafeAreaInsets();

  const styleRootView = useMemo(
    () => [t.absolute, t.top0, t.left0, t.right0, t.bottom0, t.justifyBetween],
    [t],
  );

  return useMemo(() => {
    const content = (
      <>
        <SwipeEnabledHandle />
        <View
          style={[
            t.flexCol,
            t.hFull,
            { paddingTop: insets.top, paddingBottom: insets.bottom },
            t.dark && t.borderRHairline,
            t.dark && t.borders.primary,
          ]}
        >
          <HeaderWithNameAndSettingsIcons />
          <View style={[t.flexCol, t.flex1, t.bgDefault]}>
            <MainMenu />
            <Divider marginVertical="none" />
            <DrawerFeedsFavorites />
            <View style={[t.flexCol, t.justifyEnd, t.pT4, t.gap4]}>
              <LogOutDrawerItem />
            </View>
          </View>
        </View>
      </>
    );

    if (t.dark) {
      return <View style={[styleRootView, t.bgDefault]}>{content}</View>;
    }

    return (
      <LinearGradient
        colors={['#FAFAFA', '#FAFAFA', 'white', 'white']}
        locations={[0, 0.6, 0.6, 1]}
        style={styleRootView}
      >
        {content}
      </LinearGradient>
    );
  }, [
    insets.bottom,
    insets.top,
    styleRootView,
    t.bgDefault,
    t.borderRHairline,
    t.borders.primary,
    t.dark,
    t.flex1,
    t.flexCol,
    t.hFull,
    t.justifyEnd,
    t.pT4,
    t.gap4,
  ]);
});

const SwipeEnabledHandle = memo(() => {
  const t = useTheme();

  const { swipeEnabled } = useDrawer();
  const insets = useSafeAreaInsets();

  const { bottomTabBarHeight } = useBottomTab();
  const { minimizedMiniApp } = useMinimizedMiniApp();
  const dockedMiniAppHeight = minimizedMiniApp ? miniAppBarHeight : 0;
  const height = bottomTabBarHeight + dockedMiniAppHeight;

  if (!swipeEnabled) {
    return null;
  }

  return (
    <View
      style={[
        t.absolute,
        {
          top: topBarHeight,
          bottom: height - insets.bottom,
          right: -SWIPE_EDGE_WIDTH,
          width: SWIPE_EDGE_WIDTH,
        },
      ]}
      pointerEvents="box-none"
    />
  );
});

const HeaderWithNameAndSettingsIcons = memo(() => {
  const currentUser = useGloballyCachedCurrentUser();
  const { displayName, fid, pfp, username } = currentUser;

  const t = useTheme();
  const navigateToUserProfile = useNavigateToUserProfile();

  const { showGlobalPrompt } = useGlobalPrompts();

  const navigation: DrawerNavigationProp<DrawerParamList> = useNavigation();

  const onProfilePress = useCallback(() => {
    navigateToUserProfile({ fid: fid });
  }, [fid, navigateToUserProfile]);

  const profilePressProps = useDrawerTouchablePress(onProfilePress);

  const onQrPress = useCallback(() => {
    navigation.dispatch(DrawerActions.closeDrawer());
    showGlobalPrompt({ key: userProfileQRCodePromptKey });
  }, [navigation, showGlobalPrompt]);

  const qrPressProps = useDrawerTouchablePress(onQrPress);

  return (
    <View style={[t.flexRow, t.itemsCenter, t.pX4, { paddingVertical: 21 }]}>
      <TouchableOpacity
        style={[t.flexRow, t.itemsCenter, t.flexGrow, t.flexShrink]}
        activeOpacity={0.6}
        {...profilePressProps}
      >
        <Avatar pfpUrl={pfp?.url} diameter={48} border={false} />
        <View style={[t.pX2, t.flexGrow, t.flexShrink]}>
          <View style={[t.flex, t.flexRow, t.itemsCenter]}>
            <Text2
              size="lg"
              weight="semibold"
              color="primary"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {displayName}
            </Text2>
          </View>
          <Text2 size="base" weight="medium" color="tertiary">
            {resolveUsername({ username, fid })}
          </Text2>
        </View>
      </TouchableOpacity>
      <View style={[t.flex, t.flexRow, t.itemsCenter, t.justifyEnd]}>
        <TouchableOpacity activeOpacity={0.75} {...qrPressProps}>
          <QrCodeIcon size={24} color={t.colors.text.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const MainMenu = memo(() => {
  const t = useTheme();
  const navigate = useUnmediatedNavigate();
  const navigateToNestedScreen = useNavigateToNestedScreen();

  const { focusedBottomTabRef } = useBottomTab();

  const { xpNewEntrypointSeen } = useXPNewEntrypoint();

  const { checkUserAppContextGate } = useUserAppContextGate();

  const viewerCanAccessReferrals = checkUserAppContextGate('referrals').value;

  const viewerCanAccessCollectibles =
    checkUserAppContextGate('collectibles').value;

  return (
    <View style={[t.pT3, t.pX4, { marginBottom: 10 }, t.flexCol]}>
      {viewerCanAccessReferrals && (
        <DrawerItem
          name="Referrals"
          icon={<UserPlusIcon size={20} color={t.colors.text.primary} />}
          onPress={() => {
            navigate('ReferralsOverview', {});
          }}
          isActive={false}
          rightComp={
            xpNewEntrypointSeen ? null : (
              <Pill variant="active" size="sm">
                New
              </Pill>
            )
          }
        />
      )}
      <DrawerItem
        name="Bookmarks"
        icon={<Bookmark size={20} color={t.colors.text.primary} />}
        onPress={() => {
          navigateToNestedScreen(focusedBottomTabRef.current, 'Bookmarks', {});
        }}
        isActive={false}
      />
      {viewerCanAccessCollectibles && (
        <DrawerItem
          name="Collectibles"
          icon={<Sparkle size={20} color={t.colors.text.primary} />}
          onPress={() => {
            navigateToNestedScreen(
              focusedBottomTabRef.current,
              'ExploreCollectibleCastsScreen',
              {},
            );
          }}
          isActive={false}
        />
      )}
      <DrawerItem
        name="Spaces"
        icon={<Mic size={20} color={t.colors.text.primary} />}
        onPress={() => {
          navigateToNestedScreen(focusedBottomTabRef.current, 'Spaces', {});
        }}
        isActive={false}
      />
      <DrawerItem
        name="Settings"
        icon={<SettingsIcon size={20} color={t.colors.text.primary} />}
        onPress={() => {
          navigate('Settings', {});
        }}
        isActive={false}
      />
      <DrawerItem
        name="Updates"
        icon={<Megaphone size={20} color={t.colors.text.primary} />}
        onPress={() => {
          navigateToNestedScreen(focusedBottomTabRef.current, 'Channel', {
            channelKey: 'fc-updates',
          });
        }}
        isActive={false}
      />
    </View>
  );
});

InnerDrawerContent.displayName = 'InnerDrawerContent';
