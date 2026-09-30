import React from 'react';

import { PersonXIcon } from '~/components/icons/PersonXIcon';
import {
  ConfirmationModal,
  ConfirmationModalProps,
} from '~/components/modals/ConfirmationModal';

type ConfirmBanFromChannelModalProps = ConfirmationModalProps<{
  username: string;
  channelKey: string;
}>;

export function ConfirmBanFromChannelModal({
  extraData: { username, channelKey },
  ...rest
}: ConfirmBanFromChannelModalProps) {
  return (
    <ConfirmationModal
      {...rest}
      title="Ban from channel"
      destructive
      icon={PersonXIcon}
      confirmText="Ban"
      body={
        <>
          <span className="font-semibold">{username}</span> will be unable to
          reply to casts in <span className="font-semibold">/{channelKey}</span>
        </>
      }
    />
  );
}
