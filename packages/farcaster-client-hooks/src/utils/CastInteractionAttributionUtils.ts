import type { ApiCastFeedIncludeReason } from 'farcaster-client-data';

import type { CastViewTrackingData } from '../providers/InternalEventingProvider';

type CastInteractionAttributionInput = {
  includeReason?: ApiCastFeedIncludeReason['type'];
  index?: number;
  homeFeedSnapBoostVariant?: string;
};

export const getCastInteractionAttribution = (
  data: CastInteractionAttributionInput,
  defaultCastViewProps: Partial<CastViewTrackingData>,
) => {
  const includeReason =
    data.includeReason ?? defaultCastViewProps.includeReason;
  const position = data.index ?? defaultCastViewProps.index;
  const homeFeedSnapBoostVariant =
    data.homeFeedSnapBoostVariant ??
    defaultCastViewProps.homeFeedSnapBoostVariant;

  return {
    ...(includeReason ? { reason: includeReason } : {}),
    ...(typeof position === 'number' ? { position } : {}),
    ...(homeFeedSnapBoostVariant ? { homeFeedSnapBoostVariant } : {}),
  };
};
