import { ApiDirectCastMessageV3 } from 'farcaster-client-data';
import React from 'react';

import { recentDirectCastReactionsKey } from '~/constants/Storage';
import { getItem, setItem } from '~/utils/StorageUtils';

type DirectCastToTakeActionContextValue = {
  directCast: ApiDirectCastMessageV3 | undefined;
  setDirectCastToTakeAction: (
    directCast: ApiDirectCastMessageV3 | undefined,
  ) => void;
  recentReactions: string[];
  addToRecentReactions: (reaction: string) => void;
};

const DirectCastToTakeActionContext =
  React.createContext<DirectCastToTakeActionContextValue>({
    directCast: undefined,
    setDirectCastToTakeAction: () => {},
    recentReactions: [],
    addToRecentReactions: () => {},
  });

type DirectCastToTakeActionProviderProps = {
  children: React.ReactNode;
};

const DirectCastToTakeActionProvider: React.FC<DirectCastToTakeActionProviderProps> =
  React.memo(({ children }) => {
    const [directCast, setDirectCast] = React.useState<
      ApiDirectCastMessageV3 | undefined
    >(undefined);
    const [recentReactions, setRecentReactions] = React.useState<string[]>([
      '👍',
      '❤️',
      '➕',
      '😂',
      '😮',
    ]);
    const [initialized, setInitialized] = React.useState<boolean>(false);

    const addToRecentReactions = React.useCallback(
      (reaction: string) => {
        const newSet = [
          reaction,
          ...recentReactions.filter((r) => r !== reaction),
        ].slice(0, 5);
        setItem({ key: recentDirectCastReactionsKey, value: newSet });
        setRecentReactions(newSet);
      },
      [recentReactions],
    );

    React.useEffect(() => {
      if (!initialized) {
        setInitialized(true);
        getItem<string[]>({
          key: recentDirectCastReactionsKey,
          fallback: [],
        }).then((existing) => {
          setRecentReactions(
            [
              ...existing,
              ...recentReactions.filter((r) => !existing.includes(r)),
            ].slice(0, 5),
          );
        });
      }
    }, [initialized, recentReactions]);

    const value = React.useMemo(
      () => ({
        directCast,
        setDirectCastToTakeAction: setDirectCast,
        recentReactions,
        addToRecentReactions,
      }),
      [directCast, setDirectCast, recentReactions, addToRecentReactions],
    );

    return (
      <DirectCastToTakeActionContext.Provider value={value}>
        {children}
      </DirectCastToTakeActionContext.Provider>
    );
  });

DirectCastToTakeActionProvider.displayName = 'DirectCastToTakeActionProvider';

const useDirectCastToTakeAction = () =>
  React.useContext(DirectCastToTakeActionContext);

export { DirectCastToTakeActionProvider, useDirectCastToTakeAction };
