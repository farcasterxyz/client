import { FarcasterCryptographyKeyStore } from 'farcaster-cryptography-react-native';
import { createContext, useContext } from 'react';

type FarcasterCryptographyKeyStoreContextValue = {
  keyStore: FarcasterCryptographyKeyStore;
};

const FarcasterCryptographyKeyStoreContext =
  createContext<FarcasterCryptographyKeyStoreContextValue>({
    keyStore: new FarcasterCryptographyKeyStore('farcaster'),
  });

const useFarcasterCryptographyKeyStore = () =>
  useContext(FarcasterCryptographyKeyStoreContext);

export { useFarcasterCryptographyKeyStore };
