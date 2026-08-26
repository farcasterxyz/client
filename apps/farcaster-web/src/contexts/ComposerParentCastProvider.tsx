import { ApiCast } from 'farcaster-client-data';
import React from 'react';

type ComposerContextValue = {
  parentCast: ApiCast | undefined;
  onParentCastLoad: ({ parentCast }: { parentCast: ApiCast }) => void;
  clearParentCast: () => void;
};

const ComposerContext = React.createContext<ComposerContextValue>({} as never);

export function ComposerParentCastProvider({
  children,
}: React.PropsWithChildren) {
  const [parentCast, setParentCast] = React.useState<ApiCast | undefined>();

  const onParentCastLoad = React.useCallback(
    ({ parentCast: pc }: { parentCast: ApiCast }) => {
      if (typeof parentCast === 'undefined' || parentCast.hash !== pc.hash) {
        setParentCast(pc);
      }
    },
    [parentCast],
  );

  const clearParentCast = React.useCallback(() => {
    setParentCast(undefined);
  }, []);

  return React.useMemo(
    () => (
      <ComposerContext.Provider
        value={{ onParentCastLoad, clearParentCast, parentCast }}
      >
        {children}
      </ComposerContext.Provider>
    ),
    [children, onParentCastLoad, clearParentCast, parentCast],
  );
}

export const useComposer = () => {
  return React.useContext(ComposerContext);
};

ComposerParentCastProvider.displayName = 'ComposerParentCastProvider';
