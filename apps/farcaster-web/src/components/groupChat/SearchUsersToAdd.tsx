import type { ApiUser } from 'farcaster-client-data';
import { useDirectCastUsers, userKeyExtractor } from 'farcaster-client-hooks';
import uniqBy from 'lodash/uniqBy';
import React, { useCallback, useMemo, useState } from 'react';

import {
  type DirectCastTarget,
  SearchForDirectCastTargets,
} from '~/components/directCasts/SearchForDirectCastTargets';
import { DefaultModalActionButtons } from '~/components/modals/DefaultModalActionButtons';

interface SearchUsersToAddProps {
  memberFids: number[];
  removedFids: number[];
  submitButtonLabel: string;
  onSubmit: (newCounterParties: ApiUser[]) => void;
  onSelectionChanged?: (newCounterParties: ApiUser[]) => void;
  noSelectionView?: React.ReactNode;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  secondaryButtonLabel?: string;
  onSecondaryButtonClick?: () => void;
}

const SearchUsersToAdd: React.FC<SearchUsersToAddProps> = ({
  memberFids,
  removedFids,
  submitButtonLabel,
  onSubmit,
  onSelectionChanged,
  noSelectionView,
  searchInputRef,
  secondaryButtonLabel,
  onSecondaryButtonClick,
}) => {
  const [newCounterParties, setNewCounterParties] = useState<ApiUser[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState('');

  const locallyManagedMembersToShow = useMemo(() => {
    return memberFids.filter((fid) => removedFids.indexOf(fid) === -1);
  }, [memberFids, removedFids]);

  const { data, onEndReached, isFetchingNextPage } = useDirectCastUsers({
    q: query,
    excludeFids: locallyManagedMembersToShow,
  });

  const handleSelectionChanged = useCallback(
    (selectedTargets: DirectCastTarget[]) => {
      const updatedCounterParties = selectedTargets
        .filter(
          (target): target is { type: 'user'; content: ApiUser } =>
            target.type === 'user',
        )
        .map((target) => target.content);
      setNewCounterParties(updatedCounterParties);
      onSelectionChanged?.(updatedCounterParties);
    },
    [onSelectionChanged],
  );

  const results = useMemo(
    () =>
      uniqBy(
        data?.pages.flatMap((page) =>
          page.result.users.map(
            (user): DirectCastTarget => ({
              type: 'user',
              content: user,
            }),
          ),
        ) || [],
        (target) => userKeyExtractor(target.content as ApiUser),
      ),
    [data],
  );

  return (
    <div className="flex h-full flex-col">
      <SearchForDirectCastTargets
        onSelectionChanged={handleSelectionChanged}
        searchInputRef={searchInputRef}
        results={results}
        noSelectionView={noSelectionView}
        onEndReached={onEndReached}
        isFetchingNextPage={isFetchingNextPage}
        onQueryStringChange={setQuery}
      />
      <div className="flex w-full justify-end border-t p-[16px] border-default">
        <DefaultModalActionButtons
          isLoading={submitting}
          isPrimaryButtonDisabled={newCounterParties.length === 0}
          onSecondaryButtonClick={onSecondaryButtonClick}
          onPrimaryButtonClick={() => {
            setSubmitting(true);
            onSubmit(newCounterParties);
          }}
          secondaryButtonLabel={secondaryButtonLabel}
          primaryButtonLabel={
            newCounterParties.length === 0 ? 'Select users' : submitButtonLabel
          }
        />
      </div>
    </div>
  );
};

export { SearchUsersToAdd };
