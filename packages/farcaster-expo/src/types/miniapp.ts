import { Context } from '@farcaster/miniapp-host-react-native';
import { ApiFrameActionLaunchFrame, ApiUser } from 'farcaster-client-data';

type DevPreviewLaunchContext = {
  type: 'dev_preview';
};

export type LaunchContext = DevPreviewLaunchContext | Context.LocationContext;

export type LaunchFrameParams = {
  context: LaunchContext;
  config: Omit<ApiFrameActionLaunchFrame, 'type'>;
  author?: ApiUser;
  debug?: boolean;
  onComplete?: () => void;
  skipConfirmation?: boolean;
  // Set by callers that already know the frame is harmful (e.g. a cast embed
  // with `frame.harmful === true`). Propagated into the launch config so the
  // mini-app shell can hard-block synchronously (NEYN-11871).
  harmful?: boolean;
};
