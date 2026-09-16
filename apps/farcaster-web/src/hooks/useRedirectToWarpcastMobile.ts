import { useCallback, useEffect } from 'react';

import { useIsSignedIn } from './data/useIsSignedIn';

function useRedirectToWarpcastMobile() {
  const isSignedIn = useIsSignedIn();

  const redirectWithURI = useCallback(() => {
    const userAgent = navigator.userAgent || navigator.vendor;
    const userIsOnMobile =
      /android/i.test(userAgent) || /iPad|iPhone|iPod/.test(userAgent);
    if (
      !isSignedIn &&
      userIsOnMobile &&
      window.location.href.indexOf('https://farcaster.xyz/') !== -1
    ) {
      // eslint-disable-next-line no-restricted-syntax
      window.location.href = window.location.href.replace(
        'https://farcaster.xyz/',
        'farcaster://',
      );
    }
  }, [isSignedIn]);

  useEffect(() => {
    redirectWithURI();
  }, [redirectWithURI]);
}

export { useRedirectToWarpcastMobile };
