import React, { createContext, FC, memo, ReactNode, useContext } from 'react';

type ScreenContextValue = {
  insetTop: boolean;
};

const ScreenContext = createContext<ScreenContextValue>({
  insetTop: false,
});

type ScreenProviderProps = ScreenContextValue & {
  children: ReactNode;
};

const ScreenProvider: FC<ScreenProviderProps> = memo(
  ({ children, insetTop }) => {
    return (
      <ScreenContext.Provider value={{ insetTop }}>
        {children}
      </ScreenContext.Provider>
    );
  },
);

const useScreen = () => useContext(ScreenContext);

export { ScreenProvider, useScreen };
