import { useNonSuspenseUserAppContext } from 'farcaster-client-hooks';
import React from 'react';

type UserAppContext = { noFeeAllowlisted: boolean };

type SharedUserAppContextType = {
  userAppContext: UserAppContext;
};

const SharedUserAppContext = React.createContext<SharedUserAppContextType>({
  userAppContext: { noFeeAllowlisted: false },
});

const useSharedUserAppContext = () => React.useContext(SharedUserAppContext);

type SharedUserAppContextProviderProps = React.PropsWithChildren;

function SharedUserAppContextProvider({
  children,
}: SharedUserAppContextProviderProps) {
  const { data } = useNonSuspenseUserAppContext({
    // Fetch whenever the app loads, regardless of the cached data being stale or not.
    refetchOnMount: 'always',
  });

  const userAppContext = React.useMemo(() => {
    if (
      typeof data === 'undefined' ||
      typeof data.noFeeAllowlisted === 'undefined'
    ) {
      return { noFeeAllowlisted: false };
    }

    return { noFeeAllowlisted: data.noFeeAllowlisted };
  }, [data]);

  const context = React.useMemo(() => ({ userAppContext }), [userAppContext]);

  return (
    <SharedUserAppContext.Provider value={context}>
      {children}
    </SharedUserAppContext.Provider>
  );
}

export { SharedUserAppContextProvider, useSharedUserAppContext };
