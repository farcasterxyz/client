import {
  ConfirmationModal,
  ConfirmationModalProps,
  useConfirmationModal,
} from '~/components/modals/ConfirmationModal';

export const useConfirmRestrictedModal = ({
  onConfirm,
  username,
}: {
  onConfirm: () => void;
  username: string;
}) =>
  useConfirmationModal({
    onConfirm,
    extraData: {
      username,
    },
    ConfirmModal: ConfirmInviteRestrictedModal,
  });

function ConfirmInviteRestrictedModal({
  extraData: { username },
  ...rest
}: ConfirmationModalProps<{
  username: string;
}>) {
  return (
    <ConfirmationModal
      {...rest}
      title="Previously removed"
      confirmText="Invite"
      body={
        <>
          <span className="font-semibold">{username}</span> was previously
          removed or banned by another moderator. Are you sure you want to add
          them back?
        </>
      }
    />
  );
}
