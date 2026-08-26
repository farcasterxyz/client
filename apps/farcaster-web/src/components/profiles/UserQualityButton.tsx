import { ApiUser, ApiUserQuality } from 'farcaster-client-data';
import { getUserQualityBorderColor } from 'farcaster-client-hooks';
import capitalize from 'lodash/capitalize';
import React, { FC, useState } from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { UserQualityModal } from '~/components/modals/UserQualityModal';

interface UserQualityButtonProps {
  user: ApiUser;
  quality?: ApiUserQuality;
  badness?: number;
}

const UserQualityButton: FC<UserQualityButtonProps> = ({
  user,
  quality,
  badness,
}) => {
  const [showUserQualityModal, setShowUserQualityModal] = useState(false);

  return (
    <div>
      <DefaultButton
        variant="muted"
        onClick={() => setShowUserQualityModal(true)}
        className="!px-3"
        style={{ borderColor: getUserQualityBorderColor(quality) }}
      >
        {capitalize(quality)}
        {badness && ` (${badness})`}
      </DefaultButton>
      {showUserQualityModal && (
        <UserQualityModal
          user={user}
          quality={quality}
          badness={badness}
          onCancel={() => setShowUserQualityModal(false)}
        />
      )}
    </div>
  );
};

UserQualityButton.displayName = 'UserQualityMenuActions';

export { UserQualityButton };
