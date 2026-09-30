import { FC, memo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { useScrollToTopOfRoot } from '~/hooks/useScrollToTopOfRoot';
const ScrollToTop: FC = memo(() => {
  const scrollToTopOfRoot = useScrollToTopOfRoot();
  const location = useLocation();

  useEffect(() => {
    scrollToTopOfRoot();
  }, [scrollToTopOfRoot, location.pathname]);

  return null;
});

ScrollToTop.displayName = 'ScrollToTop';

export { ScrollToTop };
