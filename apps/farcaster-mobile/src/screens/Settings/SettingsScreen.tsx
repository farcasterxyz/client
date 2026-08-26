import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Updates from 'expo-updates';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ReloadBundleError } from 'farcaster-client-hooks';
import { getStoredPasskeys, isPasskeysSupported } from 'farcaster-cryptography';
import {
  BottomSheetContentContainer,
  BottomSheetHeader,
  BottomSheetModal,
  useBottomSheetModalRef,
  useEmbeddedWallet,
} from 'farcaster-expo';
import {
  Bell,
  CaseLower,
  ChartColumnBig,
  CircleSlash,
  CircleUser,
  Database,
  Fullscreen,
  Globe,
  Info,
  Link2,
  LogOut,
  MessageCircleMore,
  MonitorSmartphone,
  Palette,
  Search,
  Shield,
  SlidersHorizontal,
  Sparkle,
  Star,
  StretchHorizontal,
  Wallet,
  Zap,
} from 'lucide-react-native';
import React, { useMemo } from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';

import { SEARCH_ICON_HEADER_SIZE } from '~/components/FloatingSearch/ZIndexLookup';
import { buildScreen } from '~/components/Screen';
import { ThemeSettings } from '~/components/settings/ThemeSettings';
import { Icon as StarterPacksIcon } from '~/components/StarterPacks/Icon';
import { Text } from '~/components/Text';
import { TextWithPress } from '~/components/TextWithPress';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useAuthToken } from '~/contexts/AuthTokenProvider';
import { useCheckForOverTheAirUpdate } from '~/contexts/CheckForOverTheAirUpdateProvider';
import { useFarcasterCryptographyKeyStore } from '~/contexts/FarcasterCryptographyKeyStoreProvider';
import { useGlobalGate } from '~/contexts/GlobalGateProvider';
import { useInAppPurchases } from '~/contexts/InAppPurchasesProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { EXPO_UPDATE_URL_PREFIX, useVersion } from '~/contexts/VersionProvider';
import { useWallet } from '~/contexts/WalletProvider';
import { useCreateAccountIAPDisabled } from '~/hooks/data/useCreateAccountIAPDisabled';
import { useIsAdmin } from '~/hooks/data/useIsAdmin';
import { useFabricChromeInsetFix } from '~/hooks/navigation/useFabricChromeInsetFix';
import { usePush } from '~/hooks/navigation/usePush';
import { useDevMode } from '~/hooks/useDevMode';
import { useUserAppContextGate } from '~/hooks/useUserAppContextGate';
import { MenuGroup, MenuItems, SimpleMenu } from '~/screens/Debug/MenuItem';
import { CommonStackParamList } from '~/types';
import { trackError } from '~/utils/ErrorUtils';

import { BrowserSettings } from './BrowserSettings';

type SettingsScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'Settings'
>;

