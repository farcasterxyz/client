import {
  CommonActions,
  NavigationContainerRefWithCurrent,
  StackActions,
} from '@react-navigation/native';
import { Notification, NotificationResponse } from 'expo-notifications';
import * as Notifications from 'expo-notifications';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiChain,
  apiChainToChainId,
  apiChainToChainIdOrThrow,
  ApiUser,
  getTransactionExplorerUrl,
} from 'farcaster-client-data';
import { NavigatorNotReadyForPushNotificationError } from 'farcaster-client-hooks';
import { useShowWalletOrdersTab } from 'farcaster-expo';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Platform } from 'react-native';

import {
  creatorRewardPromptKey,
  remoteSiwfRequestPrompt,
  userBoostInfoPromptKey,
} from '~/constants/Storage';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useOpenComposer } from '~/contexts/CreateCastComposerProvider';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { useMinimizedMiniApp } from '~/contexts/MinimizedMiniAppProvider';
import { useNavigationHistory } from '~/contexts/NavigationHistoryProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { navigateToWalletOrdersTab } from '~/hooks/navigation/navigateToWalletOrdersTab';
import { BottomTabName, FullParamList, ScreenName } from '~/types';
import { trackError } from '~/utils/ErrorUtils';
import { logErrorInDevOnly } from '~/utils/LogUtils';
import { sleep } from '~/utils/PromiseUtils';
import { getPushNotificationOpenedProperties } from '~/utils/PushNotificationAnalyticsUtils';
import {
  getNotificationInstanceId,
  getPushNotificationData,
  rememberNotificationInstance,
} from '~/utils/PushNotificationUtils';

const waitForNavigatorInterval = 500;
const maxWaitForNavigatorAttempts = 5;

// To test push notifications locally on simulator:
// 1. Ensure pushes are enabled in setting
// 2. Create an .apns file (e.g. at ~/Desktop/fake-push-notif-payload.apns) with content like the following:
//    {
//      "Simulator Target Bundle": "com.farcaster.mobile-client",
//      "aps": {
//        "alert": {
//          "title": "PUSH TITLE",
//          "body": "PUSH BODY"
//        },
//        "data": {
//          "type": "test-notification"
//        },
//        "badge": 1
//      }
//    }
// 3. Run:
//    xcrun simctl push booted com.farcaster.mobile-client ~/Desktop/fake-push-notif-payload.apns

