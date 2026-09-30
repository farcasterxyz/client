import React from 'react';

export const BottomTabNavigatorContext = React.createContext<
  | undefined
  | {
      setTabBarTopBorderHidden: (hidden: boolean) => void;
    }
>(undefined);

export function useSetTabBarTopBorderHidden(): (hidden: boolean) => void {
  const context = React.useContext(BottomTabNavigatorContext);
  const setTabBarTopBorderHidden = context?.setTabBarTopBorderHidden;
  return React.useCallback(
    (newVal: boolean) => {
      setTabBarTopBorderHidden?.(newVal);
    },
    [setTabBarTopBorderHidden],
  );
}

export function useIsWithinTabNavigator(): boolean {
  const context = React.useContext(BottomTabNavigatorContext);
  return !!context;
}