const SettingsScreen = buildScreen<SettingsScreenProps>(
  { name: 'Settings', insetTabBarBgColor: true },
  () => {
    const t = useTheme();
    const push = usePush();
    const { address } = useWallet();
    const { signOut } = useAuthToken();
    const { devMode } = useDevMode();
    const { trackEvent } = useAnalytics();
    const fabricInset = useFabricChromeInsetFix();

    const {
      nativeApplicationVersion,
      nativeBuildVersion,
      releaseChannel,
      updateId,
    } = useVersion();

    const createdAt = Updates.createdAt?.toISOString();

    const isAdmin = useIsAdmin();
    const { hasDownloadedUpdate, supportsRestart } =
      useCheckForOverTheAirUpdate();
    const { keyStore } = useFarcasterCryptographyKeyStore();
    const { disabled: createAccountIAPServerDisabled } =
      useCreateAccountIAPDisabled();

    const { checkGate } = useGlobalGate();

    const { value: debugMenuAccess } = checkGate('mobile_debug_menu_access');

    const { checkUserAppContextGate } = useUserAppContextGate();

    const fullSettingsAvailable =
      checkUserAppContextGate('full-settings').value;

    const collectibleCastsAvailable =
      checkUserAppContextGate('collectibles').value;

    const { evmAddress } = useEmbeddedWallet();
    const { restorePurchases } = useInAppPurchases();

    React.useEffect(() => {
      trackEvent(AnalyticsEvent.ViewSettings, {});
    }, [trackEvent]);

    const bottomSheetModalRef = useBottomSheetModalRef();
    const browserBottomSheetModalRef = useBottomSheetModalRef();

    const menuItems: MenuItems = useMemo(() => {
      const items: MenuItems = [];

      if (!fullSettingsAvailable) {
        return [
          {
            name: 'Advanced',
            icon: <SlidersHorizontal size={20} color={t.colors.text.primary} />,
            onPress: () => {
              push('Advanced', {
                section: undefined,
              });
            },
          },
          {
            name: 'Block and mutes',
            icon: <CircleSlash size={20} color={t.colors.text.primary} />,
            onPress: () => {
              push('MutesAndBlocks', {});
            },
          },
          {
            name: 'Manage Account',
            icon: <CircleUser size={20} color={t.colors.text.primary} />,

            onPress: () => {
              push('Advanced', {
                section: undefined,
              });
            },
          },
          {
            name: 'Support',
            icon: <Info size={20} color={t.colors.text.primary} />,
            onPress: () => {
              Linking.openURL('https://farcaster.xyz/~/support');
            },
          },
        ];
      }

      const accountGroup: MenuGroup = {
        title: 'Profile and account',
        items: [],
      };

      accountGroup.items.push({
        name: 'Social Profiles',
        icon: <CircleUser size={20} color={t.colors.text.primary} />,
        onPress: () => {
          push('ProfilesFromX', {});
        },
      });

      accountGroup.items.push({
        name: 'Notifications',
        icon: <Bell size={20} color={t.colors.text.primary} />,
        onPress: () => {
          push('NotificationSettings', {});
        },
      });

      accountGroup.items.push({
        name: 'Direct Casts',
        icon: <MessageCircleMore size={20} color={t.colors.text.primary} />,
        onPress: () => {
          push('DirectCastSettings', {});
        },
      });

      accountGroup.items.push({
        name: 'Feeds',
        icon: <StretchHorizontal size={20} color={t.colors.text.primary} />,
        onPress: () => {
          push('Feeds', {});
        },
      });

      accountGroup.items.push({
        name: 'Advanced',
        icon: <SlidersHorizontal size={20} color={t.colors.text.primary} />,

        onPress: () => {
          push('Advanced', {
            section: undefined,
          });
        },
      });

      accountGroup.items.push({
        name: 'Sessions',
        icon: <Shield size={20} color={t.colors.text.primary} />,
        onPress: () => {
          push('Sessions', {});
        },
      });

      accountGroup.items.push({
        name: 'Block and mutes',
        icon: <CircleSlash size={20} color={t.colors.text.primary} />,
        onPress: () => {
          push('MutesAndBlocks', {});
        },
      });

      items.push(accountGroup);

      const walletGroup: MenuGroup = {
        title: 'Wallet and collectibles',
        items: [],
      };

      walletGroup.items.push({
        name: 'Preferred wallet',
        icon: <Star size={20} color={t.colors.text.primary} />,
        onPress: () => {
          push('PreferredWallet', {});
        },
      });

      if (evmAddress) {
        walletGroup.items.push({
          name: 'Farcaster Wallet',
          icon: <Wallet size={20} color={t.colors.text.primary} />,
          onPress: () => {
            push('WalletSettings', {});
          },
        });
      }

      walletGroup.items.push({
        name: 'Verified Addresses',
        icon: <Link2 size={20} color={t.colors.text.primary} />,
        onPress: () => {
          push('ConnectedAddresses', {});
        },
      });

      if (collectibleCastsAvailable) {
        walletGroup.items.push({
          name: 'Collectibles',
          icon: <Sparkle size={20} color={t.colors.text.primary} />,
          onPress: () => {
            push('CollectibleCastsSettings', {});
          },
        });
      }

      walletGroup.items.push({
        name: 'Trade Alerts',
        icon: <Bell size={20} color={t.colors.text.primary} />,
        onPress: () => {
          push('WalletAlertsSettings', {});
        },
      });

      items.push(walletGroup);

      const deviceGroup: MenuGroup = {
        title: 'Devices and storage',
        items: [],
      };

      deviceGroup.items.push({
        name: 'My devices',
        icon: <MonitorSmartphone size={20} color={t.colors.text.primary} />,
        onPress: () => {
          push('MyDevices', {});
        },
      });

      if (!createAccountIAPServerDisabled) {
        deviceGroup.items.push({
          name: 'Storage',
          icon: <Database size={20} color={t.colors.text.primary} />,
          onPress: () => {
            push('Storage', {});
          },
        });
      }

      deviceGroup.items.push({
        name: 'Data usage',
        icon: <ChartColumnBig size={20} color={t.colors.text.primary} />,
        onPress: () => {
          push('DataUsage', {});
        },
      });

      items.push(deviceGroup);

      if (devMode) {
        const developerGroup: MenuGroup = {
          title: 'Developer',
          items: [],
        };

        developerGroup.items.push({
          name: 'Preview Tool',
          icon: <Fullscreen size={20} color={t.colors.text.primary} />,
          onPress: () => {
            push('DevToolsPreviewMiniAppUrl', {});
          },
        });

        developerGroup.items.push({
          name: 'Snap Emulator',
          icon: <Zap size={20} color={t.colors.text.primary} />,
          onPress: () => {
            push('DevToolsSnapEmulator', {});
          },
        });

        developerGroup.items.push({
          name: 'Domains',
          icon: <CaseLower size={20} color={t.colors.text.primary} />,
          onPress: () => {
            push('DevToolsDomains', {});
          },
        });

        items.push(developerGroup);
      }

      const otherGroup: MenuGroup = {
        title: 'Other',
        items: [],
      };

      otherGroup.items.push({
        name: 'Trade Ideas',
        icon: (
          <Search
            size={SEARCH_ICON_HEADER_SIZE}
            color={t.colors.text.primary}
          />
        ),
        onPress: () => {
          push('TradeIdeasSettings', {});
        },
      });

      otherGroup.items.push({
        name: 'Theme',
        icon: <Palette size={20} color={t.colors.text.primary} />,
        onPress: () => {
          trackEvent(AnalyticsEvent.ThemeSettingsView, {});
          bottomSheetModalRef.current?.present();
        },
      });

      otherGroup.items.push({
        name: 'Browser',
        icon: <Globe size={20} color={t.colors.text.primary} />,
        onPress: () => {
          browserBottomSheetModalRef.current?.present();
        },
      });

      otherGroup.items.push({
        name: 'Starter Packs',
        icon: <StarterPacksIcon size={20} color={t.colors.text.primary} />,
        onPress: () => {
          push('StarterPacks', {});
        },
      });

      if (Platform.OS === 'ios') {
        otherGroup.items.push({
          name: 'Restore Purchases',
          icon: <Wallet size={20} color={t.colors.text.primary} />,
          onPress: async () => {
            try {
              await restorePurchases();
              Alert.alert(
                'Restore started',
                'If you had eligible purchases, they have been restored.',
              );
            } catch (error) {
              trackError(error);
              Alert.alert(
                'Unable to restore purchases',
                'Please try again later.',
              );
            }
          },
        });
      }

      otherGroup.items.push({
        name: 'Support',
        icon: <Info size={20} color={t.colors.text.primary} />,
        onPress: () => {
          Linking.openURL('https://farcaster.xyz/~/support');
        },
      });

      otherGroup.items.push({
        name: 'Log out',
        icon: <LogOut size={20} color={t.colors.text.primary} />,
        onPress: async () => {
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
        },
      });

      items.push(otherGroup);

      return items;
    }, [
      address,
      bottomSheetModalRef,
      browserBottomSheetModalRef,
      collectibleCastsAvailable,
      createAccountIAPServerDisabled,
      devMode,
      evmAddress,
      fullSettingsAvailable,
      keyStore,
      push,
      restorePurchases,
      signOut,
      t.colors.text.primary,
      trackEvent,
    ]);

    return (
      <>
        <View style={[t.hFull, t.flexCol, t.justifyBetween]}>
          <ScrollView
            style={[t.flex1]}
            contentContainerStyle={{
              padding: 12,
              paddingTop: 12 + fabricInset.paddingTop,
            }}
          >
            <SimpleMenu
              items={menuItems}
              analyticsEvent={AnalyticsEvent.ViewSettings}
            />
          </ScrollView>
          <Pressable
            style={[t.p4, t.borderDefault, t.borderTHairline]}
            onLongPress={() => {
              if (debugMenuAccess) {
                push('DebugMenu', {});
              }
            }}
          >
            <View style={[t.flexRow, t.itemsCenter]}>
              <View style={[t.flexCol, { gap: 2 }]}>
                <Text style={[t.texts.tertiary, t.textSm]}>
                  Build v{nativeApplicationVersion} ({nativeBuildVersion})
                  {isAdmin && releaseChannel ? ` ${releaseChannel}` : ''}
                </Text>
                {isAdmin && createdAt && (
                  <Text style={[t.texts.tertiary, t.textSm]}>
                    Update created at: {createdAt}
                  </Text>
                )}
                {isAdmin && updateId && (
                  <View style={[t.flexRow, t.itemsCenter, { gap: 2 }]}>
                    <Text style={[t.texts.tertiary, t.textSm]}>Update id:</Text>
                    <TextWithPress
                      style={[t.textSm, t.texts.brand]}
                      onPress={() => {
                        Linking.openURL(`${EXPO_UPDATE_URL_PREFIX}${updateId}`);
                      }}
                    >
                      {updateId}
                    </TextWithPress>
                  </View>
                )}
                {hasDownloadedUpdate && supportsRestart && (
                  <TextWithPress
                    style={[t.textSm, t.texts.brand]}
                    onPress={async () => {
                      try {
                        // Unbelievably, the await _really_ matters here, so don't remove it.
                        await Updates.reloadAsync();
                      } catch (error) {
                        trackError(
                          new ReloadBundleError({ error, ui: 'drawer' }),
                        );
                        Alert.alert('Error restarting app');
                      }
                    }}
                  >
                    Restart to get latest! 🔥
                  </TextWithPress>
                )}
              </View>
            </View>
          </Pressable>
        </View>
        <BottomSheetModal ref={bottomSheetModalRef} name="ThemeSettings">
          <BottomSheetContentContainer>
            <BottomSheetHeader
              title="Theme"
              Icon={<Palette size={20} color={t.colors.text.primary} />}
            />
            <ThemeSettings />
          </BottomSheetContentContainer>
        </BottomSheetModal>
        <BottomSheetModal
          ref={browserBottomSheetModalRef}
          name="BrowserSettings"
        >
          <BottomSheetContentContainer>
            <BottomSheetHeader
              title="Browser"
              Icon={<Globe size={20} color={t.colors.text.primary} />}
            />
            <BrowserSettings />
          </BottomSheetContentContainer>
        </BottomSheetModal>
      </>
    );
  },
);

SettingsScreen.displayName = 'SettingsScreen';

export { SettingsScreen };
