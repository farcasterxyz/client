import { XIcon } from '@primer/octicons-react';
import type {
  ApiDirectCastConversationInfoV3,
  ApiUser,
} from 'farcaster-client-data';
import { resolveUsernameShort } from 'farcaster-client-hooks';
import React, { useEffect, useMemo, useState } from 'react';

import { Avatar } from '~/components/avatar/Avatar';
import { FarcasterProBadge } from '~/components/badges/FarcasterProBadge';
import { SearchInput } from '~/components/forms/SearchInput';
import { NewDirectCastConversationGroup } from '~/components/groupChat/NewDirectCastConversationGroup';
import { FlatList } from '~/components/lists/FlatList';
import { NewDirectCastConversationUser } from '~/components/users/NewDirectCastConversationUser';
import { useUserLevel } from '~/hooks/data/useUserLevel';

import { GroupConversationImage } from './GroupConversationImage';

const MAX_NUM_TARGETS_TO_SHOW = 5;
const APPROX_HEIGHT_PER_TARGET = 62;

type DirectCastTarget =
  | { type: 'user'; content: ApiUser }
  | { type: 'group'; content: ApiDirectCastConversationInfoV3 };

interface SearchForDirectCastTargetsProps {
  onSelectionChanged: (selectedTargets: DirectCastTarget[]) => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  noSelectionView?: React.ReactNode;
  results: DirectCastTarget[];
  onEndReached: () => void;
  isFetchingNextPage: boolean;
  showEmptyResultsView?: boolean;
  maxNumSelectedTargets?: number;
  onQueryStringChange: (query: string) => void;
}

