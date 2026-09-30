import { ApiUserMinimal } from 'farcaster-client-data';
import {
  CastClickType,
  resolveUsernameShort,
  useTrackCastClick,
} from 'farcaster-client-hooks';
import { FC, memo } from 'react';

import { LinkToProfileWithSummaryTooltip } from '~/components/links/LinkToProfileWithSummaryTooltip';
import { useCachedCurrentUser } from '~/hooks/data/useCachedCurrentUser';

type UserMinimalMentionProps = {
  user: ApiUserMinimal;
};

const UserMinimalMention: FC<UserMinimalMentionProps> = memo(({ user }) => {
  const trackCastClick = useTrackCastClick();
  const currentUser = useCachedCurrentUser();

  const username =
    user.fid === currentUser?.fid
      ? 'You'
      : resolveUsernameShort({
          username: user.username,
          fid: user.fid,
        });

  return (
    <LinkToProfileWithSummaryTooltip
      title={username}
      user={user}
      className="relative font-semibold !text-inherit hover:underline"
      onClick={() => {
        trackCastClick({ type: CastClickType.Mention });
      }}
    >
      {username}
    </LinkToProfileWithSummaryTooltip>
  );
});

UserMinimalMention.displayName = 'UserMinimalMention';

export { UserMinimalMention };
