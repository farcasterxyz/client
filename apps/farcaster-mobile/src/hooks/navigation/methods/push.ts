import { StackActions, useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';

import { useNavigationHistory } from '~/contexts/NavigationHistoryProvider';
import { NavigationMethod } from '~/contexts/NavigationMethodsProvider';
import { prefetchRegistry } from '~/prefetchRegistry';

export function useUnmediatedPush(): NavigationMethod {
  const { dispatch } = useNavigation();
  const { trackNavigationEvent } = useNavigationHistory();

  return useCallback(
    (name, params) => {
      trackNavigationEvent({ type: 'push', name, params });
      prefetchRegistry[name]?.(params);
      return dispatch(StackActions.push(name, params));
    },
    [dispatch, trackNavigationEvent],
  );
}
