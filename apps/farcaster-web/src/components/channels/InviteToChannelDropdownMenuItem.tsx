import { PersonAddIcon } from '@primer/octicons-react';

import { DropdownMenuItem } from '~/components/dropdownMenu/DropdownMenuItem';
import { useInviteToChannel } from '~/hooks/channels/useInviteToChannel';

export function InviteToChannelMenuItem({
  invited,
  channelKey,
  fid,
  username,
  restricted,
  noIcon = false,
}: {
  invited: boolean;
  channelKey: string;
  fid: number;
  restricted: boolean | undefined;
  username: string;
  noIcon?: boolean;
}) {
  const { inviteToChannel, Component: ConfirmInviteRestrictedModal } =
    useInviteToChannel({
      channelKey,
      fid,
      restricted,
      username,
    });

  return (
    <>
      <DropdownMenuItem
        name={`${invited ? 'Invited' : 'Invite'} to channel`}
        icon={noIcon ? undefined : <PersonAddIcon size="small" />}
        onSelect={() => {
          inviteToChannel();
        }}
        disabled={invited}
      />
      {ConfirmInviteRestrictedModal}
    </>
  );
}
