import {
  EphemeralDataStore,
  EphemeralKeyStore,
} from 'farcaster-cryptography-web';

const keyStore = new EphemeralKeyStore({});
const dataStore = new EphemeralDataStore();

export { dataStore, keyStore };