const SearchForDirectCastTargets: React.FC<SearchForDirectCastTargetsProps> = ({
  onSelectionChanged,
  searchInputRef,
  noSelectionView,
  results: targets = [],
  onEndReached,
  isFetchingNextPage,
  onQueryStringChange,
  showEmptyResultsView = true,
  maxNumSelectedTargets,
}) => {
  const [query, setQuery] = useState('');
  const [selectedTargets, setSelectedTargets] = useState<DirectCastTarget[]>(
    [],
  );
  const lastKeyDownCodeRef = React.useRef<string>(undefined);
  const lastKeyDownQueryRef = React.useRef<string>(undefined);

  const listHeight = useMemo(() => {
    return MAX_NUM_TARGETS_TO_SHOW * APPROX_HEIGHT_PER_TARGET;
  }, []);

  useEffect(() => {
    document.body.style.setProperty(
      '--search-for-direct-cast-targets-list-height',
      `${listHeight}px`,
    );
  }, [listHeight]);

  useEffect(() => {
    if (searchInputRef?.current) {
      searchInputRef.current.focus();
    }
  }, [searchInputRef]);

  const availableTargets = useMemo(() => {
    return targets.filter(
      (target) =>
        !selectedTargets.some(
          (selected) =>
            (target.type === 'user' &&
              selected.type === 'user' &&
              target.content.fid === selected.content.fid) ||
            (target.type === 'group' &&
              selected.type === 'group' &&
              target.content.conversationId ===
                selected.content.conversationId),
        ),
    );
  }, [targets, selectedTargets]);

  const selectedMaximumTargets = useMemo(() => {
    return !!(
      maxNumSelectedTargets && selectedTargets.length >= maxNumSelectedTargets
    );
  }, [maxNumSelectedTargets, selectedTargets]);

  const handleSelect = (target: DirectCastTarget) => {
    setSelectedTargets((prev) => {
      const updated = [...prev, target];
      onSelectionChanged(updated);
      return updated;
    });
    setQuery('');
    onQueryStringChange('');
    if (searchInputRef?.current) {
      searchInputRef.current.focus();
    }
  };

  const handleRemove = (target: DirectCastTarget) => {
    setSelectedTargets((prev) => {
      const updated = prev.filter((t) => t !== target);
      onSelectionChanged(updated);
      return updated;
    });
  };

  const renderItem = ({ item }: { item: DirectCastTarget }) => {
    if (item.type === 'user') {
      return (
        <NewDirectCastConversationUser
          user={item.content}
          onUserClickCallback={() => handleSelect(item)}
          disabled={selectedMaximumTargets}
        />
      );
    }
    return (
      <NewDirectCastConversationGroup
        group={item.content}
        onGroupClickCallback={() => handleSelect(item)}
        disabled={selectedMaximumTargets}
      />
    );
  };

  return (
    <>
      <div className="mx-[16px] mb-[12px]">
        <SearchInput
          ref={searchInputRef}
          placeholder="Search"
          className="!rounded-md border border-default"
          variant="muted"
          value={query}
          disabled={selectedMaximumTargets}
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
            onQueryStringChange(newQuery);
          }}
          onClear={() => {
            setQuery('');
            onQueryStringChange('');
          }}
        />
      </div>
      {query === '' && selectedTargets.length === 0 && noSelectionView}
      {selectedTargets.length > 0 && (
        <>
          <div className="flex items-center justify-start border-b px-[16px] pb-3 border-default">
            <span className="text-xs font-medium leading-none text-faint">
              Selected
            </span>
          </div>
          {selectedMaximumTargets && (
            <div className="mx-[16px] mt-3 inline-flex items-center justify-center rounded-lg border border-yellow-500 bg-yellow-500/10 px-4 py-3">
              <span className="text-base font-normal leading-tight text-default">
                You selected the maximum number of users.
              </span>
            </div>
          )}
          <div className="mx-[16px] my-[12px] flex h-fit flex-row">
            <div className="max-h-[120px] grow overflow-y-auto">
              <div className="flex flex-row flex-wrap border-default">
                {selectedTargets.map((target) => (
                  <SelectedTargetEntry
                    key={`dc-group-${target.type === 'user' ? 'user' : 'group'}-${target.type === 'user' ? target.content.fid : target.content.conversationId}`}
                    target={target}
                    handleRemove={handleRemove}
                  />
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <>
        {availableTargets.length > 0 && (
          <div className="flex items-center justify-start border-b px-[16px] pb-3 border-default">
            <span className="text-xs font-normal leading-none text-faint">
              {'Results'}
            </span>
          </div>
        )}
        <FlatList
          containerClassName="overflow-y-auto overflow-x-hidden my-[12px] h-[var(--search-for-direct-cast-targets-list-height)]"
          data={availableTargets}
          renderItem={renderItem}
          keyExtractor={(item) =>
            `target-${item.type === 'user' ? item.content.fid : item.content.conversationId}`
          }
          onEndReached={onEndReached}
          isFetchingNextPage={isFetchingNextPage}
          emptyView={
            <div className="m-[12px] flex h-[var(--search-for-direct-cast-targets-list-height)] items-center justify-center">
              {showEmptyResultsView && !!query && (
                <span className="text-sm text-faint">No results found</span>
              )}
              {showEmptyResultsView && !query && (
                <span className="text-sm text-faint">
                  Start typing to search people
                </span>
              )}
            </div>
          }
        />
      </>
    </>
  );
};

const SelectedTargetEntry = ({
  target,
  handleRemove,
}: {
  target: DirectCastTarget;
  handleRemove: (target: DirectCastTarget) => void;
}) => {
  const user = target.type === 'user' ? target.content : undefined;
  const group = target.type === 'group' ? target.content : undefined;
  const isProUser = useUserLevel(user) === 'pro';
  return (
    <div
      onClick={() => handleRemove(target)}
      className="mb-2 mr-2 flex cursor-pointer flex-row rounded-md border p-1 align-baseline text-sm bg-overlay-medium border-default"
    >
      {typeof user !== 'undefined' ? (
        <Avatar className="z-0 mr-2" size="xs" user={user} />
      ) : (
        <GroupConversationImage
          imageURL={group?.photoUrl}
          size="xs"
          className="mr-2"
        />
      )}
      <span className="flex flex-row items-center gap-[2px]">
        {typeof user !== 'undefined' ? (
          <span>
            {resolveUsernameShort({
              username: user?.username,
              fid: user?.fid,
            })}
          </span>
        ) : (
          <span>{group?.name}</span>
        )}
        {isProUser && <FarcasterProBadge size={14} className="mb-px" />}
      </span>
      <div className="ml-2 mt-[2px] inline-block size-[16px] cursor-pointer rounded-full text-center leading-[10px]">
        <XIcon size={16} />
      </div>
    </div>
  );
};

export { type DirectCastTarget, SearchForDirectCastTargets };
