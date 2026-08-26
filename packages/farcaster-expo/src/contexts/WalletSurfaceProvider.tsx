import * as React from 'react';

export type WalletSurface = 'mini_app_modal' | 'full_warplet';

type WalletSurfaceContextType = {
  surface: WalletSurface;
};

const WalletSurfaceContext = React.createContext<WalletSurfaceContextType>({
  surface: 'full_warplet',
});

const useWalletSurface = () => React.useContext(WalletSurfaceContext);

type WalletSurfaceProviderProps = {
  surface: WalletSurface;
  children: React.ReactNode;
};

function WalletSurfaceProvider({
  surface,
  children,
}: WalletSurfaceProviderProps) {
  const context = React.useMemo(() => ({ surface }), [surface]);
  return (
    <WalletSurfaceContext.Provider value={context}>
      {children}
    </WalletSurfaceContext.Provider>
  );
}

export { useWalletSurface, WalletSurfaceProvider };
