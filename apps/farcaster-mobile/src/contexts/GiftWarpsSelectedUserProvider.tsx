import { ApiUser } from 'farcaster-client-data';
import React from 'react';

type GiftWarpsSelectedUserContextValue = {
  selectedUser: ApiUser | undefined;
  setSelectedUser: ({ user }: { user: ApiUser }) => void;
};

const GiftWarpsSelectedUserContext =
  React.createContext<GiftWarpsSelectedUserContextValue>({} as never);

type GiftWarpsSelectedUserProviderProps = {
  children: React.ReactNode;
};

const GiftWarpsSelectedUserProvider: React.FC<
  GiftWarpsSelectedUserProviderProps
> = ({ children }) => {
  const [selectedUser, setUser] = React.useState<ApiUser | undefined>(
    undefined,
  );

  const setSelectedUser = React.useCallback(({ user }: { user: ApiUser }) => {
    setUser(user);
  }, []);

  return (
    <GiftWarpsSelectedUserContext.Provider
      value={{
        selectedUser,
        setSelectedUser,
      }}
    >
      {children}
    </GiftWarpsSelectedUserContext.Provider>
  );
};

GiftWarpsSelectedUserProvider.displayName = 'GiftWarpsSelectedUserProvider';

const useGiftWarpsSelectedUser = () =>
  React.useContext(GiftWarpsSelectedUserContext);

export { GiftWarpsSelectedUserProvider, useGiftWarpsSelectedUser };
