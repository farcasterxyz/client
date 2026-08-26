import { ApiCreatorLabel, ApiUser } from 'farcaster-client-data';
import React, { FC, useState } from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { UserCreatorLabelsModal } from '~/components/modals/UserCreatorLabelsModal';

interface UserCreatorLabelButtonProps {
  user: ApiUser;
  creatorLabel?: ApiCreatorLabel;
}

const UserCreatorLabelButton: FC<UserCreatorLabelButtonProps> = ({
  user,
  creatorLabel,
}) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <DefaultButton
        variant="muted"
        onClick={() => setShowModal(true)}
        className="!px-3 uppercase"
        style={{
          borderColor:
            typeof creatorLabel !== 'undefined' ? '#dda0dd' : '#777777',
        }}
      >
        {typeof creatorLabel !== 'undefined'
          ? `c-${creatorLabel.split('c-')[1].slice(0, 5)}`
          : 'c n/a'}
      </DefaultButton>
      {showModal && (
        <UserCreatorLabelsModal
          user={user}
          creatorLabel={creatorLabel}
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

UserCreatorLabelButton.displayName = 'UserCreatorLabelButton';

export { UserCreatorLabelButton };
