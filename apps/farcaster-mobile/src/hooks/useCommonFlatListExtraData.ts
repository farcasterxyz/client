import { useMemo } from 'react';

import { useTheme } from '~/contexts/ThemeProvider';

const useCommonFlatListExtraData = () => {
  const { dark } = useTheme();

  return useMemo(() => [dark], [dark]);
};

export { useCommonFlatListExtraData };
