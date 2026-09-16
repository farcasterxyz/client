import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';

import { useNavigationHistory } from '~/contexts/NavigationHistoryProvider';
import { DrawerParamList } from '~/types/navigation';

export function useUnmediatedOpenDrawer() {
  const navigation: DrawerNavigationProp<DrawerParamList> = useNavigation();
  const { trackNavigationEvent } = useNavigationHistory();

  return useCallback(() => {
    trackNavigationEvent({ type: 'openDrawer' });

    return navigation.openDrawer?.();
  }, [navigation, trackNavigationEvent]);
}
