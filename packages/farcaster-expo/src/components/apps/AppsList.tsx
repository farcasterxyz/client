import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiCast } from 'farcaster-client-data';
import {
  CastReactionType,
  useCreateCastLike,
  useDeleteCastLike,
  useGloballyCachedCast,
  useTrackCastReaction,
  useTrackEvent,
} from 'farcaster-client-hooks';
import React, { FC, memo, useCallback, useEffect, useRef } from 'react';
import { View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { useHaptics } from '../../hooks';
import { AppsCard } from './AppsCard';
import { AppsSectionHeader } from './AppsSectionHeader';

export type AppsAppItem = {
  id: string;
  icon: string;
  title: string;
  description: string;
  tags: string[];
  author: string;
  authorFid?: number;
  authorPfpUrl?: string;
  likeCount: number;
  commentCount: number;
  featured?: boolean;
  isLiked?: boolean;
  /** When present the card subscribes to the global cast cache for live like state */
  castFallback?: ApiCast;
};

export type AppsSection = {
  title: string;
  dateRange: string;
  subtitle?: string;
  apps: AppsAppItem[];
};

export type AppsListProps = {
  sections: AppsSection[];
  onCardPress?: (app: AppsAppItem) => void;
  onAddPress?: (app: AppsAppItem) => void;
  onLikePress?: (app: AppsAppItem) => void;
  onCommentPress?: (app: AppsAppItem) => void;
  onAuthorPress?: (app: AppsAppItem) => void;
  hideSectionHeader?: boolean;
};

type CastAppsCardProps = {
  app: AppsAppItem;
  castFallback: ApiCast;
  onCardPress?: () => void;
  onAddPress?: () => void;
  onCommentPress?: () => void;
  onAuthorPress?: () => void;
};

const CastAppsCard: FC<CastAppsCardProps> = memo(
  ({
    app,
    castFallback,
    onCardPress,
    onAddPress,
    onCommentPress,
    onAuthorPress,
  }) => {
    const cast = useGloballyCachedCast({ fallback: castFallback });
    const createCastLike = useCreateCastLike();
    const deleteCastLike = useDeleteCastLike();
    const isSubmitting = useRef(false);
    const toast = useToast();
    const { triggerImpactAsync } = useHaptics();
    const { trackEvent } = useTrackEvent();
    const trackCastReaction = useTrackCastReaction();

    // Keep a ref to always use the latest cast in async handlers (avoids stale closure)
    const castRef = useRef<ApiCast>(cast);
    useEffect(() => {
      castRef.current = cast;
    }, [cast]);

    const isLiked = cast.viewerContext?.reacted ?? false;
    const likeCount = cast.reactions.count;

    const handleLikePress = useCallback(async () => {
      if (isSubmitting.current) return;
      isSubmitting.current = true;

      trackEvent(AnalyticsEvent.ProductLaunchClickLike, {
        castHash: cast.hash,
        title: app.title,
        authorFid: cast.author.fid,
        isLiked,
        source: 'card',
      });
      trackCastReaction({
        castHash: cast.hash,
        type: CastReactionType.Like,
        undo: isLiked,
        castFid: cast.author.fid,
        feed: 'product-launch',
      });

      if (!isLiked) {
        triggerImpactAsync();
      }

      try {
        if (isLiked) {
          try {
            await deleteCastLike({ cast: castRef.current });
          } catch {
            toast.show('Failed to unlike.', { type: 'danger' });
          }
        } else {
          try {
            await createCastLike({ cast: castRef.current });
          } catch {
            toast.show('Failed to like.', { type: 'danger' });
          }
        }
      } finally {
        isSubmitting.current = false;
      }
    }, [
      isLiked,
      createCastLike,
      deleteCastLike,
      toast,
      triggerImpactAsync,
      trackEvent,
      trackCastReaction,
      cast,
      app.title,
    ]);

    return (
      <AppsCard
        icon={app.icon}
        title={app.title}
        description={app.description}
        tags={app.tags}
        author={app.author}
        authorFid={app.authorFid}
        authorPfpUrl={app.authorPfpUrl}
        likeCount={likeCount}
        commentCount={app.commentCount}
        featured={app.featured}
        isLiked={isLiked}
        onCardPress={onCardPress}
        onAddPress={onAddPress}
        onLikePress={handleLikePress}
        onCommentPress={onCommentPress}
        onAuthorPress={onAuthorPress}
      />
    );
  },
);

CastAppsCard.displayName = 'CastAppsCard';

export const AppsList: FC<AppsListProps> = memo(
  ({
    sections,
    onCardPress,
    onAddPress,
    onLikePress,
    onCommentPress,
    onAuthorPress,
    hideSectionHeader = false,
  }) => {
    return (
      <View style={{ flexDirection: 'column' }}>
        {sections.map((section) => (
          <View key={`${section.title}-${section.dateRange}`}>
            {!hideSectionHeader ? (
              <AppsSectionHeader
                title={section.title}
                dateRange={section.dateRange}
              />
            ) : null}

            <View style={{ flexDirection: 'column' }}>
              {section.apps.map((app) =>
                app.castFallback ? (
                  <CastAppsCard
                    key={app.id}
                    app={app}
                    castFallback={app.castFallback}
                    onCardPress={() => onCardPress?.(app)}
                    onAddPress={() => onAddPress?.(app)}
                    onCommentPress={() => onCommentPress?.(app)}
                    onAuthorPress={() => onAuthorPress?.(app)}
                  />
                ) : (
                  <AppsCard
                    key={app.id}
                    icon={app.icon}
                    title={app.title}
                    description={app.description}
                    tags={app.tags}
                    author={app.author}
                    authorFid={app.authorFid}
                    authorPfpUrl={app.authorPfpUrl}
                    likeCount={app.likeCount}
                    commentCount={app.commentCount}
                    featured={app.featured}
                    isLiked={app.isLiked}
                    onCardPress={() => onCardPress?.(app)}
                    onAddPress={() => onAddPress?.(app)}
                    onLikePress={() => onLikePress?.(app)}
                    onCommentPress={() => onCommentPress?.(app)}
                    onAuthorPress={() => onAuthorPress?.(app)}
                  />
                ),
              )}
            </View>
          </View>
        ))}
      </View>
    );
  },
);

AppsList.displayName = 'AppsList';
