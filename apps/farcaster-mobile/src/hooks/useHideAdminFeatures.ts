import { useMMKVBoolean } from 'react-native-mmkv';

export const useHideAdminFeatures = () => {
  return useMMKVBoolean('admin-tools-hide-admin-features');
};
