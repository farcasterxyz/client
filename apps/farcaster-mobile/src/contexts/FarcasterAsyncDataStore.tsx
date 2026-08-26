import { FarcasterAsyncDataStore } from 'farcaster-cryptography-react-native';
import { createContext, useContext } from 'react';

type FarcasterAsyncDataStoreContextValue = {
  dataStore: FarcasterAsyncDataStore;
};

const FarcasterAsyncDataStoreContext =
  createContext<FarcasterAsyncDataStoreContextValue>({
    dataStore: new FarcasterAsyncDataStore(),
  });

const useFarcasterAsyncDataStore = () =>
  useContext(FarcasterAsyncDataStoreContext);

export { useFarcasterAsyncDataStore };
