import { preserveQueryParams } from 'farcaster-client-data';
import {
  type ResolvedMiniAppConfig,
  useResolveMiniAppConfig,
} from 'farcaster-client-hooks';
import { useCallback } from 'react';

import type { LaunchContext } from '~/contexts/MiniAppProvider';
import { useMinimizableWindowContext } from '~/contexts/MinimizableWindowProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';

type OpenMiniAppFromSnapOptions = {
  url: string;
  sourceUrl: string | null;
  context: LaunchContext;
  debug?: boolean;
};

/**
 * Resolves a mini app config from a snap target URL and launches it.
 * Falls back to a standalone launch if manifest resolution fails.
 * Preserves query params from the original target URL.
 */
function useOpenMiniAppFromSnap() {
  const { launchMiniApp } = useMinimizableWindowContext();
  const resolveMiniAppConfig = useResolveMiniAppConfig();
  const currentUser = useCurrentUser();

  return useCallback(
    ({ url, context, debug }: OpenMiniAppFromSnapOptions) => {
      const parsed = new URL(url);

      void resolveMiniAppConfig(url)
        .then((config: ResolvedMiniAppConfig) => {
          launchMiniApp({
            context,
            launchConfig: {
              type: 'manifest',
              url: preserveQueryParams({
                launchUrl: config.url,
                sourceUrl: url,
              }),
            },
            skipConfirmation: true,
            debug,
          });
        })
        .catch(() => {
          launchMiniApp({
            context,
            launchConfig: {
              type: 'standalone',
              name: parsed.hostname,
              url,
              author: currentUser,
            },
            skipConfirmation: true,
            debug,
          });
        });
    },
    [currentUser, launchMiniApp, resolveMiniAppConfig],
  );
}

export { useOpenMiniAppFromSnap };
export type { OpenMiniAppFromSnapOptions };
