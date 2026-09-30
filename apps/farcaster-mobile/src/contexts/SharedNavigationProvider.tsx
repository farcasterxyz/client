import { NavigationActions, SharedNavigationContext } from 'farcaster-expo';
import * as React from 'react';

import { useOpenComposer } from '~/contexts/CreateCastComposerProvider';
import { useGoBack } from '~/hooks/navigation/useGoBack';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { useNavigateToNestedScreen } from '~/hooks/navigation/useNavigateToNestedScreen';
import { usePop } from '~/hooks/navigation/usePop';
import { usePopToTop } from '~/hooks/navigation/usePoptoTop';
import { usePush } from '~/hooks/navigation/usePush';
import { useReplace } from '~/hooks/navigation/useReplace';

type SharedNavigationProviderProps = {
  children: React.ReactNode;
};

type CreateCastNavigationAction = Extract<
  NavigationActions,
  { path: 'CreateCast' }
>;
type StandardNavigationAction = Exclude<
  NavigationActions,
  { path: 'CreateCast' }
>;

function SharedNavigationProvider({ children }: SharedNavigationProviderProps) {
  const goBack = useGoBack();
  const navigate = useNavigate();
  const navigateToNestedScreen = useNavigateToNestedScreen();
  const pop = usePop();
  const push = usePush();
  const replace = useReplace();
  const popToTop = usePopToTop();
  const openComposer = useOpenComposer();

  const handleCreateCastNavigation = React.useCallback(
    (params: CreateCastNavigationAction['params']) => {
      setTimeout(() => {
        openComposer(params);
      }, 500);
    },
    [openComposer],
  );
  const context = React.useMemo(
    () => ({
      goBack: () => {
        goBack();
      },
      navigate: (action: NavigationActions) => {
        if (action.path === 'CreateCast') {
          handleCreateCastNavigation(
            (action as CreateCastNavigationAction).params,
          );
          return;
        }
        if (action.path === 'Wallet') {
          navigateToNestedScreen('WalletTab', 'Wallet', action.params ?? {});
          return;
        }
        const safeAction = action as StandardNavigationAction;
        const params = safeAction.params ?? {};
        navigate(safeAction.path, params);
      },
      pop: (count?: number) => {
        pop(count);
      },
      push: (action: NavigationActions) => {
        if (action.path === 'CreateCast') {
          handleCreateCastNavigation(
            (action as CreateCastNavigationAction).params,
          );
          return;
        }
        const safeAction = action as StandardNavigationAction;
        const params = safeAction.params ?? {};
        push(safeAction.path, params);
      },
      replace: (action: NavigationActions) => {
        if (action.path === 'CreateCast') {
          handleCreateCastNavigation(
            (action as CreateCastNavigationAction).params,
          );
          return;
        }
        const safeAction = action as StandardNavigationAction;
        const params = safeAction.params ?? {};
        replace(safeAction.path, params);
      },
      popToTop: () => {
        popToTop();
      },
    }),
    [
      goBack,
      navigate,
      navigateToNestedScreen,
      pop,
      push,
      replace,
      popToTop,
      handleCreateCastNavigation,
    ],
  );
  return (
    <SharedNavigationContext.Provider value={context}>
      {children}
    </SharedNavigationContext.Provider>
  );
}

export { SharedNavigationProvider };
