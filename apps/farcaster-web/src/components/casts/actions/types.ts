import { ApiCast, ApiCastFeedIncludeReason } from 'farcaster-client-data';

export type CastActionProps = {
  cast: ApiCast;
  isFocused?: boolean;
  disabled?: boolean;
  includeReason?: ApiCastFeedIncludeReason['type'];
};
