import { CheckIcon, ChevronLeftIcon } from '@primer/octicons-react';
import classNames from 'classnames';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiStarterPack, ApiUser } from 'farcaster-client-data';
import {
  useCreateStarterPack,
  useDebouncedValue,
  useSearchUsersForStarterPacks,
  useUpdateStarterPack,
} from 'farcaster-client-hooks';
import uniqBy from 'lodash/uniqBy';
import React from 'react';

import { SearchInput } from '~/components/forms/SearchInput';
import { SelectInput } from '~/components/forms/SelectInput';
import { Textarea } from '~/components/forms/Textarea';
import { TextInput } from '~/components/forms/TextInput';
import { FlatList } from '~/components/lists/FlatList';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { DefaultCloseModalButton } from '~/components/modals/DefaultCloseModalButton';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { Modal } from '~/components/modals/Modal';
import {
  StarterPacksSetupStepsProvider,
  useStarterPacksSetupSteps,
} from '~/components/starterPacks/StarterPacksSetupStepsProvider';
import { User } from '~/components/users/User';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useNavigate } from '~/hooks/navigation/useNavigate';

import { DefaultModalActionButtons } from './DefaultModalActionButtons';

type StarterPacksModalProps = {
  existingStarterPack: ApiStarterPack | undefined;
  onClose: () => void;
};

const StarterPacksModal: React.FC<StarterPacksModalProps> = ({
  existingStarterPack,
  onClose,
}) => {
  return (
    <Modal>
      <DefaultModalContainer onClose={onClose}>
        <div className="flex size-full flex-col items-center justify-center">
          <div
            className="flex h-auto w-[602px] flex-col items-start justify-center rounded-lg border bg-app border-default"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <StarterPacksSetupStepsProvider
              existingStarterPack={existingStarterPack}
            >
              <StarterPacksModalContent onClose={onClose} />
            </StarterPacksSetupStepsProvider>
          </div>
        </div>
      </DefaultModalContainer>
    </Modal>
  );
};

StarterPacksModal.displayName = 'StarterPacksModal';

