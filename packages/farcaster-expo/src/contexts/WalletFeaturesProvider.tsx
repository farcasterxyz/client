import * as React from 'react';

type SupportedFeatures = {
  walletExport?: boolean;
  walletOnRamp?: boolean;
};

type WalletFeaturesContextType = {
  supportedFeatures: SupportedFeatures;
};

const WalletFeaturesContext = React.createContext<WalletFeaturesContextType>({
  supportedFeatures: {},
});

const useWalletFeatures = () => React.useContext(WalletFeaturesContext);

type WalletFeaturesProviderProps = {
  supportedFeatures: SupportedFeatures;
  children: React.ReactNode;
};

function WalletFeaturesProvider({
  supportedFeatures,
  children,
}: WalletFeaturesProviderProps) {
  const context = React.useMemo(
    () => ({ supportedFeatures }),
    [supportedFeatures],
  );
  return (
    <WalletFeaturesContext.Provider value={context}>
      {children}
    </WalletFeaturesContext.Provider>
  );
}

export { useWalletFeatures, WalletFeaturesProvider };
