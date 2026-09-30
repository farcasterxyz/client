import { canOverrideNeynarScore } from 'farcaster-client-data';
import React from 'react';

import { Button } from '~/components/Button';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { usePush } from '~/hooks/navigation/usePush';
import {
  formatNeynarScore,
  getDisplayedNeynarScore,
  getNeynarScoreBorderColor,
  UserProfileWithNeynarScoreInfo,
} from '~/utils/NeynarScoreUtils';

interface UserNeynarScoreOverrideButtonProps {
  userProfile: UserProfileWithNeynarScoreInfo;
}

const UserNeynarScoreOverrideButton: React.FC<
  UserNeynarScoreOverrideButtonProps
> = ({ userProfile }) => {
  const t = useTheme();
  const push = usePush();
  const { fid: currentUserFid } = useCurrentUser_UNSAFE();

  if (!canOverrideNeynarScore(currentUserFid)) {
    return null;
  }

  const displayedScore = getDisplayedNeynarScore(userProfile);
  const title = formatNeynarScore(displayedScore);
  const borderColor = getNeynarScoreBorderColor(userProfile);

  return (
    <Button
      onPress={async () =>
        push('UserNeynarScoreOverride', {
          user: userProfile.user,
          neynarScoreInfo: userProfile.neynarScoreInfo,
        })
      }
      title={title}
      variant="normal"
      size="xs"
      style={[
        t.w12,
        t.pX0,
        {
          backgroundColor: t.colors.bgElevated,
          borderColor,
          borderWidth: 1,
          borderRadius: 16,
        },
      ]}
    />
  );
};

UserNeynarScoreOverrideButton.displayName = 'UserNeynarScoreOverrideButton';

export { UserNeynarScoreOverrideButton };
