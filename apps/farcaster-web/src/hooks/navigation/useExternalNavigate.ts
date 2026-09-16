import { isAllowedProtocol } from 'farcaster-client-data';
import { useCallback } from 'react';

const useExternalNavigate = () => {
  return useCallback(
    ({ to, openInNewTab }: { to: string; openInNewTab: boolean }) => {
      if (window.open && isAllowedProtocol(to)) {
        window.open(to, openInNewTab ? '_blank' : '_self', 'noopener');
      }
    },
    [],
  );
};

export { useExternalNavigate };
