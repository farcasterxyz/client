import { useUpdateUser } from 'farcaster-client-hooks';
import { useCallback, useState } from 'react';

const useAvatarSelectorState = () => {
  const updateUser = useUpdateUser();

  const [imageUrl, setImageUrl] = useState<string>();

  const submit = useCallback(async () => {
    if (!imageUrl) {
      return;
    }
    await updateUser({ pfp: imageUrl });
  }, [imageUrl, updateUser]);

  return {
    imageUrl,
    setImageUrl,
    submit,
  };
};

export { useAvatarSelectorState };
