import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export function useAppState() {
  const [state, setState] = useState(AppState.currentState);

  useEffect(() => {
    const appStateSubscription = AppState.addEventListener(
      'change',
      (state: AppStateStatus) => {
        setState(state);
      },
    );
    return () => {
      appStateSubscription.remove();
    };
  }, []);

  return state;
}
