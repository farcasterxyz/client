import { KebabHorizontalIcon } from '@primer/octicons-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ApiFrame, getMiniAppCanonicalUrl } from 'farcaster-client-data';
import {
  useDevToolsRefreshDomainManifest,
  useDevToolsUnregisterDomain,
  useDomainManifestState,
  useInvalidateAppsByAuthor,
  useInvalidateDevToolsManagedApps,
} from 'farcaster-client-hooks';
import {
  CopyIcon,
  RefreshCwIcon,
  SignatureIcon,
  TrashIcon,
  UserCogIcon,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { MiniAppAccountAssociationWorkflowModal } from '~/components/devTools/MiniAppAccountAssociationWorkflowModal';
import { DropdownMenuItem } from '~/components/dropdownMenu/DropdownMenuItem';
import { ConfirmationModal } from '~/components/modals/ConfirmationModal';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useCurrentUserHasMiniAppAdminRights } from '~/hooks/data/useCurrentUserHasMiniAppAdminRights';
import { useGoBack } from '~/hooks/navigation/useGoBack';
import { toast } from '~/utils/toast';

import { ManageDomainRolesModal } from './ManageDomainRolesModal';

const ManageAppKebabActions = ({
  frame,
  domain,
}: {
  frame?: ApiFrame;
  domain: string;
}) => {
  const { fid } = useCurrentUser();
  const hasAdminRights = useCurrentUserHasMiniAppAdminRights(domain);
  const invalidateAppsByAuthor = useInvalidateAppsByAuthor({ fid });
  const invalidateDevToolsManagedApps = useInvalidateDevToolsManagedApps();
  const back = useGoBack();
  const unregisterDomain = useDevToolsUnregisterDomain();
  const refreshDomainManifest = useDevToolsRefreshDomainManifest();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const { data: domainManifestState } = useDomainManifestState({
    domain,
    enabled: isAuthorized && !!domain,
  });
  const [showUnregisterDomainModal, setShowUnregisterDomainModal] =
    useState(false);
  const [isUnregistering, setIsUnregistering] = useState(false);
  const [showTransferOwnershipModal, setShowTransferOwnershipModal] =
    useState(false);
  const [showManageDomainRolesModal, setShowManageDomainRolesModal] =
    useState(false);

  useEffect(() => {
    hasAdminRights().then(setIsAuthorized);
  }, [hasAdminRights]);

  const handleCopyCanonicalUrl = useCallback(() => {
    if (!frame) {
      return;
    }
    navigator.clipboard.writeText(getMiniAppCanonicalUrl({ frame }));
    toast({ message: 'Link copied to clipboard', type: 'info' });
  }, [frame]);

  const handleUnregisterDomain = useCallback(async () => {
    setShowUnregisterDomainModal(false);
    try {
      setIsUnregistering(true);
      await unregisterDomain({ domain });
      invalidateAppsByAuthor();
      invalidateDevToolsManagedApps();
      back();
      toast({
        message: `Unregistered ${domain}`,
        type: 'success',
      });
    } catch (error) {
      toast({
        message: `Failed to unregister ${domain}, ${error}`,
        type: 'error',
      });
    } finally {
      setIsUnregistering(false);
    }
  }, [
    domain,
    invalidateAppsByAuthor,
    invalidateDevToolsManagedApps,
    back,
    unregisterDomain,
  ]);

  const handleTransferOwnershipSuccess = useCallback(() => {
    setShowTransferOwnershipModal(false);
    back();
  }, [back]);

  const handleRefreshManifest = useCallback(async () => {
    if (!domain) {
      return;
    }
    try {
      await refreshDomainManifest({ domain });
      toast({
        message: 'Manifest cache refreshed',
        type: 'success',
      });
    } catch (error) {
      toast({
        message: `Failed to refresh manifest, ${error}`,
        type: 'error',
      });
    }
  }, [domain, refreshDomainManifest]);

  if (!isAuthorized || !domainManifestState?.state?.verified) {
    return null;
  }

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <div className="flex size-8 items-center justify-center rounded-full text-muted hover:bg-faint">
            <KebabHorizontalIcon />
          </div>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content
          side="bottom"
          align="end"
          sideOffset={4}
          className="outline-hidden z-20 w-52 rounded-md p-1 shadow-lg bg-app border-default"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenuItem
            name="Refresh manifest"
            icon={<RefreshCwIcon size="small" />}
            onClick={handleRefreshManifest}
          />
          {frame && (
            <DropdownMenuItem
              name="Copy link to mini app"
              icon={<CopyIcon size="small" />}
              onClick={handleCopyCanonicalUrl}
            />
          )}
          <DropdownMenuItem
            name="Transfer ownership"
            icon={<SignatureIcon size="small" />}
            onClick={() => setShowTransferOwnershipModal(true)}
          />
          <DropdownMenuItem
            name="Manage roles"
            icon={<UserCogIcon size="small" />}
            onClick={() => setShowManageDomainRolesModal(true)}
          />
          <DropdownMenuItem
            name="Unregister mini app"
            icon={<TrashIcon size="small" />}
            destructive
            onClick={() => setShowUnregisterDomainModal(true)}
          />
        </DropdownMenu.Content>
      </DropdownMenu.Root>
      {showUnregisterDomainModal && (
        <ConfirmationModal
          onBackdropClose={() => {
            setShowUnregisterDomainModal(false);
          }}
          onCancel={() => {
            setShowUnregisterDomainModal(false);
          }}
          onConfirm={handleUnregisterDomain}
          title="Unregister mini app"
          icon={({ size }) => <TrashIcon size={size} />}
          confirmText="Unregister"
          destructive={true}
          isLoading={isUnregistering}
          body={
            <>
              This will remove the mini app under the{' '}
              <span className="font-semibold">{domain}</span> domain from
              Farcaster. It will no longer show up on lists and leaderboards
              until the domain is registered again.
            </>
          }
        />
      )}
      {showTransferOwnershipModal && domain && (
        <MiniAppAccountAssociationWorkflowModal
          domain={domain}
          onClose={() => setShowTransferOwnershipModal(false)}
          onSuccess={handleTransferOwnershipSuccess}
          isOwnershipTransfer
        />
      )}
      {showManageDomainRolesModal && (
        <ManageDomainRolesModal
          domain={domain}
          onClose={() => setShowManageDomainRolesModal(false)}
        />
      )}
    </>
  );
};

export { ManageAppKebabActions };
