import React from 'react';

import { WARPLET_SHORTCODE } from '~/constants/customEmojis';
import { mostRecentReactionsKey } from '~/constants/storage';
import { getItem, setItem } from '~/utils/storageUtils';

type DirectCastToTakeActionContextValue = {
  recentReactions: string[];
  addToRecentReactions: (reaction: string) => void;
};

const DirectCastToTakeActionContext =
  React.createContext<DirectCastToTakeActionContextValue>({
    recentReactions: [],
    addToRecentReactions: () => {},
  });

type DirectCastToTakeActionProviderProps = {
  children: React.ReactNode;
};

const DirectCastToTakeActionProvider: React.FC<DirectCastToTakeActionProviderProps> =
  React.memo(({ children }) => {
    const [recentReactions, setRecentReactions] = React.useState<string[]>([
      '👍',
      '❤️',
      WARPLET_SHORTCODE,
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
        setItem({ key: mostRecentReactionsKey, value: newSet });
        setRecentReactions(newSet);
      },
      [recentReactions],
    );

    React.useEffect(() => {
      if (!initialized) {
        setInitialized(true);
        getItem<string[]>({ key: mostRecentReactionsKey, fallback: [] }).then(
          (existing) => {
            setRecentReactions(
              [
                ...existing,
                ...recentReactions.filter((r) => !existing.includes(r)),
              ].slice(0, 5),
            );
          },
        );
      }
    }, [initialized, recentReactions]);

    return (
      <DirectCastToTakeActionContext.Provider
        value={{
          recentReactions,
          addToRecentReactions,
        }}
      >
        {children}
      </DirectCastToTakeActionContext.Provider>
    );
  });

DirectCastToTakeActionProvider.displayName = 'DirectCastToTakeActionProvider';

const useDirectCastToTakeAction = () =>
  React.useContext(DirectCastToTakeActionContext);

export { DirectCastToTakeActionProvider, useDirectCastToTakeAction };
