import { StackActions, useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';

import { useNavigationHistory } from '~/contexts/NavigationHistoryProvider';
import { NavigationMethod } from '~/contexts/NavigationMethodsProvider';

export function useUnmediatedReplace(): NavigationMethod {
  const { dispatch } = useNavigation();
  const { trackNavigationEvent } = useNavigationHistory();

  return useCallback(
    (name, params) => {
      trackNavigationEvent({ type: 'replace', name, params });
      return dispatch(StackActions.replace(name, params));
    },
    [dispatch, trackNavigationEvent],
  );
}
