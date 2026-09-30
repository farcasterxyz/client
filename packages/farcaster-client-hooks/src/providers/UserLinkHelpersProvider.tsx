import React, {
  createContext,
  FC,
  memo,
  ReactNode,
  useContext,
  useMemo,
} from 'react';

type UserProfileHelpersContextValue = {
  screenUserFid: number | undefined;
  shouldLinkToUser: (params: { fid: number }) => boolean;
};

const UserProfileHelpersContext = createContext<UserProfileHelpersContextValue>(
  {
    screenUserFid: undefined,
    shouldLinkToUser: () => true,
  },
);

type UserLinkHelpersProviderProps = {
  children: ReactNode;
  screenUserFid: number;
};

const UserLinkHelpersProvider: FC<UserLinkHelpersProviderProps> = memo(
  ({ children, screenUserFid }) => (
    <UserProfileHelpersContext.Provider
      value={useMemo(
        () => ({
          screenUserFid,
          shouldLinkToUser: ({ fid }: { fid: number }) => fid !== screenUserFid,
        }),
        [screenUserFid],
      )}
    >
      {children}
    </UserProfileHelpersContext.Provider>
  ),
);

const useUserLinkHelpers = () => useContext(UserProfileHelpersContext);

UserLinkHelpersProvider.displayName = 'UserLinkHelpersProvider';

export { UserLinkHelpersProvider, useUserLinkHelpers };