const useHandlePushNotification = (
  navigationRefProp: NavigationContainerRefWithCurrent<FullParamList>,
) => {
  const navigationRef = useRef(navigationRefProp);
  navigationRef.current = navigationRefProp;

  const [lastNotification, setLastNotification] =
    useState<NotificationResponse | null>(null);
  const { trackEvent } = useAnalytics();
  const currentUser = useCurrentUser_UNSAFE();
  const { setOpenMiniApp } = useMinimizedMiniApp();
  const openComposer = useOpenComposer();

  const { trackNavigationEvent } = useNavigationHistory();

  const { showGlobalPrompt } = useGlobalPrompts();
  const handledNotificationIds = useRef(new Set<string>());
  const { showWalletOrdersTab } = useShowWalletOrdersTab();

  const handleNotification = useCallback(
    async (notification: Notification) => {
      const data = getPushNotificationData(notification);

      // De-duplicate handling and analytics for the SAME notification instance
      // (the response listener and cold-start lookup can both deliver it).
      const notificationInstanceId = getNotificationInstanceId(
        notification,
        data?.id,
      );
      if (
        !rememberNotificationInstance(
          handledNotificationIds.current,
          notificationInstanceId,
        )
      ) {
        return;
      }

      trackEvent(
        AnalyticsEvent.OpenPushNofitication,
        getPushNotificationOpenedProperties({
          data,
          fid: currentUser?.fid,
          platform: Platform.OS,
        }),
      );

      if (!data) {
        logErrorInDevOnly(
          'No data for notification:',
          JSON.stringify(notification, null, 2),
        );
        return;
      }

      const waitForNavigator = async () => {
        let waitForNavigatorAttempts = 0;

        while (
          !navigationRef.current.isReady() &&
          waitForNavigatorAttempts++ < maxWaitForNavigatorAttempts
        ) {
          await sleep(waitForNavigatorInterval);
        }

        if (!navigationRef.current.isReady()) {
          trackError(
            new NavigatorNotReadyForPushNotificationError({ type: data.type }),
          );
        }
      };

      const navigate = async <N extends ScreenName>(
        screen: N,
        params: FullParamList[N],
      ) => {
        // We need to once again ensure that the navigator is ready,
        // because we've waited for an async request and it's possible that the navigator ref is different.
        await waitForNavigator();
        trackNavigationEvent({
          type: 'navigate',
          name: screen,
          params,
          isFromDeepLink: true,
        });
        navigationRef.current.dispatch(CommonActions.navigate(screen, params));
      };

      const push = async <N extends ScreenName>(
        screen: N,
        params: FullParamList[N],
      ) => {
        trackNavigationEvent({
          type: 'push',
          name: screen,
          params,
          isFromPushNotification: true,
        });

        await waitForNavigator();
        return navigationRef.current.dispatch(
          StackActions.push(screen, params),
        );
      };

      const navigateToNestedScreen = async <
        Tab extends BottomTabName,
        Screen extends ScreenName,
      >(
        tab: Tab,
        screen: Screen,
        params: FullParamList[Screen],
      ) => {
        await waitForNavigator();

        trackNavigationEvent({
          type: 'navigateToNestedScreen',
          tab,
          screen,
          params,
        });

        navigationRef.current.dispatch(
          CommonActions.navigate(tab, {
            screen,
            params,
            // Without initial:false, React Navigation v7 skips the tab's
            // initialRouteName when the tab is lazy and not yet mounted,
            // leaving the back stack with only the target screen. Setting
            // false forces getInitialState first so back always returns to
            // the tab's root (e.g. DM inbox).
            initial: false,
          }),
        );
      };

      switch (data.type) {
        case 'view_cast': {
          return push('Cast', {
            castHash: data.castHash,
          });
        }
        case 'unread-direct-casts': {
          if (typeof data.conversationId !== 'undefined') {
            const currentRoute = navigationRef.current.getCurrentRoute();

            if (
              typeof currentRoute !== 'undefined' &&
              currentRoute.name === 'PlaintextDirectCastsConversation' &&
              typeof currentRoute.params !== 'undefined' &&
              currentRoute.params.conversationId === data.conversationId
            ) {
              // Already at the route we want
              return;
            }

            // Navigate to the DirectCasts tab first so the back button returns
            // to the conversation list. Using CommonActions.reset to
            // 'PlaintextDirectCasts' breaks on Android because that screen
            // lives inside a nested tab navigator, not on the root stack.
            return navigateToNestedScreen(
              'DirectCastsTab',
              'PlaintextDirectCastsConversation',
              {
                conversationId: data.conversationId,
                counterParty: undefined,
                create: false,
                intentText: undefined,
              },
            );
          }

          return navigate('PlaintextDirectCasts', {});
        }
        case 'direct-cast-intent': {
          // Navigate into the DirectCasts tab rather than resetting the root
          // navigator to a nested screen (which can leave Android on a blank state).
          return navigateToNestedScreen(
            'DirectCastsTab',
            'PlaintextDirectCastsConversation',
            {
              conversationId: data.conversationId,
              // We have to do the type dance here as private types are not able
              // reference public types due to our type-gen limitations.
              counterParty: data.counterParties[0] as ApiUser | undefined,
              create: true,
              intentText: data.intentText,
            },
          );
        }
        case 'view-for-you-users': {
          // Need this to reset the state in case we are on another tab or there is active search
          navigationRef.current.dispatch(StackActions.replace('Explore'));
          return navigate('Explore', {});
        }
        case 'onramp-update': {
          if (data.txHash) {
            const chainId = apiChainToChainId(data.chain as ApiChain);
            if (!chainId) {
              return;
            }
            const explorerUrl = getTransactionExplorerUrl({
              chainId,
              hash: data.txHash,
              type: 'tx',
            });
            if (explorerUrl) {
              await Linking.openURL(explorerUrl);
            }
          }
          return;
        }
        case 'view-discover-assets': {
          return push('Discover', {});
        }
        case 'view-user-profile': {
          return push('UserV2', { fid: data.fid });
        }
        case 'view-notifications': {
          return navigate('Notifications', {});
        }
        case 'view-location': {
          return push('LocationUsers', {
            placeId: data.placeId,
            description: data.description,
          });
        }
        case 'farcaster-pro-subscription-communication': {
          switch (data.redirectTo) {
            case 'trade-ideas': {
              return navigate('ExploreScreen', {});
            }
            case 'upsell': {
              return push('FarcasterProUpsell', { source: 'notification' });
            }
          }
          break;
        }
        case 'compose-cast': {
          return openComposer({
            intent: {
              text: data.text || '',
              embeds: [],
              mentions: [],
              channelKey: data.channelKey,
            },
          });
        }
        case 'view-explore-channels': {
          // Need this to reset the state in case we are on another tab or there is active search
          navigationRef.current.dispatch(StackActions.replace('Explore'));
          return navigate('Explore', {});
        }
        case 'view-connected-addresses': {
          return push('ConnectedAddresses', {});
        }
        case 'view-muted-keywords': {
          return push('MutedKeywords', {});
        }
        case 'view-edit-location': {
          return push('EditLocation', {});
        }
        case 'remote-siwf-request': {
          return showGlobalPrompt({
            key: remoteSiwfRequestPrompt,
            globalPromptData: {
              remoteSiwfRequest: { token: data.token },
            },
          });
          // return push('RemoteSiwfRequest', {
          //   token: data.token,
          // });
        }
        case 'view-super-follow-casts': {
          return navigate('NotificationsInGroup', {
            groupId: data.notificationGroupId,
            type: 'new-cast',
            title: undefined,
          });
        }
        case 'dangerously-trigger-navigate': {
          const screen: ScreenName = data.screenName as ScreenName;
          const params = data.screenParams as FullParamList[typeof screen];

          return navigate(screen, params);
        }
        case 'active-badge': {
          return navigate('Notifications', {});
        }
        case 'sync-contacts': {
          return push('Follows', {
            fid: data.fid,
            initialTab: 'followers',
          });
        }
        case 'matched-contacts': {
          return push('ContactsUsers', {});
        }
        case 'view-user-boost-info': {
          return showGlobalPrompt({
            key: userBoostInfoPromptKey,
            globalPromptData: { userBoostInfo: { showCastButton: true } },
          });
        }
        case 'view-creator-reward': {
          return showGlobalPrompt({
            key: creatorRewardPromptKey,
            globalPromptData: { creatorReward: data },
          });
        }
        case 'open-mini-app': {
          setOpenMiniApp({
            launchConfig: {
              type: 'manifest',
              domain: data.domain,
              timestamp: Date.now(),
            },
            context: {
              type: 'launcher',
            },
          });
          return;
        }
        case 'connect-account': {
          return push('ConnectedAccounts', { success: false });
        }
        case 'recovery-initiated': {
          return navigate('Notifications', {});
        }
        case 'trending-token': {
          return push('Token', {
            chain: data.chain as ApiChain,
            ca: data.ca,
            via: 'notification_trending_push',
          });
        }
        case 'trader-alert': {
          return push('Token', {
            chain: data.chain as ApiChain,
            ca: data.ca,
            via: 'notification_trader_alert_push',
          });
        }
        case 'token-alert': {
          return push('Token', {
            chain: data.chain as ApiChain,
            ca: data.ca,
            via: 'notification_token_alert_push',
          });
        }
        case 'trending-follow-recommendation': {
          return push('DeeplinkOnlyUserV2', {
            username: data.recommendedUsername,
          });
        }
        case 'wallet-activity': {
          return push('Notifications', {});
        }
        case 'warps-redemption-offer': {
          return push('RedeemWarpsForUSDC', {});
        }
        case 'new-campaign': {
          return push('Campaign', {
            campaignId: data.id,
          });
        }
        case 'referral-code-claimed': {
          return push('ReferralsOverview', {});
        }
        case 'referral-launch': {
          return push('ReferralsOverview', {});
        }
        case 'referral-reminder': {
          return push('ReferralsOverview', {});
        }
        case 'xp-reward-expire-soon': {
          return push('ReferralsOverview', {});
        }
        case 'xp-reward-expire-imminent': {
          return push('ReferralsOverview', {});
        }
        case 'deposit-bonuses-launch': {
          return push('DepositBonusesIntro', {});
        }
        case 'deposit-bonuses-ineligible': {
          return push('Notifications', {});
        }
        case 'new-article': {
          return navigateToNestedScreen('WalletTab', 'Article', {
            publicId: data.articlePublicId,
            source: 'new-article-push',
          });
        }
        case 'swap-failed': {
          return push('WalletSwap', {
            platformType: 'mobile',
            swapIntent: {
              sell: {
                chainId: Number(
                  apiChainToChainIdOrThrow(data.sellChain as ApiChain),
                ),
                address: data.sellCa,
              },
              buy: {
                chainId: Number(
                  apiChainToChainIdOrThrow(data.buyChain as ApiChain),
                ),
                address: data.buyCa,
              },
              sellAmount: data.sellAmount,
            },
          });
        }
        case 'limit-order-matched': {
          await waitForNavigator();
          const showOrdersTab = showWalletOrdersTab;
          trackNavigationEvent({
            type: 'navigateToNestedScreen',
            tab: 'WalletTab',
            screen: 'Wallet',
            params: {
              ...(showOrdersTab ? { initialTab: 'orders' as const } : {}),
              limitOrderId: data.limitOrderId,
            },
          });
          navigateToWalletOrdersTab({
            showOrdersTab,
            limitOrderId: data.limitOrderId,
          });
          return;
        }
        case 'usdc-lending': {
          return navigateToNestedScreen('WalletTab', 'Wallet', {
            usdcLendingLearnMore: true,
          });
        }
        case 'audio-room-live':
        case 'audio-room-hand-raised':
        case 'audio-room-invite-to-stage': {
          return navigateToNestedScreen('HomeTab', 'SpaceRoom', {
            roomId: data.roomId,
          });
        }
        case 'audio-room-scheduled-start': {
          return navigateToNestedScreen('HomeTab', 'SpaceRoom', {
            roomId: data.roomId,
            autoStartScheduled: true,
          });
        }
      }
    },
    [
      openComposer,
      currentUser?.fid,
      showGlobalPrompt,
      trackEvent,
      trackNavigationEvent,
      setOpenMiniApp,
      showWalletOrdersTab,
    ],
  );

  // Subscribe to notification responses received while the app is running,
  // and also fetch the last response for cold-start handling.
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        setLastNotification(response);
      },
    );

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        setLastNotification(response);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (lastNotification) {
      // Handle push notification that the user interacted with
      handleNotification(lastNotification.notification);
    }
  }, [handleNotification, lastNotification]);
};

export { useHandlePushNotification };
