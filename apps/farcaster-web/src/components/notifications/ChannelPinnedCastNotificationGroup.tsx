import { ChevronRightIcon } from '@primer/octicons-react';
import { ApiChannelPinnedCastNotificationGroup } from 'farcaster-client-data';
import {
  useCastHasBlockedUrl,
  useGloballyCachedCast,
} from 'farcaster-client-hooks';
import { FC, memo, useMemo } from 'react';

import { MegaphoneIcon } from '~/components/casts/actions/icons/Megaphone';
import { BlockedByDomainPlaceholder } from '~/components/casts/BlockedByDomainPlaceholder';
// Notification manually handles globally cached cast so fine to use `UnfocusedCast` directly
// eslint-disable-next-line no-restricted-imports
import { UnfocusedCast } from '~/components/casts/UnfocusedCast';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { NotificationIcon } from '~/components/notifications/shared/NotificationIcon';
import { useIsAdmin } from '~/hooks/data/useIsAdmin';
import { useNavigateToNotificationGroupCasts } from '~/hooks/navigation/useNavigateToNotificationGroupCasts';
import { buildCastsWithContext } from '~/utils/castUtils';

type ChannelPinnedCastNotificationGroupProps = {
  group: ApiChannelPinnedCastNotificationGroup;
};

const ChannelPinnedCastNotificationGroup: FC<ChannelPinnedCastNotificationGroupProps> =
  memo(({ group }) => {
    const navigateToNotificationGroup = useNavigateToNotificationGroupCasts();

    const cast = useGloballyCachedCast({
      fallback: group.previewItems[0].content.cast,
    });
    const isAdmin = useIsAdmin();
    const castHasBlockedUrl = useCastHasBlockedUrl();

    const isUnread = group.isUnread;

    const channel = cast.channel;

    const castWithContext = useMemo(
      () =>
        buildCastsWithContext([{ cast, pinned: true }], {
          forceThreadPosition: 'start_and_end',
          forceCastHeaderLabelHidden: true,
          showPinnedAsAnnouncement: true,
          isHighlighted: isUnread,
        })[0],
      [cast, isUnread],
    );

    if (!channel) {
      return null;
    }

    if (group.totalItemCount === 1) {
      // Mirror Cast.tsx's harmful-domain gate (NEYN-11871).
      if (castHasBlockedUrl(cast)) {
        return isAdmin ? <BlockedByDomainPlaceholder /> : null;
      }

      return <UnfocusedCast castWithContext={castWithContext} />;
    }

    return (
      <NotificationGroupContainer
        notificationGroup={group}
        onClick={() => {
          navigateToNotificationGroup({
            groupId: group.id,
            type: group.type,
          });
        }}
      >
        <NotificationIcon variant="purple" channelImageUrl={channel.imageUrl}>
          <MegaphoneIcon size={24} />
        </NotificationIcon>
        <div className="w-full self-center pt-1">
          {group.totalItemCount} announcements in{' '}
          <span className="font-semibold">/{channel.key}</span>
        </div>
        <div className="self-center pt-1">
          <ChevronRightIcon size={24} />
        </div>
      </NotificationGroupContainer>
    );
  });

ChannelPinnedCastNotificationGroup.displayName =
  'ChannelPinnedCastNotificationGroup';

export { ChannelPinnedCastNotificationGroup };
