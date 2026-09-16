import { useFocusEffect } from '@react-navigation/native';
import { AnalyticsEvent } from 'farcaster-analytics';
import { useCallback } from 'react';

import { useAnalytics } from '~/contexts/AnalyticsProvider';

import { usePreventBack } from './usePreventBack';

type UseOnboardingOptions = {
  title: string;

  // Disable the back warning
  noBackWarning?: boolean;
};

export const useOnboardingScreen = ({
  title,
  noBackWarning,
}: UseOnboardingOptions) => {
  const { trackEvent } = useAnalytics();

  useFocusEffect(
    useCallback(() => {
      trackEvent(AnalyticsEvent.ShowOnboardingStep, {
        title,
        mobile: true,
        version: 2,
      });
    }, [trackEvent, title]),
  );

  const preventBack = usePreventBack({
    title: 'Cancel account creation?',
    message:
      'If you decide to come back, use the same email address to continue.',
    cancelText: 'Stay',
    confirmText: 'Leave',
    disabled: noBackWarning,
  });

  return preventBack;
};
