import { ApiUser } from 'farcaster-client-data';

import { LaunchContext } from '~/hooks/useLaunchFrame';

export type StandaloneLaunchMiniAppConfig = {
  type: 'standalone';
  url: string;
  name: string;
  splashImageUrl?: string;
  splashBackgroundColor?: string;
  author?: ApiUser;
  // Set by callers that already know the frame is harmful (e.g. a cast embed
  // with `frame.harmful === true`). Lets `MiniAppContentInner` hard-block
  // synchronously without waiting for its own frame-details fetch (NEYN-11871).
  harmful?: boolean;
  queryParams?: Record<string, string>;
  path?: string;
  timestamp: number;
};

export type ManifestLaunchMiniAppConfig = {
  type: 'manifest';
  id?: string;
  domain?: string;
  url?: string;
  queryParams?: Record<string, string>;
  path?: string;
  timestamp: number;
};

export type MiniAppProps<
  TConfig = StandaloneLaunchMiniAppConfig | ManifestLaunchMiniAppConfig,
> = {
  id?: string;
  launchConfig: TConfig;
  context: LaunchContext;
  debug?: boolean;
  hideHeader?: boolean;
  externalMenuVisible?: boolean;
  onExternalMenuDismiss?: () => void;
};
