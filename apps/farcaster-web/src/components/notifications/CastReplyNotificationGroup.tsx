import { ApiCastReplyNotificationGroup } from 'farcaster-client-data';
import {
  useCastHasBlockedUrl,
  useGloballyCachedCast,
} from 'farcaster-client-hooks';
import { FC, memo, useMemo } from 'react';

import { BlockedByDomainPlaceholder } from '~/components/casts/BlockedByDomainPlaceholder';
// Notification manually handles globally cached cast so fine to use `UnfocusedCast` directly
// eslint-disable-next-line no-restricted-imports
import { UnfocusedCast } from '~/components/casts/UnfocusedCast';
import { useIsAdmin } from '~/hooks/data/useIsAdmin';
import { buildCastsWithContext } from '~/utils/castUtils';

type CastReplyNotificationGroupProps = {
  notificationGroup: ApiCastReplyNotificationGroup;
};

const CastReplyNotificationGroup: FC<CastReplyNotificationGroupProps> = memo(
  ({ notificationGroup }) => {
    const cast = useGloballyCachedCast({
      fallback: notificationGroup.previewItems[0].content.cast,
    });
    const isAdmin = useIsAdmin();
    const castHasBlockedUrl = useCastHasBlockedUrl();

    const isUnread = notificationGroup.isUnread;

    const castWithContext = useMemo(
      () =>
        buildCastsWithContext([{ cast }], {
          forceThreadPosition: 'start_and_end',
          forceCastHeaderLabelHidden: true,
          isHighlighted: isUnread,
        })[0],
      [cast, isUnread],
    );

    // Mirror Cast.tsx's harmful-domain gate (NEYN-11871).
    if (castHasBlockedUrl(cast)) {
      return isAdmin ? <BlockedByDomainPlaceholder /> : null;
    }

    return <UnfocusedCast castWithContext={castWithContext} />;
  },
);

CastReplyNotificationGroup.displayName = 'CastReplyNotificationGroup';

export { CastReplyNotificationGroup };
