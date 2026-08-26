import { AnalyticsEvent } from 'farcaster-analytics';
import type { ApiCastFeedIncludeReason, ApiChain } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useTrackEvent } from '../../providers/EventingProvider';
import { getCastInteractionAttribution } from '../../utils/CastInteractionAttributionUtils';
import { getHomeFeedSnapActionProperties } from '../../utils/SnapActionAnalyticsUtils';

export enum CastReactionType {
  Bookmark = 'bookmark',
  Collect = 'collect',
  Like = 'like',
  Quote = 'quote',
  Recast = 'recast',
  Reply = 'reply',
  Report = 'report',
}

type CastReactionData = {
  castHash: string;
  type: CastReactionType;
  undo: boolean;
  castFid?: number;
  chain?: ApiChain;
  ca?: string;
  feed?: string;
  includeReason?: ApiCastFeedIncludeReason['type'];
  index?: number;
  homeFeedSnapBoostVariant?: string;
};

export const useTrackCastReaction = () => {
  const {
    trackCastView,
    trackEvent,
    trackUrgentInternalEvent,
    defaultCastViewProps,
  } = useTrackEvent();

  return useCallback(
    (data: CastReactionData) => {
      const includeReason =
        data.includeReason ?? defaultCastViewProps.includeReason;
      const index = data.index ?? defaultCastViewProps.index;
      const homeFeedSnapBoostVariant =
        data.homeFeedSnapBoostVariant ??
        defaultCastViewProps.homeFeedSnapBoostVariant;
      const attribution = getCastInteractionAttribution(
        {
          includeReason,
          index,
          homeFeedSnapBoostVariant,
        },
        defaultCastViewProps,
      );

      const analyticsEvent =
        data.type === CastReactionType.Bookmark && !data.undo
          ? AnalyticsEvent.CastBookmark
          : data.type === CastReactionType.Collect && !data.undo
            ? AnalyticsEvent.CastCollect
            : data.type === CastReactionType.Report
              ? AnalyticsEvent.CastReport
              : data.undo
                ? AnalyticsEvent.CastDeleteReaction
                : AnalyticsEvent.CastReact;

      const shouldIncludeType =
        analyticsEvent !== AnalyticsEvent.CastBookmark &&
        analyticsEvent !== AnalyticsEvent.CastCollect &&
        analyticsEvent !== AnalyticsEvent.CastReport;
      const interactionType = data.undo ? `undo-${data.type}` : data.type;

      // Track a view event in case the user quickly clicked or cast was only partially visible
      if (!data.undo) {
        // Only track positive reactions
        // Track with urgency so that we have a higher chance of capturing if user immediately closes app or refreshes
        trackUrgentInternalEvent({
          type: 'cast-interaction',
          data: {
            subType: data.type,
            castHash: data.castHash,
            ...(data.feed ? { feed: data.feed } : {}),
            ...attribution,
          },
        });
      }

      // Track a view event in case the user quickly clicked or cast was only partially visible
      trackCastView(
        {
          castHash: data.castHash,
          ...(typeof data.castFid === 'number'
            ? { castAuthorFid: data.castFid }
            : {}),
          ...(data.feed ? { feed: data.feed } : {}),
          ...(includeReason ? { includeReason } : {}),
          ...(typeof index === 'number' ? { index } : {}),
          ...(homeFeedSnapBoostVariant ? { homeFeedSnapBoostVariant } : {}),
        },
        { urgent: true },
      );

      const snapActionProperties = getHomeFeedSnapActionProperties(
        {
          actionGroup: 'reaction',
          actionType: data.type,
          interactionType,
          castHash: data.castHash,
          feed: data.feed,
          includeReason,
          index,
          homeFeedSnapBoostVariant,
          undo: data.undo,
        },
        defaultCastViewProps,
      );

      if (snapActionProperties) {
        trackEvent(AnalyticsEvent.HomeFeedSnapAction, snapActionProperties);
      }

      trackEvent(analyticsEvent, {
        castHash: data.castHash,
        ...(shouldIncludeType ? { type: data.type } : {}),
        ...(typeof data.castFid === 'number'
          ? { author_fid: data.castFid }
          : {}),
        ...(data.chain ? { chain: data.chain } : {}),
        ...(data.ca ? { ca: data.ca } : {}),
        ...(data.feed ? { feed: data.feed } : {}),
        ...(includeReason ? { includeReason } : {}),
      });
    },
    [defaultCastViewProps, trackCastView, trackEvent, trackUrgentInternalEvent],
  );
};
