import type { ApiCastFeedIncludeReason } from 'farcaster-client-data';

import type { EventV2Props } from '../providers/EventingProvider';
import type { CastViewTrackingData } from '../providers/InternalEventingProvider';

type SnapActionAnalyticsInput = {
  actionGroup: 'click' | 'reaction';
  actionType: string;
  interactionType?: string;
  castHash?: string;
  feed?: string;
  includeReason?: ApiCastFeedIncludeReason['type'];
  index?: number;
  homeFeedSnapBoostVariant?: string;
  undo?: boolean;
};

export const getHomeFeedSnapActionProperties = (
  data: SnapActionAnalyticsInput,
  defaultCastViewProps: Partial<CastViewTrackingData>,
): EventV2Props => {
  const includeReason =
    data.includeReason ?? defaultCastViewProps.includeReason;

  if (includeReason !== 'snap-promoted') {
    return undefined;
  }

  const position = data.index ?? defaultCastViewProps.index;
  const homeFeedSnapBoostVariant =
    data.homeFeedSnapBoostVariant ??
    defaultCastViewProps.homeFeedSnapBoostVariant;

  return {
    action_group: data.actionGroup,
    action_type: data.actionType,
    interaction_type: data.interactionType ?? data.actionType,
    reason: includeReason,
    includeReason,
    ...(typeof data.undo === 'boolean' ? { undo: data.undo } : {}),
    ...(data.castHash ? { castHash: data.castHash } : {}),
    ...(data.feed ? { feed: data.feed } : {}),
    ...(typeof position === 'number' ? { index: position, position } : {}),
    ...(homeFeedSnapBoostVariant
      ? {
          homeFeedSnapBoostVariant,
          home_feed_snap_boost_variant: homeFeedSnapBoostVariant,
        }
      : {}),
  };
};
