import {
  CastReactionType,
  useBookmarkCast,
  useRemoveCastBookmark,
  useTrackCastReaction,
} from 'farcaster-client-hooks';
import { FC, memo, useMemo, useState } from 'react';

import { CastReactionAction } from '~/components/casts/actions/CastReactionAction';
import { CastActionProps } from '~/components/casts/actions/types';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { trackError } from '~/utils/errorUtils';
import { toast } from '~/utils/toast';

type BookmarkIconProps = {
  active: boolean;
};

const BookmarkIcon: React.FC<BookmarkIconProps> = ({ active }) => {
  if (active) {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path
          d="M3.375 3.09375C3.375 2.007 4.257 1.125 5.34375 1.125H12.6562C13.743 1.125 14.625 2.007 14.625 3.09375V16.0312C14.625 16.1912 14.5796 16.348 14.494 16.4831C14.4083 16.6183 14.286 16.7263 14.1413 16.7946C13.9966 16.8629 13.8355 16.8886 13.6767 16.8688C13.518 16.8489 13.3681 16.7844 13.2446 16.6826L9 13.1872L4.75538 16.6826C4.63177 16.7839 4.48196 16.8481 4.32336 16.8676C4.16475 16.8872 4.00384 16.8614 3.85932 16.7932C3.71479 16.725 3.59257 16.6172 3.50684 16.4823C3.42112 16.3475 3.3754 16.1911 3.375 16.0312V3.09375Z"
          fill="#8A63D2"
        />
      </svg>
    );
  }

  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M13.875 16.0312V16.0315C13.875 16.0493 13.87 16.0667 13.8604 16.0817C13.8509 16.0967 13.8373 16.1087 13.8213 16.1163C13.8052 16.1239 13.7873 16.1267 13.7696 16.1245C13.752 16.1223 13.7353 16.1152 13.7216 16.1039L13.7214 16.1037L9.47676 12.6083L9 12.2157L8.52324 12.6083L4.28001 16.1025C4.27987 16.1026 4.27974 16.1027 4.2796 16.1028C4.2658 16.114 4.24913 16.1211 4.23149 16.1233C4.21368 16.1255 4.19561 16.1226 4.17939 16.1149C4.16315 16.1073 4.14943 16.0952 4.1398 16.08C4.13026 16.065 4.12513 16.0476 4.125 16.0298V3.09375C4.125 2.42121 4.67121 1.875 5.34375 1.875H12.6562C13.3288 1.875 13.875 2.42121 13.875 3.09375V16.0312Z"
        stroke={'#9FA3AF'}
        strokeWidth="1.5"
      />
    </svg>
  );
};

const Bookmarks: FC<CastActionProps> = memo(
  ({ cast, isFocused, includeReason }) => {
    const isSignedIn = useIsSignedIn();
    const trackCastReaction = useTrackCastReaction();
    const bookmarkCast = useBookmarkCast();
    const removeCastBookmark = useRemoveCastBookmark();

    const [isSubmitting, setIsSubmitting] = useState(false);

    const bookmarked = useMemo(() => {
      return cast.viewerContext?.bookmarked || false;
    }, [cast.viewerContext?.bookmarked]);

    return (
      <CastReactionAction
        icon={<BookmarkIcon active={bookmarked} />}
        // We never want to show count for bookmarks
        count={0}
        isActive={bookmarked}
        isFocused={!!isFocused}
        variant="purple"
        disabled={!isSignedIn}
        onClick={async () => {
          if (isSubmitting || !isSignedIn) {
            return;
          }

          try {
            trackCastReaction({
              castHash: cast.hash,
              type: CastReactionType.Bookmark,
              undo: !!bookmarked,
              castFid: cast.author.fid,
              ...(includeReason ? { includeReason } : {}),
            });

            if (bookmarked) {
              try {
                await removeCastBookmark({ cast });

                toast({
                  message: 'Removed from bookmarks',
                  toastId: 'bookmarking-toast',
                });
              } catch (error) {
                // TODO: Add proper UI for error
                trackError(error);
                alert(error);
              }
            } else {
              try {
                await bookmarkCast({ cast });

                toast({
                  message: 'Added to bookmarks',
                  toastId: 'bookmarking-toast',
                });
              } catch (error) {
                // TODO: Add proper UI for error
                trackError(error);
                alert(error);
              }
            }
          } finally {
            setIsSubmitting(false);
          }
        }}
      />
    );
  },
);

Bookmarks.displayName = 'Bookmarks';

export { Bookmarks };
