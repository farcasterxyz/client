import { ApiMiniAppQuality } from 'farcaster-client-data';
import { getMiniAppQualityBorderColor } from 'farcaster-client-hooks';
import capitalize from 'lodash/capitalize';
import React, { FC } from 'react';

import { Button } from '~/components/Button';
import { useTheme } from '~/contexts/ThemeProvider';
import { useIsAdmin } from '~/hooks/data/useIsAdmin';

interface MiniAppQualityButtonProps {
  quality: ApiMiniAppQuality;
  onPress: () => void;
}

const MiniAppQualityButton: FC<MiniAppQualityButtonProps> = ({
  quality,
  onPress,
}) => {
  const t = useTheme();
  const isAdmin = useIsAdmin();

  if (!isAdmin) {
    return null;
  }

  return (
    <Button
      onPress={onPress}
      title={capitalize(quality)}
      variant="normal"
      size="xs"
      style={[
        t.w20,
        t.pX0,
        {
          backgroundColor: 'rgba(36, 41, 46, 0.50)',
          borderColor: getMiniAppQualityBorderColor(quality),
          borderWidth: 1,
          borderRadius: 16,
        },
      ]}
    />
  );
};

MiniAppQualityButton.displayName = 'MiniAppQualityButton';

export { MiniAppQualityButton };
