import {
  BookmarkError,
  CastReactionType,
  useBookmarkCast,
  useRemoveCastBookmark,
  useTrackCastReaction,
} from 'farcaster-client-hooks';
import { useRootToast } from 'farcaster-expo';
import React, {
  memo,
  MutableRefObject,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { Pressable } from 'react-native';
import { Path, Svg } from 'react-native-svg';

import { useTheme } from '~/contexts/ThemeProvider';
import { useHaptics } from '~/hooks/useHaptics';
import { trackError } from '~/utils/ErrorUtils';

import { CastActionsBarProps } from './types';

const hitSlopValues = {
  left: 11,
  top: 11,
  right: 11,
  bottom: 11,
};

type BookmarkIconProps = {
  active: boolean;
};

export const BookmarkIcon = memo(({ active }: BookmarkIconProps) => {
  const t = useTheme();

  if (active) {
    return (
      <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
        <Path
          fill="#8B99A4"
          stroke="#8B99A4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12.667 14 8 11.333 3.333 14V3.333A1.333 1.333 0 0 1 4.668 2h6.667a1.333 1.333 0 0 1 1.333 1.333V14Z"
        />
      </Svg>
    );
  }

  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path
        stroke={t.colors.text.tertiary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12.667 14 8 11.333 3.333 14V3.333A1.333 1.333 0 0 1 4.668 2h6.667a1.333 1.333 0 0 1 1.333 1.333V14Z"
      />
    </Svg>
  );
});

const Bookmarks = memo(
  ({
    castRef,
    bookmarked,
  }: {
    castRef: MutableRefObject<CastActionsBarProps['cast']>;
    bookmarked: boolean;
  }) => {
    const t = useTheme();
    const { triggerImpactAsync } = useHaptics();

    const trackCastReaction = useTrackCastReaction();
    const toast = useRootToast();

    const bookmark = useBookmarkCast();
    const removeBookmark = useRemoveCastBookmark();

    const isSubmitting = useRef(false);

    const onPress = useCallback(async () => {
      if (isSubmitting.current) {
        return;
      }
      isSubmitting.current = true;

      triggerImpactAsync();

      trackCastReaction({
        castHash: castRef.current.hash,
        type: CastReactionType.Bookmark,
        undo: bookmarked,
        castFid: castRef.current.author.fid,
      });

      try {
        if (bookmarked) {
          try {
            removeBookmark({ cast: castRef.current });

            toast.hideAll();
            toast.show('Removed from bookmarks', {
              type: 'castBookmarkRemoved',
              duration: 3000,
              placement: 'bottom',
            });
          } catch (error) {
            toast.show('Failed to remove bookmark from cast', {
              type: 'danger',
            });
            const bookmarkError = new BookmarkError({
              error,
              hash: castRef.current.hash,
            });
            trackError(bookmarkError);
            throw bookmarkError;
          }
        } else {
          try {
            bookmark({ cast: castRef.current });

            toast.hideAll();
            toast.show('Added to bookmarks', {
              type: 'castBookmarked',
              duration: 5000,
              placement: 'bottom',
            });
          } catch (error) {
            toast.show('Failed to bookmark cast', { type: 'danger' });
            const bookmarkError = new BookmarkError({
              error,
              hash: castRef.current.hash,
            });
            trackError(bookmarkError);
            throw bookmarkError;
          }
        }
      } finally {
        isSubmitting.current = false;
      }
    }, [
      bookmark,
      bookmarked,
      castRef,
      removeBookmark,
      toast,
      trackCastReaction,
      triggerImpactAsync,
    ]);

    const stylePressable = useMemo(
      () => [t.flexRow, t.itemsCenter],
      [t.flexRow, t.itemsCenter],
    );

    return (
      <Pressable
        hitSlop={hitSlopValues}
        style={stylePressable}
        onPress={onPress}
      >
        <BookmarkIcon active={bookmarked} />
      </Pressable>
    );
  },
);

Bookmarks.displayName = 'Bookmarks';

export { Bookmarks };
