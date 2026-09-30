import { useMMKVBoolean } from 'react-native-mmkv';

export const useDevMode = () => {
  const [devMode, setDevMode] = useMMKVBoolean('dev_mode');

  return {
    devMode,
    setDevMode,
  };
};
