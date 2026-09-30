import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import * as StoreReview from 'expo-store-review';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiAppStoreReviewTarget } from 'farcaster-client-data';
import { MILLIS_PER_DAY, useMarkPromptedFor } from 'farcaster-client-hooks';
import React, { createContext, useMemo } from 'react';
import { Alert, Platform } from 'react-native';

import { trackError } from '~/utils/ErrorUtils';
import { getItem, setItem } from '~/utils/StorageUtils';

import { useAnalytics } from './AnalyticsProvider';
import { useUserAppContext } from './UserAppContextProvider';

type AppStoreReviewContextValue = {
  requestReview: ({ when }: { when: ApiAppStoreReviewTarget }) => Promise<void>;
};

const AppStoreReviewContext = createContext<AppStoreReviewContextValue>(
  {} as never,
);

interface AppStoreReviewContextProps {
  children: React.ReactNode;
}

const REVIEW_KEY = 'lastAppStoreReviewPrompt';

function AppStoreReviewProvider({ children }: AppStoreReviewContextProps) {
  DdRum.startAction(RumActionType.CUSTOM, 'load_provider', {
    name: 'AppStoreReviewContext',
  });

  const { trackEvent } = useAnalytics();

  const { canPromptForAppStoreReviewOn } = useUserAppContext();

  const markReviewPrompted = useMarkPromptedFor();

  const onYesPress = React.useCallback(
    async ({ when }: { when: ApiAppStoreReviewTarget }) => {
      trackEvent(AnalyticsEvent.AppStoreReviewRequestedYes, { when });

      await StoreReview.requestReview();

      await markReviewPrompted({ promptType: 'app-store-review' });
    },
    [markReviewPrompted, trackEvent],
  );

  const onNoPress = React.useCallback(
    async ({ when }: { when: ApiAppStoreReviewTarget }) => {
      trackEvent(AnalyticsEvent.AppStoreReviewRequestedNo, { when });

      await markReviewPrompted({ promptType: 'app-store-review' });
    },
    [markReviewPrompted, trackEvent],
  );

  const requestReview = React.useCallback(
    async ({ when }: { when: ApiAppStoreReviewTarget }) => {
      try {
        const isAvailable = await StoreReview.isAvailableAsync();

        const lastPrompt = await getItem({
          key: REVIEW_KEY,
          fallback: undefined,
        });

        const lastPromptOldEnough =
          typeof lastPrompt === 'undefined' ||
          Date.now() - parseInt(lastPrompt) > 30 * MILLIS_PER_DAY;

        if (
          isAvailable &&
          lastPromptOldEnough &&
          canPromptForAppStoreReviewOn.indexOf(when) !== -1
        ) {
          trackEvent(AnalyticsEvent.AppStoreReviewRequested, { when });

          await setItem({ key: REVIEW_KEY, value: String(Date.now()) });

          Alert.alert(
            'Enjoying Farcaster?',
            Platform.select({
              android: 'Leave a review on the Play Store!',
              default: 'Leave a review on the App Store!',
            }),
            [
              {
                text: 'No',
                onPress: () => onNoPress({ when }),
                style: 'default',
              },
              {
                text: 'Yes',
                isPreferred: true,
                onPress: () => onYesPress({ when }),
                style: 'default',
              },
            ],
          );
        }
      } catch (error) {
        trackError(error);

        trackEvent(AnalyticsEvent.AppStoreReviewRequestFailed, { when });
      }
    },
    [onNoPress, onYesPress, canPromptForAppStoreReviewOn, trackEvent],
  );

  const value = useMemo(() => {
    return {
      requestReview,
    } satisfies AppStoreReviewContextValue;
  }, [requestReview]);

  DdRum.stopAction(RumActionType.CUSTOM, 'load_provider', {
    name: 'AppStoreReviewContext',
  });

  return (
    <AppStoreReviewContext.Provider value={value}>
      {children}
    </AppStoreReviewContext.Provider>
  );
}

const useAppStoreReview = () => React.useContext(AppStoreReviewContext);

export { AppStoreReviewProvider, useAppStoreReview };
