import { ApiCast } from 'farcaster-client-data';
import React from 'react';

type ComposerContextValue = {
  parentCast: ApiCast | undefined;
  onParentCastLoad: ({
    parentCast,
  }: {
    parentCast: ApiCast | undefined;
  }) => void;
};

const ComposerContext = React.createContext<ComposerContextValue>({} as never);

export function ComposerParentCastProvider({
  children,
}: React.PropsWithChildren) {
  const [parentCast, setParentCast] = React.useState<ApiCast | undefined>();

  const onParentCastLoad = React.useCallback(
    ({ parentCast: pc }: { parentCast: ApiCast | undefined }) => {
      if (
        typeof parentCast === 'undefined' ||
        typeof pc === 'undefined' ||
        parentCast.hash !== pc.hash
      ) {
        setParentCast(pc);
      }
    },
    [parentCast],
  );

  return React.useMemo(
    () => (
      <ComposerContext.Provider value={{ onParentCastLoad, parentCast }}>
        {children}
      </ComposerContext.Provider>
    ),
    [children, onParentCastLoad, parentCast],
  );
}

export const useComposer = () => {
  return React.useContext(ComposerContext);
};

ComposerParentCastProvider.displayName = 'ComposerParentCastProvider';
