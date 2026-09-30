import { StackActions, useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';

import { useNavigationHistory } from '~/contexts/NavigationHistoryProvider';

export function useUnmediatedPopToTop() {
  const { dispatch } = useNavigation();
  const { trackNavigationEvent } = useNavigationHistory();

  return useCallback(() => {
    trackNavigationEvent({ type: 'popToTop' });

    return dispatch(StackActions.popToTop());
  }, [dispatch, trackNavigationEvent]);
}
