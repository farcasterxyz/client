import { ApiUser } from 'farcaster-client-data';
import React from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { DollarCircleIcon } from '~/components/icons/DollarCircleIcon';
import { usePayUser } from '~/contexts/PayUserProvider';

type PayUserButtonProps = {
  user: ApiUser;
};

const PayUserButton: React.FC<PayUserButtonProps> = ({ user }) => {
  const { launchPayUser } = usePayUser();

  return (
    <DefaultButton
      title="Pay"
      variant="muted"
      className="flex flex-row items-center !justify-center !font-semibold text-default"
      onClick={() => {
        launchPayUser({ user, via: 'profile' });
      }}
    >
      <DollarCircleIcon size={18} />
      <span className="ml-[10px]">Pay</span>
    </DefaultButton>
  );
};

export { PayUserButton };
