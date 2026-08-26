import { CommonActions, useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';

import { useNavigationHistory } from '~/contexts/NavigationHistoryProvider';

export function useUnmediatedGoBack() {
  const { dispatch } = useNavigation();
  const { trackNavigationEvent } = useNavigationHistory();

  return useCallback(() => {
    trackNavigationEvent({ type: 'goBack' });

    return dispatch(CommonActions.goBack);
  }, [dispatch, trackNavigationEvent]);
}
