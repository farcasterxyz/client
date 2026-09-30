import { NavigationContext } from '@react-navigation/native';
import React from 'react';

type CleanupFn = () => void;
type FocusEffect = () => void | CleanupFn;

export function useSafeFocusEffect(effect: FocusEffect) {
  const navigation = React.useContext(NavigationContext);

  React.useEffect(() => {
    let cleanup: CleanupFn | undefined;

    const runEffect = () => {
      const maybeCleanup = effect();
      cleanup = typeof maybeCleanup === 'function' ? maybeCleanup : undefined;
    };

    const runCleanup = () => {
      cleanup?.();
      cleanup = undefined;
    };

    if (!navigation?.addListener) {
      // Fallback for embed/non-navigation trees.
      runEffect();
      return runCleanup;
    }

    const unsubscribeFocus = navigation.addListener('focus', () => {
      runCleanup();
      runEffect();
    });

    const unsubscribeBlur = navigation.addListener('blur', () => {
      runCleanup();
    });

    if (navigation.isFocused?.()) {
      runEffect();
    }

    return () => {
      runCleanup();
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [effect, navigation]);
}
