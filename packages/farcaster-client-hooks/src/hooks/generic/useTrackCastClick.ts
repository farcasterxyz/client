import { AnalyticsEvent } from 'farcaster-analytics';
import type { ApiCastFeedIncludeReason } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useTrackEvent } from '../../providers/EventingProvider';
import { getCastInteractionAttribution } from '../../utils/CastInteractionAttributionUtils';
import { getHomeFeedSnapActionProperties } from '../../utils/SnapActionAnalyticsUtils';

export enum CastClickType {
  Author = 'author',
  Cast = 'cast',
  ChannelMention = 'channel mention',
  ExtLink = 'ext link',
  FollowAuthor = 'follow author',
  Frame = 'frame',
  FrameButton = 'frame button',
  Image = 'image',
  IntLink = 'int link',
  Mention = 'mention',
  Mint = 'mint',
  NeynarMiniappCastButton = 'neynar miniapp cast button',
  QuotedCast = 'quoted cast',
  Reply = 'reply',
  ShareDirectCast = 'share dc',
  ShareImage = 'share image',
  ShareLink = 'share link',
  ShareNative = 'share native',
  VideoUnmute = 'video unmute',
  VideoFullscreen = 'video fullscreen',
}

type CastClickData = {
  castHash?: string;
  type: CastClickType;
  feed?: string;
  includeReason?: ApiCastFeedIncludeReason['type'];
  index?: number;
  homeFeedSnapBoostVariant?: string;
};

export const useTrackCastClick = () => {
  const {
    trackEvent,
    trackUrgentInternalEvent,
    trackCastView,
    defaultEventProps,
    defaultCastViewProps,
  } = useTrackEvent();

  return useCallback(
    (data: CastClickData) => {
      const castHash = data.castHash ?? defaultEventProps.castHash;
      const interactionType = `click-${data.type.replace(' ', '-')}`;
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

      if (castHash) {
        // Track with urgency so that we have a higher chance of capturing if user quickly closes app or refreshes
        trackUrgentInternalEvent({
          type: 'cast-interaction',
          data: {
            subType: interactionType,
            castHash,
            ...(data.feed ? { feed: data.feed } : {}),
            ...attribution,
          },
        });

        // Track a view event in case the user quickly clicked or cast was only partially visible
        trackCastView(
          {
            castHash,
            ...(data.feed ? { feed: data.feed } : {}),
            ...(includeReason ? { includeReason } : {}),
            ...(typeof index === 'number' ? { index } : {}),
            ...(homeFeedSnapBoostVariant ? { homeFeedSnapBoostVariant } : {}),
          },
          { urgent: true },
        );
      }

      const snapActionProperties = getHomeFeedSnapActionProperties(
        {
          actionGroup: 'click',
          actionType: data.type,
          interactionType,
          castHash,
          feed: data.feed,
          includeReason,
          index,
          homeFeedSnapBoostVariant,
        },
        defaultCastViewProps,
      );

      if (snapActionProperties) {
        trackEvent(AnalyticsEvent.HomeFeedSnapAction, snapActionProperties);
      }

      trackEvent(AnalyticsEvent.ClickCast, {
        type: data.type,
        ...(data.feed ? { feed: data.feed } : {}),
        ...(includeReason ? { includeReason } : {}),
      });
    },
    [
      defaultEventProps.castHash,
      defaultCastViewProps,
      trackCastView,
      trackEvent,
      trackUrgentInternalEvent,
    ],
  );
};
