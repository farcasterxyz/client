import { ApiUser, ApiUserQuality } from 'farcaster-client-data';
import { getUserQualityBorderColor } from 'farcaster-client-hooks';
import capitalize from 'lodash/capitalize';
import React from 'react';

import { Button } from '~/components/Button';
import { useTheme } from '~/contexts/ThemeProvider';
import { useIsAdmin } from '~/hooks/data/useIsAdmin';
import { usePush } from '~/hooks/navigation/usePush';

interface UserQualityButtonProps {
  user: ApiUser;
  quality?: ApiUserQuality;
  badness?: number;
}

const UserQualityButton: React.FC<UserQualityButtonProps> = ({
  user,
  quality,
  badness,
}) => {
  const t = useTheme();
  const isAdmin = useIsAdmin();
  const push = usePush();

  if (!isAdmin) {
    return null;
  }

  const title = `${capitalize(quality || 'unknown')}${badness ? ` (${badness})` : ''}`;

  return (
    <Button
      onPress={async () =>
        push('UserQuality', {
          user,
          quality,
          badness,
        })
      }
      title={title}
      variant="normal"
      size="xs"
      style={[
        t.w20,
        t.pX0,
        {
          backgroundColor: 'rgba(36, 41, 46, 0.50)',
          borderColor: getUserQualityBorderColor(quality),
          borderWidth: 1,
          borderRadius: 16,
        },
      ]}
    />
  );
};

UserQualityButton.displayName = 'UserQualityButton';

export { UserQualityButton };
