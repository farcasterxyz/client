import { AnalyticsEvent } from 'farcaster-analytics';
import {
  useConnectedAccountsWithRefreshOnMount,
  useGetXAuthLink,
  useRemoveConnectedAccount,
} from 'farcaster-client-hooks';
import React from 'react';

import { XTopHatIcon } from '~/components/casts/actions/icons/XTopHatIcon';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { Label } from '~/components/forms/Label';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { DefaultModalActionButtons } from '~/components/modals/DefaultModalActionButtons';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { DefaultModalContent } from '~/components/modals/DefaultModalContent';
import { DefaultModalHeader } from '~/components/modals/DefaultModalHeader';
import { Modal } from '~/components/modals/Modal';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useExternalNavigate } from '~/hooks/navigation/useExternalNavigate';

type ProfileManageConnectedAccountsModalProps = {
  onClose: () => void;
};

const ProfileManageConnectedAccountsModal: React.FC<ProfileManageConnectedAccountsModalProps> =
  React.memo(({ onClose }) => {
    return (
      <Modal>
        <DefaultModalContainer onClose={onClose}>
          <DefaultModalContent>
            <DefaultModalHeader title="Connected accounts" onClose={onClose} />
            <React.Suspense
              fallback={
                <span className="flex size-full flex-row items-center justify-center py-8">
                  <LoadingIndicator />
                </span>
              }
            >
              <ProfileManageConnectedAccountsModalContent onClose={onClose} />
            </React.Suspense>
          </DefaultModalContent>
        </DefaultModalContainer>
      </Modal>
    );
  });
ProfileManageConnectedAccountsModal.displayName =
  'ProfileManageConnectedAccountsModal';

const ProfileManageConnectedAccountsModalContent: React.FC<{
  onClose: () => void;
}> = React.memo(({ onClose }) => {
  const { fid: currentUserFid } = useCurrentUser();
  const { trackEvent } = useAnalytics();
  const { data, refetch } = useConnectedAccountsWithRefreshOnMount();

  const connectedAccounts = React.useMemo(
    () => data?.pages.flatMap((page) => page.result.accounts) || [],
    [data],
  );

  const connectedXAccount = React.useMemo(() => {
    return connectedAccounts.find(({ platform }) => platform === 'x');
  }, [connectedAccounts]);

  const navigate = useExternalNavigate();
  const getXAuthLink = useGetXAuthLink();
  const remove = useRemoveConnectedAccount();

  const [clickedConnectOnce, setClickedConnectOnce] =
    React.useState<boolean>(false);

  const onConnectClick = React.useCallback(async () => {
    setClickedConnectOnce(true);

    trackEvent(AnalyticsEvent.SendUserToXToAuth, {
      via: 'socials settings',
    });

    const { result } = await getXAuthLink();

    navigate({ to: result.url, openInNewTab: true });
  }, [getXAuthLink, navigate, trackEvent]);

  const onDisconnectClick = React.useCallback(async () => {
    if (typeof connectedXAccount === 'undefined') {
      return;
    }

    trackEvent(AnalyticsEvent.PressDisconnectXAccount, {});

    await remove({
      connectedAccountId: connectedXAccount.connectedAccountId,
      fid: currentUserFid,
    });

    refetch();
  }, [connectedXAccount, currentUserFid, refetch, remove, trackEvent]);

  const body = React.useMemo(() => {
    if (typeof data === 'undefined') {
      return (
        <div className="flex w-full flex-row items-center justify-center py-3">
          <LoadingIndicator />
        </div>
      );
    }
    if (typeof connectedXAccount === 'undefined') {
      return (
        <div className="flex w-full flex-row items-center justify-between py-3">
          <div className="flex flex-row items-center space-x-2">
            <div className="rounded-full bg-black p-2 text-white">
              <XTopHatIcon />
            </div>
            <span className="font-semibold text-default">
              X{' '}
              <span className="font-normal text-muted">(formerly Twitter)</span>
            </span>
          </div>
          <DefaultButton
            onClick={onConnectClick}
            variant="normal"
            disabled={clickedConnectOnce}
            className="flex flex-row items-center !justify-center gap-2 !font-semibold text-default"
          >
            {clickedConnectOnce ? 'Connecting...' : 'Connect'}
          </DefaultButton>
        </div>
      );
    }

    return (
      <div className="flex w-full flex-row items-center justify-between py-3">
        <div className="flex flex-row items-center space-x-2">
          <div className="rounded-full bg-black p-2 text-white">
            <XTopHatIcon />
          </div>
          <span className="font-semibold text-default">
            {connectedXAccount.username}
          </span>
        </div>
        <DefaultButton
          onClick={onDisconnectClick}
          variant="secondary"
          className="flex flex-row items-center !justify-center gap-2 !font-semibold text-default"
        >
          {'Disconnect'}
        </DefaultButton>
      </div>
    );
  }, [
    clickedConnectOnce,
    connectedXAccount,
    data,
    onConnectClick,
    onDisconnectClick,
  ]);

  return (
    <div className="flex size-full flex-col overflow-hidden">
      <div className="h-[200px] p-4">
        <div className="flex flex-col">
          <Label>X account</Label>
          <span className="text-sm text-muted">
            Verify your X account to display it on your profile.
          </span>
          {body}
        </div>
      </div>
      <div className="rounded-b-md border-t p-[16px] border-default">
        <DefaultModalActionButtons
          isLoading={false}
          isPrimaryButtonDisabled={false}
          onPrimaryButtonClick={() => {
            onClose();
          }}
          primaryButtonLabel="Done"
        />
      </div>
    </div>
  );
});
ProfileManageConnectedAccountsModalContent.displayName =
  'ProfileManageConnectedAccountsModalContent';

export { ProfileManageConnectedAccountsModal };
