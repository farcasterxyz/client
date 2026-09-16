import { ApiCast, ApiCastFeedIncludeReason } from 'farcaster-client-data';
import React from 'react';

export type ApiCastWithContext = ApiCast & {
  reason: ApiCastFeedIncludeReason | undefined;
};

type CastToTakeActionContextValue = {
  cast: ApiCastWithContext | undefined;
  setCastToTakeAction: ({
    cast,
    inModalContext,
    feed,
  }: {
    cast: ApiCastWithContext;
    inModalContext?: boolean;
    feed?: string;
  }) => void;
  clearCastToTakeAction: () => void;
  inModalContext: boolean;
  feed?: string;
};

const CastToTakeActionContext =
  React.createContext<CastToTakeActionContextValue>({
    cast: undefined,
    setCastToTakeAction: () => {},
    clearCastToTakeAction: () => {},
    inModalContext: false,
    feed: undefined,
  });

type CastToTakeActionProviderProps = {
  children: React.ReactNode;
};

const CastToTakeActionProvider: React.FC<CastToTakeActionProviderProps> =
  React.memo(({ children }) => {
    const [cast, setCast] = React.useState<ApiCastWithContext | undefined>(
      undefined,
    );
    const [inModalContext, setInModalContext] = React.useState<boolean>(false);
    const [feed, setFeed] = React.useState<string | undefined>(undefined);
    const setCastToTakeAction = React.useCallback(
      ({
        cast,
        inModalContext,
        feed,
      }: {
        cast: ApiCastWithContext;
        inModalContext?: boolean;
        feed?: string;
      }) => {
        setCast(cast);
        setInModalContext(inModalContext ?? false);
        setFeed(feed);
      },
      [],
    );

    const clearCastToTakeAction = React.useCallback(() => {
      setCast(undefined);
      setInModalContext(false);
      setFeed(undefined);
    }, []);

    return (
      <CastToTakeActionContext.Provider
        value={{
          cast,
          setCastToTakeAction,
          clearCastToTakeAction,
          inModalContext,
          feed,
        }}
      >
        {children}
      </CastToTakeActionContext.Provider>
    );
  });

CastToTakeActionProvider.displayName = 'CastToTakeActionProvider';

const useCastToTakeAction = () => React.useContext(CastToTakeActionContext);

export { CastToTakeActionProvider, useCastToTakeAction };
