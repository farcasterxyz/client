import { useCallback } from 'react';

const useNavigateInNewTab = () => {
  return useCallback(({ href }: { href: string }) => {
    if (href.startsWith('/') && !href.startsWith('//')) {
      window.open(href, '_blank', 'noopener');
    }
  }, []);
};

export { useNavigateInNewTab };