function StarterPacksModalContent({ onClose }: { onClose: () => void }) {
  const { trackEvent } = useAnalytics();

  const { fid: currentUserFid } = useCurrentUser();

  const [state, dispatch] = useStarterPacksSetupSteps();

  const [creating, setCreating] = React.useState<boolean>(false);

  const createStarterPack = useCreateStarterPack();
  const updateStarterPack = useUpdateStarterPack();

  const navigate = useNavigate();

  const shouldShowBackButton = React.useMemo(() => {
    return state.currentStep === 'Users';
  }, [state.currentStep]);

  const onBackClick = React.useCallback(() => {
    dispatch({ type: 'Back' });
  }, [dispatch]);

  const onContinueClick = React.useCallback(async () => {
    trackEvent(AnalyticsEvent.PressStarterPackWizardContinue, {
      currentStep: state.currentStep,
    });

    if (state.currentStep === 'Details') {
      dispatch({ type: 'Next' });
      return;
    }

    if (
      state.currentStep === 'Users' &&
      typeof state.name !== 'undefined' &&
      state.name.trim() !== '' &&
      typeof state.description !== 'undefined' &&
      state.description.trim() !== ''
    ) {
      setCreating(true);

      try {
        if (typeof state.existingStarterPackId !== 'undefined') {
          await updateStarterPack({
            id: state.existingStarterPackId,
            fid: currentUserFid,
            name: state.name,
            description: state.description,
            fids: state.users.map(({ fid }) => fid),
            labels: state.labels,
          });

          trackEvent(AnalyticsEvent.UpdateStarterPack, {
            name: state.name,
            starterPackId: state.existingStarterPackId,
          });

          navigate({
            to: 'starterPack',
            params: { id: state.existingStarterPackId },
          });
        } else {
          const starterPack = await createStarterPack({
            fid: currentUserFid,
            name: state.name,
            description: state.description,
            fids: state.users.map(({ fid }) => fid),
            labels: state.labels,
          });

          trackEvent(AnalyticsEvent.CreateStarterPack, {
            creatorFid: currentUserFid,
            name: state.name,
            description: state.description,
            itemCount: state.users.length,
            starterPackId: starterPack.id,
          });

          navigate({
            to: 'starterPack',
            params: { id: starterPack.id },
          });
        }
      } finally {
        setCreating(false);
      }

      onClose();

      return;
    }
  }, [
    createStarterPack,
    currentUserFid,
    dispatch,
    navigate,
    state.currentStep,
    state.description,
    state.existingStarterPackId,
    state.labels,
    state.name,
    state.users,
    trackEvent,
    updateStarterPack,
    onClose,
  ]);

  const needsToChooseMoreUsers =
    state.currentStep === 'Users' && 7 - state.users.length > 0;

  return (
    <div className="flex w-full flex-col items-center justify-center">
      <div className="flex w-full flex-row items-center justify-between rounded-lg py-6 pl-2 pr-3 text-2xl font-medium bg-app text-default">
        <div className="flex flex-row items-center justify-center">
          {shouldShowBackButton && (
            <div className="cursor-pointer" onClick={onBackClick}>
              <ChevronLeftIcon size={24} />
            </div>
          )}
        </div>
        <DefaultCloseModalButton onClick={onClose} className="p-2" />
      </div>
      <div className="flex size-full flex-col">
        <div className="px-3 text-2xl font-semibold text-default">
          Create a new starter pack
        </div>
        <div className="flex w-full flex-col">
          {state.currentStep === 'Details' && <CreateStarterPackDetails />}
          {state.currentStep === 'Users' && <CreateStarterPackSearchUsers />}
        </div>
        <div className="flex w-full flex-col justify-end space-y-2 border-t p-[16px] border-default">
          {state.currentStep === 'Users' && (
            <div
              className={classNames(
                'my-1 flex h-[32px] items-center justify-between',
                needsToChooseMoreUsers ? 'flex-row' : 'flex-row-reverse',
              )}
            >
              {needsToChooseMoreUsers && (
                <div className={'flex flex-col'}>
                  <div className="text-sm text-faint">
                    Select {`${8 - state.users.length} more`} to continue
                  </div>
                </div>
              )}
              {state.users.length > 0 && (
                <div className="flex flex-row items-center space-x-1 text-sm font-semibold text-faint">
                  <div className="text-sm font-semibold text-default">
                    {state.users.length}
                  </div>
                  <div>/ 100</div>
                </div>
              )}
            </div>
          )}
          <DefaultModalActionButtons
            isLoading={creating}
            isPrimaryButtonDisabled={
              creating ||
              (state.currentStep === 'Details'
                ? typeof state.name === 'undefined' ||
                  typeof state.description === 'undefined' ||
                  state.name.trim() === '' ||
                  state.description.trim() === ''
                : state.users.length < 7 || state.users.length > 100)
            }
            onPrimaryButtonClick={onContinueClick}
            primaryButtonLabel={'Continue'}
          />
        </div>
      </div>
    </div>
  );
}

function CreateStarterPackDetails() {
  const [state, dispatch] = useStarterPacksSetupSteps();

  return (
    <div className="flex flex-col gap-3 p-3 pb-0">
      <div>
        <div className="mb-2 text-sm text-muted">Name your starter pack</div>
        <TextInput
          autoFocus={true}
          maxLength={50}
          placeholder="Farcaster Super Fans"
          value={state.name || ''}
          onChange={(e) => dispatch({ type: 'SetName', name: e.target.value })}
        />
      </div>
      <div>
        <div className="mb-2 text-sm text-muted">Tell us a little more</div>
        <Textarea
          value={state.description || ''}
          placeholder="Write a note"
          rows={4}
          maxLength={250}
          withCharCounter={true}
          hideResizeHandle
          onChange={async (e) => {
            dispatch({ type: 'SetDescription', description: e.target.value });
          }}
        />
      </div>
      <div className="pb-4">
        <div className="mb-2 text-sm text-muted">
          Select a category (optional)
        </div>
        <SelectInput
          choices={[
            { value: '', name: 'Select an option' },
            { value: 'Crypto', name: 'Crypto' },
            { value: 'Programming', name: 'Programming' },
            { value: 'Technology', name: 'Technology' },
            { value: 'Memes', name: 'Memes' },
            { value: 'TV/Movies', name: 'TV/Movies' },
            { value: 'Books', name: 'Books' },
            { value: 'Gaming', name: 'Gaming' },
            { value: 'Music', name: 'Music' },
            { value: 'Sports', name: 'Sports' },
            { value: 'Art', name: 'Art' },
            { value: 'News', name: 'News' },
            { value: 'Health', name: 'Health' },
            { value: 'Food', name: 'Food' },
            { value: 'Travel', name: 'Travel' },
          ]}
          value={state.labels[0] || undefined}
          onChange={(e) => {
            dispatch({ type: 'AddLabel', label: e.target.value });
          }}
        />
      </div>
    </div>
  );
}

