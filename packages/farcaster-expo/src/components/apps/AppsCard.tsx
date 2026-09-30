import { Heart, MessageCircle } from 'lucide-react-native';
import React, { FC, memo, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { useTheme } from '../../contexts';
import { Text2 } from '../design-system';

export type AppsCardProps = {
  icon: string;
  title: string;
  description: string;
  tags: string[];
  author: string;
  authorPfpUrl?: string;
  authorFid?: number;
  likeCount: number;
  commentCount: number;
  featured?: boolean;
  onCardPress?: () => void;
  onAddPress?: () => void;
  onLikePress?: () => void;
  onCommentPress?: () => void;
  onAuthorPress?: () => void;
  isLiked?: boolean;
};

const LIKED_COLOR = '#ef4444'; // red-500

const HeartIcon: React.FC<{ active: boolean; color: string }> = ({
  active,
  color,
}) => {
  const activeColor = active ? LIKED_COLOR : color;
  return (
    <Heart
      color={activeColor}
      fill={active ? LIKED_COLOR : 'transparent'}
      size={20}
    />
  );
};

export const AppsCard: FC<AppsCardProps> = memo(
  ({
    icon,
    title,
    description,
    tags,
    author,
    authorPfpUrl,
    authorFid,
    likeCount,
    commentCount,
    featured = false,
    onCardPress,
    onLikePress,
    onCommentPress,
    onAuthorPress,
    isLiked = false,
  }) => {
    const t = useTheme();
    const [imageError, setImageError] = useState(false);

    return (
      <Pressable
        onPress={onCardPress}
        style={({ pressed }) => [
          styles.cardPressable,
          {
            backgroundColor: pressed
              ? t.colors.background.secondary
              : 'transparent',
          },
        ]}
      >
        <View
          style={[
            styles.container,
            {
              borderBottomColor: t.colors.borderDefault,
              backgroundColor: t.colors.background.default,
            },
          ]}
        >
          <View style={styles.contentWrapper}>
            {/* Icon with Add button – outside cardPressable to avoid nested Pressable issues */}
            <View style={styles.iconContainer}>
              <View
                style={[
                  styles.iconWrapper,
                  { backgroundColor: t.colors.background.tertiary },
                ]}
              >
                {!imageError ? (
                  <Image
                    source={{ uri: icon }}
                    style={styles.icon}
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <Text2
                    style={[styles.iconFallback]}
                    color="inverted"
                    size="2xl"
                    weight="bold"
                  >
                    {title.charAt(0)}
                  </Text2>
                )}
              </View>
            </View>

            {/* Pressable card area: content only */}

            {/* Content */}
            <View style={styles.content}>
              {/* Title and Featured badge */}
              <View style={styles.titleRow}>
                <Text2 weight="semibold" size="lg" numberOfLines={1}>
                  {title}
                </Text2>
                {featured && (
                  <View
                    style={[
                      styles.featuredBadge,
                      { backgroundColor: t.colors.background.quaternary },
                    ]}
                  >
                    <Text2 size="xs" weight="medium" color="brand">
                      Featured
                    </Text2>
                  </View>
                )}
              </View>

              {/* Description */}
              <Text2
                size="base"
                color="secondary"
                style={[styles.description]}
                numberOfLines={2}
              >
                {description}
              </Text2>

              {/* Tags and Author */}
              <View style={styles.tagsRow}>
                {tags.map((tag, index) => (
                  <View
                    key={index}
                    style={[
                      styles.tag,
                      { backgroundColor: t.colors.background.secondary },
                    ]}
                  >
                    <Text2 size="sm" color="tertiary" numberOfLines={1}>
                      {tag}
                    </Text2>
                  </View>
                ))}
                <View style={styles.authorRow}>
                  <Text2 size="sm" color="tertiary">
                    {'by '}
                  </Text2>
                  {authorPfpUrl ? (
                    <Image
                      source={{ uri: authorPfpUrl }}
                      style={styles.authorAvatar}
                    />
                  ) : null}
                  {authorFid && onAuthorPress ? (
                    <View onStartShouldSetResponder={() => true}>
                      <TouchableOpacity
                        onPress={onAuthorPress}
                        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                      >
                        <Text2 size="sm" color="brand" numberOfLines={1}>
                          {author}
                        </Text2>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text2 size="sm" color="tertiary" numberOfLines={1}>
                      {author}
                    </Text2>
                  )}
                </View>
              </View>
            </View>

            {/* Right section - Like and Comment counts (sibling, not child of card Pressable) */}
            <View style={styles.rightSection}>
              {/* Like button with border */}
              <View style={styles.likeButton}>
                <Pressable
                  onPress={onLikePress}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <HeartIcon active={isLiked} color={t.colors.text.tertiary} />
                </Pressable>
                <Text2
                  weight="semibold"
                  size="base"
                  style={isLiked ? { color: LIKED_COLOR } : undefined}
                >
                  {likeCount}
                </Text2>
              </View>

              {/* Comment count */}
              <Pressable
                onPress={onCommentPress}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.commentRow}
              >
                <MessageCircle size={16} color={t.colors.text.tertiary} />
                <Text2 size="base" color="tertiary">
                  {commentCount}
                </Text2>
              </Pressable>
            </View>
          </View>
        </View>
      </Pressable>
    );
  },
);

AppsCard.displayName = 'AppsCard';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderBottomWidth: 1,
    paddingVertical: 16,
  },
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    gap: 12,
  },
  cardPressable: {
    flex: 1,
    borderRadius: 4,
  },
  iconContainer: {
    position: 'relative',
    flexShrink: 0,
    width: 60,
    height: 60,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 60,
    height: 60,
  },
  iconFallback: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featuredBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  description: {
    lineHeight: 20,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  tag: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  rightSection: {
    flexShrink: 0,
    alignItems: 'center',
    gap: 12,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorAvatar: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
});
