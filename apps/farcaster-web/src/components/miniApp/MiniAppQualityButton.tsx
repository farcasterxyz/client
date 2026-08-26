import { ApiMiniAppQuality } from 'farcaster-client-data';
import { getMiniAppQualityBorderColor } from 'farcaster-client-hooks';
import capitalize from 'lodash/capitalize';
import React, { FC } from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';

interface MiniAppQualityButtonProps {
  quality: ApiMiniAppQuality;
  onClick: () => void;
}

const MiniAppQualityButton: FC<MiniAppQualityButtonProps> = ({
  quality,
  onClick,
}) => {
  return (
    <DefaultButton
      variant="muted"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="!px-3"
      style={{ borderColor: getMiniAppQualityBorderColor(quality) }}
    >
      {capitalize(quality)}
    </DefaultButton>
  );
};

MiniAppQualityButton.displayName = 'MiniAppQualityButton';

export { MiniAppQualityButton };
