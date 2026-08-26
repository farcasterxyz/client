import { ApiDevToolsListMiniAppManifests200Response } from 'farcaster-client-data';
import {
  useDevToolsDeleteMiniAppManifest,
  useDevToolsListMiniAppManifests,
} from 'farcaster-client-hooks';
import { ExternalLinkIcon } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { FlatList } from '~/components/lists/FlatList';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { DefaultModalContent } from '~/components/modals/DefaultModalContent';
import { DefaultModalHeader } from '~/components/modals/DefaultModalHeader';
import { Modal } from '~/components/modals/Modal';
import { useExternalNavigate } from '~/hooks/navigation/useExternalNavigate';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { toast } from '~/utils/toast';

type DevToolsMiniAppManifestItem =
  ApiDevToolsListMiniAppManifests200Response['result']['manifests'][number];

type ManageHostedManifestsModalProps = {
  onClose: () => void;
};

export const ManageHostedManifestsModal: React.FC<
  ManageHostedManifestsModalProps
> = ({ onClose }) => {
  const navigate = useNavigate();
  const externalNavigate = useExternalNavigate();
  const listQuery = useDevToolsListMiniAppManifests();
  const deleteMutation = useDevToolsDeleteMiniAppManifest();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const flattenedData = useMemo(() => {
    if (!listQuery.data?.pages) {
      return [];
    }
    return listQuery.data.pages.flatMap((page) => page.items);
  }, [listQuery.data?.pages]);

  const handleSelectForEdit = useCallback(
    (manifest: DevToolsMiniAppManifestItem) => {
      navigate({
        to: 'developersHostedManifests',
        params: {},
        searchParams: { id: manifest.id },
      });
      onClose();
    },
    [navigate, onClose],
  );

  const handleDeleteManifest = useCallback(
    (manifestId: string) => {
      if (window.confirm('Are you sure you want to delete this manifest?')) {
        setIsDeleting(true);
        setDeletingId(manifestId);
        deleteMutation({ id: manifestId })
          .then(() => {
            toast({
              message: 'Manifest deleted successfully!',
              type: 'success',
            });
            listQuery.refetch();
            setIsDeleting(false);
            setDeletingId(null);
          })
          .catch(() => {
            setIsDeleting(false);
            setDeletingId(null);
            toast({
              message: 'Failed to delete manifest.',
              type: 'error',
            });
          });
      }
    },
    [deleteMutation, listQuery],
  );

  const keyExtractor = useCallback(
    (manifest: DevToolsMiniAppManifestItem) => manifest.id,
    [],
  );

  const renderManifestItem = useCallback(
    ({ item: manifest }: { item: DevToolsMiniAppManifestItem }) => (
      <div className="mb-3 rounded-md border p-4 bg-swap">
        <p className="text-base font-semibold">ID: {manifest.id}</p>
        <p className="text-sm text-muted">
          <span className="font-medium">Name:</span>{' '}
          {manifest.manifest.frame?.name}
        </p>
        <p className="text-sm text-muted">
          <span className="font-medium">Home URL:</span>{' '}
          {manifest.manifest.frame?.homeUrl}
        </p>
        <div className="mt-2 flex gap-2">
          <DefaultButton
            onClick={() => handleSelectForEdit(manifest)}
            size="sm"
            variant="normal"
          >
            Edit
          </DefaultButton>
          <DefaultButton
            onClick={() => handleDeleteManifest(manifest.id)}
            size="sm"
            variant="danger"
            disabled={isDeleting && deletingId === manifest.id}
          >
            Delete
          </DefaultButton>
          <DefaultButton
            onClick={() =>
              externalNavigate({
                to: `https://api.farcaster.xyz/miniapps/hosted-manifest/${manifest.id}`,
                openInNewTab: true,
              })
            }
            size="sm"
            variant="secondary"
          >
            <div className="flex flex-row items-center gap-2">
              Open
              <ExternalLinkIcon className="size-4" />
            </div>
          </DefaultButton>
        </div>
      </div>
    ),
    [
      handleSelectForEdit,
      handleDeleteManifest,
      isDeleting,
      deletingId,
      externalNavigate,
    ],
  );

  return (
    <Modal>
      <DefaultModalContainer onClose={onClose}>
        <DefaultModalContent>
          <DefaultModalHeader title="Stored Manifests" onClose={onClose} />
          <div className="flex size-full flex-col overflow-hidden">
            <div className="flex h-full flex-col">
              {listQuery.isLoading && (
                <div className="flex justify-center py-8">
                  <LoadingIndicator />
                </div>
              )}
              {listQuery.isError && (
                <p className="text-red-500">Error fetching manifests.</p>
              )}
              {!listQuery.isLoading && !listQuery.isError && (
                <FlatList
                  containerClassName="overflow-y-auto overflow-x-hidden p-[16px]"
                  data={flattenedData}
                  keyExtractor={keyExtractor}
                  renderItem={renderManifestItem}
                  emptyView={
                    <p className="text-center text-gray-500">
                      No manifests stored yet.
                    </p>
                  }
                  onEndReached={
                    listQuery.hasNextPage
                      ? () => listQuery.fetchNextPage()
                      : undefined
                  }
                  isFetchingNextPage={listQuery.isFetchingNextPage}
                />
              )}
            </div>
          </div>
        </DefaultModalContent>
      </DefaultModalContainer>
    </Modal>
  );
};
