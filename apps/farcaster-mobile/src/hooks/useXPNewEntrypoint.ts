import { useMMKVBoolean } from 'react-native-mmkv';

export const useXPNewEntrypoint = () => {
  const [xpNewEntrypointSeen, setHasSeenXPNewEntrypoint] = useMMKVBoolean(
    'xp_new_entrypoint_3',
  );

  return {
    xpNewEntrypointSeen,
    setHasSeenXPNewEntrypoint,
  };
};
