import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';

import { useDrawer } from '~/contexts/DrawerProvider';

// This hook is used by the `Screen` component to enable/disable swipe gestures for the side drawer.
// We only want to enable gestures for screens at the root of our bottom tab stacks.
// For non-root screens, we want swipe to navigate back, rather than opening the drawer.
const useManageDrawerSwipeEnabled = () => {
  const { getState } = useNavigation();
  const { setSwipeEnabled } = useDrawer();

  useFocusEffect(
    useCallback(() => {
      const state = getState();

      if (state?.routes.length === 1) {
        setSwipeEnabled(true);
      } else {
        setSwipeEnabled(false);
      }
    }, [getState, setSwipeEnabled]),
  );
};

export { useManageDrawerSwipeEnabled };
