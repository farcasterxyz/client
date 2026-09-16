import React, { FC, useMemo, useState } from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { UserNeynarScoreOverrideModal } from '~/components/modals/UserNeynarScoreOverrideModal';

import {
  formatNeynarScore,
  getDisplayedNeynarScore,
  getNeynarScoreBorderColor,
  type UserProfileWithNeynarScoreInfo,
} from './neynarScoreUtils';

interface UserNeynarScoreOverrideButtonProps {
  userProfile: UserProfileWithNeynarScoreInfo;
}

const UserNeynarScoreOverrideButton: FC<UserNeynarScoreOverrideButtonProps> = ({
  userProfile,
}) => {
  const [showModal, setShowModal] = useState(false);

  const displayedScore = useMemo(() => {
    return getDisplayedNeynarScore(userProfile);
  }, [userProfile]);

  const borderColor = getNeynarScoreBorderColor(userProfile);

  return (
    <div>
      <DefaultButton
        variant="muted"
        onClick={() => setShowModal(true)}
        className="!px-3"
        style={{ borderColor }}
      >
        {formatNeynarScore(displayedScore)}
      </DefaultButton>
      {showModal && (
        <UserNeynarScoreOverrideModal
          userProfile={userProfile}
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

UserNeynarScoreOverrideButton.displayName = 'UserNeynarScoreOverrideButton';

export { UserNeynarScoreOverrideButton };