function CreateStarterPackSearchUsers() {
  const lastKeyDownCodeRef = React.useRef<string>(undefined);
  const lastKeyDownQueryRef = React.useRef<string>(undefined);

  const [query, setQuery] = React.useState('');
  const debouncedQuery = useDebouncedValue({
    value: query,
    debounceDuration: query.length < 3 ? 250 : 125,
  });

  const listHeight = React.useMemo(() => {
    return 10 * 60;
  }, []);

  React.useEffect(() => {
    document.body.style.setProperty(
      '--search-for-users-list-height',
      `${listHeight}px`,
    );
  }, [listHeight]);

  return (
    <div className="flex flex-col gap-3 p-3 pb-0">
      <div>
        <SearchInput
          placeholder="Search"
          className="!rounded-md border border-default"
          variant="muted"
          value={query}
          maxLength={64}
          onKeyDown={(e) => {
            lastKeyDownCodeRef.current = e.code;
            lastKeyDownQueryRef.current = query;
          }}
          onKeyUp={(e) => {
            if (
              lastKeyDownCodeRef.current === 'Escape' &&
              lastKeyDownQueryRef.current &&
              !query
            ) {
              e.stopPropagation();
            }
          }}
          onChange={(e) => {
            const newQuery = e.target.value;
            setQuery(newQuery);
          }}
          onClear={() => {
            setQuery('');
          }}
        />
      </div>
      <React.Suspense
        fallback={
          <div className="m-[12px] flex h-[var(--search-for-users-list-height)] items-center justify-center">
            <LoadingIndicator containerClassName="self-center" />
          </div>
        }
      >
        <StarterPackUsersSelector searchQuery={debouncedQuery} />
      </React.Suspense>
    </div>
  );
}

function StarterPackUsersSelector({ searchQuery }: { searchQuery: string }) {
  const [state, dispatch] = useStarterPacksSetupSteps();

  const { data, onEndReached, isFetchingNextPage } =
    useSearchUsersForStarterPacks({
      search: searchQuery,
    });

  const users = React.useMemo(() => {
    return uniqBy(
      data.pages.flatMap((p) => p.result.users),
      (o) => o.fid,
    );
  }, [data.pages]);

  const selectedUsersFids = React.useMemo(() => {
    return state.users.map(({ fid }) => fid);
  }, [state.users]);

  const onUserPress = React.useCallback(
    ({ isSelected, item }: { isSelected: boolean; item: ApiUser }) => {
      if (isSelected) {
        dispatch({ type: 'RemoveUser', fid: item.fid });
      } else {
        dispatch({ type: 'AddUser', user: item });
      }
    },
    [dispatch],
  );

  const renderItem = React.useCallback(
    ({ item }: { item: ApiUser }) => {
      const isSelected = selectedUsersFids.indexOf(item.fid) !== -1;

      return (
        <div>
          <User
            user={item}
            compact
            avatarSizing="sm2"
            hideFollowButton={true}
            showFollowing={false}
            className="cursor-pointer px-2 hover:bg-overlay-faint"
            onClick={(e) => {
              e.preventDefault();

              onUserPress({ isSelected, item });
            }}
            Action={
              <div
                className={classNames(
                  'flex h-6 w-6 items-center justify-center rounded-lg border border-default',
                  isSelected && 'bg-action-primary',
                )}
              >
                {isSelected && <CheckIcon className="text-light" size={16} />}
              </div>
            }
          />
        </div>
      );
    },
    [onUserPress, selectedUsersFids],
  );

  return (
    <FlatList
      containerClassName="overflow-y-auto overflow-x-hidden h-[var(--search-for-users-list-height)] scrollbar-vert"
      data={users}
      renderItem={renderItem}
      keyExtractor={(item) => `target-${item.fid}`}
      onEndReached={onEndReached}
      isFetchingNextPage={isFetchingNextPage}
      emptyView={<></>}
    />
  );
}

export { StarterPacksModal };
