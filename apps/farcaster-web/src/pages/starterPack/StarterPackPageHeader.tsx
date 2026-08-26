import { KebabHorizontalIcon } from '@primer/octicons-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useQueryClient } from '@tanstack/react-query';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiStarterPack,
  ApiStarterPackAccountItem,
} from 'farcaster-client-data';
import {
  useDeleteStarterPack,
  useFarcasterApiClient,
} from 'farcaster-client-hooks';
import React from 'react';

import { DropdownMenuItem } from '~/components/dropdownMenu/DropdownMenuItem';
import { BackButton } from '~/components/forms/buttons/BackButton';
import { ConfirmationModal } from '~/components/modals/ConfirmationModal';
import { StarterPacksModal } from '~/components/modals/StarterPacksModal';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';

type StarterPackPageHeaderProps = {
  starterPack: ApiStarterPack;
};

const useFetchAllStarterPackUsers = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  return React.useCallback(
    async ({ starterPackId }: { starterPackId: string }) => {
      return queryClient.fetchQuery({
        queryKey: ['all-starter-pack-users', starterPackId],
        queryFn: async () => {
          const response = await apiClient.getStarterPackUsers({
            cursor: undefined,
            id: starterPackId,
            limit: 100,
          });
          return response.data.result.users;
        },
        staleTime: 0,
      });
    },
    [apiClient, queryClient],
  );
};

const StarterPackPageHeader: React.FC<StarterPackPageHeaderProps> = React.memo(
  ({ starterPack }) => {
    const { fid } = useCurrentUser();

    const viewerCanModifyStarterPack = React.useMemo(() => {
      return starterPack.creator.fid === fid;
    }, [fid, starterPack.creator.fid]);

    const starterPackUrl = `https://farcaster.xyz/${starterPack.creator.username}/pack/${starterPack.id}`;

    return (
      <>
        <div className="border-default sm:border-x">
          <PageHeader
            hideCastButton={false}
            composerDefaultIntent={{
              text: starterPackUrl,
              embeds: [starterPackUrl],
            }}
            renderAlternateActionButton={() => {
              if (!viewerCanModifyStarterPack) {
                return undefined;
              }

              return (
                <StarterPackPageHeaderActions starterPack={starterPack}>
                  <div className="flex size-[34px] cursor-pointer items-center justify-center rounded-full border-default text-default hover:bg-overlay-faint">
                    <KebabHorizontalIcon size={16} className="mt-0.5" />
                  </div>
                </StarterPackPageHeaderActions>
              );
            }}
          >
            <PageTitle>
              <BackButton />
              Starter Pack
            </PageTitle>
          </PageHeader>
        </div>
      </>
    );
  },
);

function StarterPackPageHeaderActions({
  children,
  starterPack,
}: React.PropsWithChildren & {
  starterPack: ApiStarterPack;
}) {
  const { trackEvent } = useAnalytics();
  const { fid: currentUserFid } = useCurrentUser();

  const [showEditStarterPackModal, setShowEditStarterPackModal] =
    React.useState<ApiStarterPack | undefined>(undefined);

  const [showConfirmDeleteModal, setShowConfirmDeleteModal] =
    React.useState<boolean>(false);

  const fetchAllStarterPackUsers = useFetchAllStarterPackUsers();

  const deleteStarterPack = useDeleteStarterPack();

  const onDeleteStarterPack = React.useCallback(() => {
    trackEvent(AnalyticsEvent.DeleteStarterPack, {});

    deleteStarterPack({ fid: currentUserFid, id: starterPack.id });

    setShowConfirmDeleteModal(false);
  }, [currentUserFid, deleteStarterPack, starterPack.id, trackEvent]);

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger onClick={(e) => e.stopPropagation()} asChild>
          {children}
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            side="bottom"
            sideOffset={10}
            align="end"
            onClick={(e) => e.stopPropagation()}
            className="outline-hidden z-10 w-[240px] divide-y divide-border-gray-light overflow-hidden rounded-lg shadow-lg bg-app dark:divide-border-gray-dark"
            // On close Dropdown trigger gets a focus making it work a bit wierd, disabling it for now.
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <DropdownMenuItem
              onSelect={async () => {
                const users = await fetchAllStarterPackUsers({
                  starterPackId: starterPack.id,
                });

                // Starter pack itself is paged so we need to manually fetch before attempting full edit

                starterPack.items = users.map(
                  (user) =>
                    ({
                      type: 'account',
                      item: user,
                    }) satisfies ApiStarterPackAccountItem,
                );

                setShowEditStarterPackModal(starterPack);
              }}
              name="Edit"
              destructive={false}
            />
            <DropdownMenuItem
              onSelect={() => {
                setShowConfirmDeleteModal(true);
              }}
              name="Delete"
              destructive={true}
            />
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      {typeof showEditStarterPackModal !== 'undefined' && (
        <StarterPacksModal
          existingStarterPack={showEditStarterPackModal}
          onClose={() => {
            setShowEditStarterPackModal(undefined);
          }}
        />
      )}
      {showConfirmDeleteModal && (
        <ConfirmationModal
          onBackdropClose={() => {
            setShowConfirmDeleteModal(false);
          }}
          onCancel={() => {
            setShowConfirmDeleteModal(false);
          }}
          onConfirm={onDeleteStarterPack}
          title="Delete starter pack"
          confirmText="Delete"
          destructive={true}
        />
      )}
    </>
  );
}

StarterPackPageHeader.displayName = 'StarterPackPageHeader';

export { StarterPackPageHeader };
