import { useRoute } from '@react-navigation/native';
import { useCallback } from 'react';

import { useHeader } from '~/contexts/HeaderProvider';
import { HeaderOptions } from '~/types';

const useUpdateHeaderOptions = () => {
  const { key } = useRoute();
  const { setHeaderOptions } = useHeader();

  return useCallback(
    (options: HeaderOptions) => {
      return setHeaderOptions(key, options);
    },
    [key, setHeaderOptions],
  );
};

export { useUpdateHeaderOptions };
