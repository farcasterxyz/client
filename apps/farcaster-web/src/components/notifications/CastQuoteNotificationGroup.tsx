import { ApiCastQuoteNotificationGroup } from 'farcaster-client-data';
import {
  useCastHasBlockedUrl,
  useGloballyCachedCast,
} from 'farcaster-client-hooks';
import React from 'react';

import { GitHubTopHatIcon } from '~/components/casts/actions/icons/GitHubTopHatIcon';
import { XTopHatIcon } from '~/components/casts/actions/icons/XTopHatIcon';
import { BlockedByDomainPlaceholder } from '~/components/casts/BlockedByDomainPlaceholder';
import { FeedItemTopHatContainer } from '~/components/casts/FeedItemTopHat';
// Notification manually handles globally cached cast so fine to use `UnfocusedCast` directly
// eslint-disable-next-line no-restricted-imports
import { UnfocusedCast } from '~/components/casts/UnfocusedCast';
import { useIsAdmin } from '~/hooks/data/useIsAdmin';
import { buildCastsWithContext } from '~/utils/castUtils';

type CastQuoteNotificationGroupProps = {
  notificationGroup: ApiCastQuoteNotificationGroup;
};

const CastQuoteNotificationGroup: React.FC<CastQuoteNotificationGroupProps> =
  React.memo(({ notificationGroup }) => {
    const cast = useGloballyCachedCast({
      fallback: notificationGroup.previewItems[0].content.cast,
    });
    const isAdmin = useIsAdmin();
    const castHasBlockedUrl = useCastHasBlockedUrl();

    const isUnread = notificationGroup.isUnread;

    const castWithContext = React.useMemo(
      () =>
        buildCastsWithContext([{ cast }], {
          forceThreadPosition: 'start_and_end',
          forceCastHeaderLabelHidden: true,
          isHighlighted: isUnread,
        })[0],
      [cast, isUnread],
    );

    const xURLMention = React.useMemo(() => {
      if (
        typeof cast !== 'undefined' &&
        typeof cast.embeds !== 'undefined' &&
        typeof cast.embeds.casts === 'undefined' &&
        cast.embeds.urls.findIndex(
          ({ openGraph: { domain } }) =>
            domain === 'x.com' || domain === 'twitter.com',
        ) !== -1
      ) {
        return true;
      }

      return false;
    }, [cast]);

    const gitHubURLMention = React.useMemo(() => {
      if (
        typeof cast !== 'undefined' &&
        typeof cast.embeds !== 'undefined' &&
        typeof cast.embeds.casts === 'undefined' &&
        !xURLMention &&
        cast.embeds.urls.findIndex(
          ({ openGraph: { domain } }) => domain === 'github.com',
        ) !== -1
      ) {
        return true;
      }

      return false;
    }, [cast, xURLMention]);

    const topHat = React.useMemo(() => {
      if (xURLMention) {
        return (
          <FeedItemTopHatContainer icon={<XTopHatIcon />}>
            Mention
          </FeedItemTopHatContainer>
        );
      }

      if (gitHubURLMention) {
        return (
          <FeedItemTopHatContainer icon={<GitHubTopHatIcon />}>
            Mention
          </FeedItemTopHatContainer>
        );
      }

      return undefined;
    }, [gitHubURLMention, xURLMention]);

    // Mirror Cast.tsx's harmful-domain gate (NEYN-11871).
    if (castHasBlockedUrl(cast)) {
      return isAdmin ? <BlockedByDomainPlaceholder /> : null;
    }

    return (
      <UnfocusedCast
        castWithContext={castWithContext}
        CastTopHatForNotificationsComponent={topHat}
      />
    );
  });

CastQuoteNotificationGroup.displayName = 'CastQuoteNotificationGroup';

export { CastQuoteNotificationGroup };
