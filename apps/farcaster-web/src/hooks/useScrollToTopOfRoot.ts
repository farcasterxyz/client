import { useCallback } from 'react';

import { getRoot } from '~/utils/domUtils';

const useScrollToTopOfRoot = () => {
  return useCallback((animate: boolean = false) => {
    const root = getRoot();

    const behavior = animate ? 'smooth' : 'auto';

    window.scrollTo({ top: 0, left: 0, behavior });

    if (root) {
      root.scrollTo({ top: 0, left: 0, behavior });
    }
  }, []);
};

export { useScrollToTopOfRoot };
