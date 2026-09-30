import {
  ADMIN_FIDS,
  ApiActiveUserBoost,
  ApiFrame,
  ApiUserAppContextNotificationTab,
  ApiUserCastAction,
} from 'farcaster-client-data';
import {
  useNonSuspenseUserAppContext as useNonSuspenseUserAppContextQuery,
  useNonSuspenseUserPreferences,
} from 'farcaster-client-hooks';
import React, { createContext, useContext, useMemo } from 'react';

import { useCachedCurrentUser } from '~/hooks/data/useCachedCurrentUser';

type UserAppContextValue = {
  isAdmin: boolean;
  disableFollow: boolean;
  adminForChannelKeys: Set<string>;
  modOfChannelKeys: Set<string>;
  canEditAllChannels: boolean;
  canUploadVideo: boolean;
  promptToAckFrameTxRisks: boolean;
  notificationTabs?: ApiUserAppContextNotificationTab[];
  castActions: ApiUserCastAction[];
  canAddCastAction: boolean;
  regularCastByteLimit: number;
  longCastByteLimit: number;
  castEmbedLimit: number;
  optedOutChannelStreaks: boolean;
  userBoost: ApiActiveUserBoost | undefined;
  higherClientEventSamplingRateEnabled: boolean;
  trendingNotAvailable: boolean;
  emailLoginDisabled: boolean;
  castShareEnabledMiniApps: ApiFrame[];
  developerModeEnabled: boolean;
};

const UNAUTHED_VISITS_CAST_BYTE_LIMIT_FALLBACK = 320;

const CAST_EMBED_LIMIT_FALLBACK = 2;

const defaultContextValue: UserAppContextValue = {
  isAdmin: false,
  disableFollow: false,
  adminForChannelKeys: new Set([]),
  modOfChannelKeys: new Set([]),
  canEditAllChannels: false,
  canUploadVideo: false,
  promptToAckFrameTxRisks: false,
  castActions: [],
  canAddCastAction: true,
  regularCastByteLimit: UNAUTHED_VISITS_CAST_BYTE_LIMIT_FALLBACK,
  longCastByteLimit: UNAUTHED_VISITS_CAST_BYTE_LIMIT_FALLBACK,
  castEmbedLimit: CAST_EMBED_LIMIT_FALLBACK,
  optedOutChannelStreaks: false,
  userBoost: undefined,
  higherClientEventSamplingRateEnabled: false,
  trendingNotAvailable: false,
  emailLoginDisabled: false,
  castShareEnabledMiniApps: [],
  developerModeEnabled: false,
};

const Context = createContext<UserAppContextValue>(defaultContextValue);

interface UserAppContextProviderProps {
  children: React.ReactNode;
}

/**
 * Provides context about the current user of the application.
 */
export function UserAppContextProvider({
  children,
}: UserAppContextProviderProps) {
  const { data } = useNonSuspenseUserAppContextQuery({});
  const cachedCurrentUser = useCachedCurrentUser();
  const cachedCurrentUserFid = cachedCurrentUser?.fid;

  // Don't block the UI from loading.
  const { data: userPreferencesData } = useNonSuspenseUserPreferences();

  const value = useMemo(() => {
    const isAdmin =
      typeof cachedCurrentUserFid !== 'undefined' &&
      ADMIN_FIDS.has(cachedCurrentUserFid);

    if (data) {
      return {
        isAdmin,
        disableFollow: !data.canAddLinks,
        adminForChannelKeys: new Set(data.adminForChannelKeys),
        modOfChannelKeys: new Set(data.modOfChannelKeys),
        canEditAllChannels: data.canEditAllChannels || false,
        canUploadVideo: data.canUploadVideo || false,
        promptToAckFrameTxRisks:
          !userPreferencesData?.result.preferences.ackFrameTransactionRisks,
        notificationTabs: data.notificationTabsV2,
        castActions: data.castActions,
        canAddCastAction: data.canAddCastAction,
        regularCastByteLimit:
          data.regularCastByteLimit || UNAUTHED_VISITS_CAST_BYTE_LIMIT_FALLBACK,
        longCastByteLimit:
          data.longCastByteLimit || UNAUTHED_VISITS_CAST_BYTE_LIMIT_FALLBACK,
        castEmbedLimit: data.castEmbedLimit || CAST_EMBED_LIMIT_FALLBACK,
        optedOutChannelStreaks:
          userPreferencesData?.result.preferences.optOutChannelStreaks || false,
        userBoost: data.userBoost,
        higherClientEventSamplingRateEnabled:
          data.higherClientEventSamplingRateEnabled || false,
        trendingNotAvailable: data.trendingNotAvailable || false,
        emailLoginDisabled: data.emailLoginDisabled || false,
        castShareEnabledMiniApps: data.castShareEnabledMiniApps || [],
        developerModeEnabled:
          userPreferencesData?.result.preferences.enableDeveloperMode || false,
      } satisfies UserAppContextValue;
    } else {
      return { ...defaultContextValue, isAdmin };
    }
  }, [
    cachedCurrentUserFid,
    data,
    userPreferencesData?.result.preferences.ackFrameTransactionRisks,
    userPreferencesData?.result.preferences.enableDeveloperMode,
    userPreferencesData?.result.preferences.optOutChannelStreaks,
  ]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export const useUserAppContext = () => useContext(Context);
