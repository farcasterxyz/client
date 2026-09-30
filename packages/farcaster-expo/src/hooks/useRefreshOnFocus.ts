import { NavigationContext } from '@react-navigation/native';
import React from 'react';

export function useRefreshOnFocus<T>(refetch: () => Promise<T>) {
  const firstTimeRef = React.useRef(true);
  const navigation = React.useContext(NavigationContext);

  React.useEffect(() => {
    if (!navigation?.addListener) {
      return;
    }

    if (navigation.isFocused?.()) {
      firstTimeRef.current = false;
    }

    const unsubscribe = navigation.addListener('focus', () => {
      if (firstTimeRef.current) {
        firstTimeRef.current = false;
        return;
      }

      refetch();
    });

    return unsubscribe;
  }, [navigation, refetch]);
}
