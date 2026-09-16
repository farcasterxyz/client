import React, {
  createContext,
  FC,
  memo,
  ReactNode,
  useContext,
  useMemo,
} from 'react';

type CastLinkHelpersContextValue = {
  screenCastHash: string | undefined;
  shouldLinkToCast: (params: { castHash: string }) => boolean;
};

const CastLinkHelpersContext = createContext<CastLinkHelpersContextValue>({
  screenCastHash: undefined,
  shouldLinkToCast: () => true,
});

type CastLinkHelpersProviderProps = {
  children: ReactNode;
  screenCastHash: string | undefined;
};

const CastLinkHelpersProvider: FC<CastLinkHelpersProviderProps> = memo(
  ({ children, screenCastHash }) => (
    <CastLinkHelpersContext.Provider
      value={useMemo(
        () => ({
          screenCastHash,
          shouldLinkToCast: ({ castHash }: { castHash: string }) =>
            castHash !== screenCastHash,
        }),
        [screenCastHash],
      )}
    >
      {children}
    </CastLinkHelpersContext.Provider>
  ),
);

const useCastLinkHelpers = () => useContext(CastLinkHelpersContext);

CastLinkHelpersProvider.displayName = 'CastLinkHelpersProvider';

export { CastLinkHelpersProvider, useCastLinkHelpers };
