import { CommonActions, useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';

import { useNavigationHistory } from '~/contexts/NavigationHistoryProvider';
import { NavigationMethod } from '~/contexts/NavigationMethodsProvider';
import { prefetchRegistry } from '~/prefetchRegistry';

export function useUnmediatedNavigate(): NavigationMethod {
  const { dispatch } = useNavigation();
  const { trackNavigationEvent } = useNavigationHistory();

  return useCallback(
    (name, params) => {
      trackNavigationEvent({ type: 'navigate', name, params });
      prefetchRegistry[name]?.(params);

      return dispatch(CommonActions.navigate(name, params));
    },
    [dispatch, trackNavigationEvent],
  );
}
