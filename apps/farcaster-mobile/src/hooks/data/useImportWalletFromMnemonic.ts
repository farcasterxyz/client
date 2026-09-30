import { useAuthToken } from '~/contexts/AuthTokenProvider';

const useImportWalletFromMnemonic = () => {
  return useAuthToken().signInWithMnemonic;
};

export { useImportWalletFromMnemonic };
