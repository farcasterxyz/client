import { ApiUserMinimal } from 'farcaster-client-data';
import { resolveUsernameShort } from 'farcaster-client-hooks';
import React, { FC, memo } from 'react';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';

type UserMinimalMentionProps = {
  user: ApiUserMinimal;
};

const UserMinimalMention: FC<UserMinimalMentionProps> = memo(({ user }) => {
  const t = useTheme();

  const currentUser = useCurrentUser_UNSAFE();

  const textStyles = [
    t.texts.tertiary,
    t.fontSemibold,
    // these need to match what's in top hat
    { lineHeight: 18, fontSize: 14 },
  ];

  return (
    <Text style={textStyles} numberOfLines={1}>
      {user.fid === currentUser.fid
        ? 'You'
        : resolveUsernameShort({ fid: user.fid, username: user.username })}
    </Text>
  );
});
UserMinimalMention.displayName = 'UserMinimalMention';

export { UserMinimalMention };
