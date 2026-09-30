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
import { Alert, ScrollView } from 'react-native';

import { AutoDisplayingBottomSheetModal } from '~/components/BottomSheet/AutoDisplayingBottomSheetModal';
import { ButtonGroup, ButtonGroupOption } from '~/components/ButtonGroup';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';

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

export function StarterPackActionsModal({
  onDismiss,
  starterPack,
}: {
  onDismiss: () => void;
  starterPack: ApiStarterPack;
}) {
  const deleteStarterPack = useDeleteStarterPack();

  const navigate = useNavigate();

  const { trackEvent } = useAnalytics();

  const onDeleteStarterPack = React.useCallback(() => {
    Alert.alert('Delete starter pack', 'Are you sure?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          trackEvent(AnalyticsEvent.DeleteStarterPack, {
            starterPackId: starterPack.id,
          });

          deleteStarterPack({
            fid: starterPack.creator.fid,
            id: starterPack.id,
          });

          onDismiss();

          navigate('StarterPacks', {});
        },
      },
    ]);
  }, [
    deleteStarterPack,
    navigate,
    onDismiss,
    starterPack.creator.fid,
    starterPack.id,
    trackEvent,
  ]);

  const fetchAllStarterPackUsers = useFetchAllStarterPackUsers();

  const onUpdateStarterPack = React.useCallback(async () => {
    const users = await fetchAllStarterPackUsers({
      starterPackId: starterPack.id,
    });

    starterPack.items = users.map(
      (user) =>
        ({
          type: 'account',
          item: user,
        }) satisfies ApiStarterPackAccountItem,
    );

    navigate('CreateStarterPack', { existingStarterPack: starterPack });
  }, [fetchAllStarterPackUsers, navigate, starterPack]);

  const buttonGroupOptions = React.useMemo(() => {
    const options: ButtonGroupOption[] = [
      {
        label: 'Edit',
        onPress: onUpdateStarterPack,
        destructive: false,
        enableHaptics: true,
      },
      {
        label: 'Delete',
        onPress: onDeleteStarterPack,
        destructive: true,
        enableHaptics: true,
      },
    ];
    return options;
  }, [onDeleteStarterPack, onUpdateStarterPack]);

  const modalRef = React.useRef<{ dismiss: () => void }>(null);

  return (
    <AutoDisplayingBottomSheetModal
      name="starterPackActionsModal"
      onDismiss={onDismiss}
      ref={modalRef}
    >
      <ScrollView>
        <ButtonGroup options={buttonGroupOptions} />
      </ScrollView>
    </AutoDisplayingBottomSheetModal>
  );
}
