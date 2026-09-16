import { useNavigation } from '@react-navigation/native';
import { useMemo } from 'react';

import { useTabViewNavigationState } from '~/contexts/TabViewNavigationStateProvider';
import { getPath } from '~/utils/NavigationUtils';

const usePath = () => {
  const { getState } = useNavigation();
  const { getState: getTabViewNavigationState } = useTabViewNavigationState();
  return useMemo(
    () => getPath(getState(), getTabViewNavigationState()),
    [getState, getTabViewNavigationState],
  );
};

export { usePath };
