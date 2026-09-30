import { addPathToUrl, injectQueryParams } from 'farcaster-client-data';
import {
  useFrameDetails,
  useGloballyCachedFrame,
} from 'farcaster-client-hooks';
import React from 'react';

import { FullScreenLoadingIndicator } from '~/components/loaders/FullScreenLoadingIndicator';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { useParams } from '~/hooks/navigation/useParams';
import { useSearchParams } from '~/hooks/navigation/useSearchParams';
import { useRedirectToWarpcastMobile } from '~/hooks/useRedirectToWarpcastMobile';
import { HomeLandingPage } from '~/lazy/pages';

const LaunchMiniAppPage: React.FC = React.memo(() => {
  const isSignedIn = useIsSignedIn();

  const navigate = useNavigate();

  useRedirectToWarpcastMobile();

  const {
    domain: domainParam,
    url,
    ...extraParams
  } = useSearchParams('launchMiniApp');
  const { id, '*': path } = useParams('miniAppsCanonical');
  const domain = (() => {
    if (url) {
      return new URL(url).hostname;
    }

    return domainParam;
  })();

  const { data } = useFrameDetails({
    domain: id ? undefined : domain,
    id,
  });
  const frame = useGloballyCachedFrame(data);

  const queryParams = Object.entries(extraParams).reduce(
    (acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, string>,
  );

  React.useEffect(() => {
    if (!frame || frame.harmful) {
      navigate({
        to: 'miniApps',
        params: {},
        searchParams: {},
      });
      return;
    }

    if (isSignedIn) {
      navigate({
        to: 'homeFeed',
        params: {},
        searchParams: {
          launchFrameUrl: injectQueryParams(
            addPathToUrl(url ?? frame.homeUrl, path),
            queryParams,
          ),
        },
      });
    }
  }, [frame, domain, isSignedIn, navigate, url, queryParams, path]);

  return (
    <>{isSignedIn ? <FullScreenLoadingIndicator /> : <HomeLandingPage />}</>
  );
});

LaunchMiniAppPage.displayName = 'LaunchMiniAppPage';

export { LaunchMiniAppPage };
