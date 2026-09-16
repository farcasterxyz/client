import {
  useCastHasBlockedUrl,
  useGloballyCachedCast,
} from 'farcaster-client-hooks';
import { FC, memo, useMemo } from 'react';

import { BlockedByDomainPlaceholder } from '~/components/casts/BlockedByDomainPlaceholder';
// eslint-disable-next-line no-restricted-imports
import { FocusedCast } from '~/components/casts/FocusedCast';
import { CastProps } from '~/components/casts/types';
// eslint-disable-next-line no-restricted-imports
import { UnfocusedCast } from '~/components/casts/UnfocusedCast';
import { useIsAdmin } from '~/hooks/data/useIsAdmin';

const Cast: FC<CastProps> = memo(
  ({
    castWithContext: { cast: fallbackCast, context },
    castOpenIncludeReason,
    isAdminGatedFeedCast = false,
  }) => {
    const cast = useGloballyCachedCast({ fallback: fallbackCast });
    const isAdmin = useIsAdmin();
    const castHasBlockedUrl = useCastHasBlockedUrl();

    const castWithContext = useMemo(() => ({ cast, context }), [cast, context]);

    // Admin-only diagonal stripe styling for specific feed include reasons.
    // Intentionally kept separate from cast translations (visible to everyone).
    const showAdminGatedFeedCastStyling = isAdmin && isAdminGatedFeedCast;

    if (castHasBlockedUrl(cast)) {
      // Show admins a placeholder so they can verify the block landed and audit
      // what's being hidden. Non-admins see nothing — the cast is hidden.
      return isAdmin ? <BlockedByDomainPlaceholder /> : null;
    }

    return context.isFocused ? (
      <FocusedCast
        castWithContext={castWithContext}
        castOpenIncludeReason={castOpenIncludeReason}
        isAdminGatedFeedCast={showAdminGatedFeedCastStyling}
      />
    ) : (
      <UnfocusedCast
        castWithContext={castWithContext}
        isAdminGatedFeedCast={showAdminGatedFeedCastStyling}
      />
    );
  },
);

Cast.displayName = 'Cast';

export { Cast };
