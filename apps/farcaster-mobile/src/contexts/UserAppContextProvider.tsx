import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import {
  ApiActiveUserBoost,
  ApiAppContextIdType,
  ApiAppStoreReviewTarget,
  ApiFrame,
  ApiNewUserStatus,
  ApiUserAppContext,
  ApiUserAppContextNotificationTab,
  ApiUserAppPromptType,
  ApiUserCastAction,
} from 'farcaster-client-data';
import {
  // Disabling the linter on this as it should be the only usage
  useNonSuspenseUserAppContext as useNonSuspenseUserAppContextQuery,
  useNonSuspenseUserPreferences,
} from 'farcaster-client-hooks';
import React, { createContext, useContext, useMemo } from 'react';
import { Platform } from 'react-native';

type UserAppContextContextValue = {
  disableFollow: boolean;
  showConnectedApps: boolean;
  prompts: ApiUserAppPromptType[];
  adminForChannelKeys: Set<string>;
  modOfChannelKeys: Set<string>;
  canEditAllChannels: boolean;
  canUploadVideo: boolean;
  shouldPromptForPushNotifications: boolean;
  shouldPromptForAppStoreReview: boolean;
  canPromptForAppStoreReviewOn: ApiAppStoreReviewTarget[];
  enabledCastAction?: ApiUserCastAction;
  castActions: ApiUserCastAction[];
  canAddCastAction: boolean;
  notificationTabs?: ApiUserAppContextNotificationTab[];
  enabledVideoAutoplay: boolean;
  regularCastByteLimit: number;
  longCastByteLimit: number;
  castEmbedLimit: number;
  optedOutChannelStreaks: boolean;
  newUserStatus?: ApiNewUserStatus;
  userBoost?: ApiActiveUserBoost;
  higherClientEventSamplingRateEnabled: boolean;
  trendingNotAvailable: boolean;
  emailLoginDisabled: boolean;
  updatedVerificationsAvailable: boolean;
  castShareEnabledMiniApps?: ApiFrame[];
  developerModeEnabled: boolean;
  eligibleForExploreFeedLanding: boolean;
  appContextId?: ApiAppContextIdType;
  appNotAvailable?: boolean;
} & Pick<ApiUserAppContext, 'authAddressState'>;

// This is so that we don't end up with randomly casts with no text if something is off with
// this endpoint.
const CAST_BYTE_LIMIT_FALLBACK = 320;

const CAST_EMBED_LIMIT_FALLBACK = 2;

const createDefaultUserAppContext = () => {
  return {
    disableFollow: false,
    showConnectedApps: false,
    prompts: [],
    adminForChannelKeys: new Set([]),
    modOfChannelKeys: new Set([]),
    canEditAllChannels: false,
    canUploadVideo: false,
    shouldPromptForPushNotifications: false,
    shouldPromptForAppStoreReview: false,
    canPromptForAppStoreReviewOn: [],
    canAddCastAction: true,
    castActions: [],
    enabledVideoAutoplay: false,
    regularCastByteLimit: CAST_BYTE_LIMIT_FALLBACK,
    longCastByteLimit: CAST_BYTE_LIMIT_FALLBACK,
    castEmbedLimit: CAST_EMBED_LIMIT_FALLBACK,
    optedOutChannelStreaks: false,
    higherClientEventSamplingRateEnabled: false,
    trendingNotAvailable: false,
    emailLoginDisabled: false,
    updatedVerificationsAvailable: false,
    castShareEnabledMiniApps: [],
    developerModeEnabled: false,
    eligibleForExploreFeedLanding: false,
    appContextId: undefined,
  } satisfies UserAppContextContextValue;
};

const UserAppContextContext = createContext<UserAppContextContextValue>(
  createDefaultUserAppContext(),
);

interface UserAppContextProviderProps {
  children: React.ReactNode;
}

/**
 * Provides context about the current user of the application.
 */
export function UserAppContextProvider({
  children,
}: UserAppContextProviderProps) {
  DdRum.startAction(RumActionType.CUSTOM, 'load_provider', {
    name: 'UserAppContextProvider',
  });

  const { data } = useNonSuspenseUserAppContextQuery({
    // Fetch whenever the app loads, regardless of the cached data being stale or not.
    refetchOnMount: 'always',
  });
  // Don't block the UI from loading.
  const { data: userPreferencesData } = useNonSuspenseUserPreferences();

  const optedOutChannelStreaks =
    userPreferencesData?.result.preferences.optOutChannelStreaks || false;

  const developerModeEnabled =
    userPreferencesData?.result.preferences.enableDeveloperMode || false;

  const value = useMemo(() => {
    if (data) {
      return {
        disableFollow: !data.canAddLinks,
        showConnectedApps: data.showConnectedApps,
        prompts: data.prompts,
        adminForChannelKeys: new Set(data.adminForChannelKeys),
        modOfChannelKeys: new Set(data.modOfChannelKeys),
        canEditAllChannels: data.canEditAllChannels || false,
        canUploadVideo: data.canUploadVideo || false,
        shouldPromptForPushNotifications:
          data.shouldPromptForPushNotifications || false,
        shouldPromptForAppStoreReview:
          data.shouldPromptForAppStoreReview || false,
        canPromptForAppStoreReviewOn:
          typeof data.canPromptForAppStoreReviewOn !== 'undefined'
            ? data.canPromptForAppStoreReviewOn
            : [],
        enabledCastAction: data.enabledCastAction,
        castActions: data.castActions ?? [],
        canAddCastAction: data.canAddCastAction ?? true,
        notificationTabs: data.notificationTabsV2,
        enabledVideoAutoplay: data.enabledVideoAutoplay || false,
        regularCastByteLimit:
          data.regularCastByteLimit || CAST_BYTE_LIMIT_FALLBACK,
        longCastByteLimit: data.longCastByteLimit || CAST_BYTE_LIMIT_FALLBACK,
        castEmbedLimit: data.castEmbedLimit || CAST_EMBED_LIMIT_FALLBACK,
        optedOutChannelStreaks,
        newUserStatus: data.newUserStatus,
        userBoost: data.userBoost,
        higherClientEventSamplingRateEnabled:
          data.higherClientEventSamplingRateEnabled || false,
        trendingNotAvailable: data.trendingNotAvailable || false,
        emailLoginDisabled: data.emailLoginDisabled || false,
        authAddressState: data.authAddressState,
        updatedVerificationsAvailable:
          data.updatedVerificationsAvailable || false,
        castShareEnabledMiniApps: data.castShareEnabledMiniApps,
        developerModeEnabled: developerModeEnabled,
        eligibleForExploreFeedLanding:
          data.eligibleForExploreFeedLanding || false,
        appContextId: data.appContextId,
        appNotAvailable:
          typeof data.appNotAvailable !== 'undefined' &&
          data.appNotAvailable.length !== 0
            ? Platform.select({
                ios: data.appNotAvailable.indexOf('ios') !== -1,
                android: data.appNotAvailable.indexOf('android') !== -1,
              })
            : false,
      } satisfies UserAppContextContextValue;
    } else {
      return createDefaultUserAppContext();
    }
  }, [data, developerModeEnabled, optedOutChannelStreaks]);

  DdRum.stopAction(RumActionType.CUSTOM, 'load_provider', {
    name: 'UserAppContextProvider',
  });

  return (
    <UserAppContextContext.Provider value={value}>
      {children}
    </UserAppContextContext.Provider>
  );
}

export const useUserAppContext = () => useContext(UserAppContextContext);
