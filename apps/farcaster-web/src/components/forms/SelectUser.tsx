import { ApiUser } from 'farcaster-client-data';
import {
  useDebouncedValue,
  userKeyExtractor,
  useUser,
} from 'farcaster-client-hooks';
import React, {
  FC,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { SearchInput } from '~/components/forms/SearchInput';
import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { FlatList } from '~/components/lists/FlatList';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { User } from '~/components/users/User';

interface SelectUserProps {
  fid: number | undefined;
  users: ApiUser[];
  onEndReached: () => unknown;
  isFetchingNextPage: boolean;
  onSearchChange: (query: string) => void;
  onUserChange: (fid: number | undefined) => void;
  placeholder?: string;
  removeButtonLabel?: string;
  emptyText?: string;
}

const SelectUser: FC<SelectUserProps> = ({
  fid,
  users,
  onEndReached,
  isFetchingNextPage,
  onSearchChange,
  onUserChange,
  placeholder = 'Search users',
  removeButtonLabel = 'Remove',
  emptyText,
}) => {
  const [q, setQ] = useState('');
  const trimmedQ = useMemo(() => q.trim(), [q]);

  const debouncedQ = useDebouncedValue({
    value: trimmedQ,
    debounceDuration: 300,
  });

  useEffect(() => {
    onSearchChange(debouncedQ);
  }, [debouncedQ, onSearchChange]);

  if (fid) {
    return (
      <div className="flex w-full flex-row items-center">
        <div className="flex-1">
          <Suspense fallback={<LoadingIndicator />}>
            <SelectedUser fid={fid} />
          </Suspense>
        </div>
        <div className="flex-0">
          <DefaultButton
            onClick={() => onUserChange(undefined)}
            variant="muted"
          >
            {removeButtonLabel}
          </DefaultButton>
        </div>
      </div>
    );
  } else {
    return (
      <div>
        <SearchInput
          placeholder={placeholder}
          className="!rounded-md border border-default"
          onChange={(e) => {
            setQ(e.target.value);
          }}
          onClear={() => setQ('')}
          onKeyUp={(e) => {
            // Stop propagation so that if we are in a modal, it's not closed
            // Escape does clear the current query
            if (e.code === 'Escape') {
              e.stopPropagation();
            }
          }}
        />
        <div className="relative bg-app">
          {debouncedQ && (
            <UserSearchResultsPopup
              users={users}
              onEndReached={onEndReached}
              isFetchingNextPage={isFetchingNextPage}
              onClickUser={(fid: number) => {
                setQ('');
                onUserChange(fid);
              }}
              emptyText={emptyText}
            />
          )}
        </div>
      </div>
    );
  }
};
SelectUser.displayName = 'SelectUser';

interface UserSearchResultsPopupProps {
  users: ApiUser[];
  onEndReached: () => unknown;
  isFetchingNextPage: boolean;
  onClickUser: (fid: number) => void;
  emptyText?: string;
}

const UserSearchResultsPopup: FC<UserSearchResultsPopupProps> = ({
  users,
  onEndReached,
  isFetchingNextPage,
  onClickUser,
  emptyText = 'No users found',
}) => {
  const renderUser = useCallback(
    ({ item }: { item: ApiUser }) => {
      return (
        <User
          user={item}
          compact
          avatarSizing="sm"
          hideFollowButton
          showFollowing
          className="cursor-pointer border-b-0 hover:bg-overlay-medium"
          onClick={(e) => {
            e.preventDefault();
            onClickUser(item.fid);
          }}
        />
      );
    },
    [onClickUser],
  );

  return (
    <div className="absolute z-20 mt-1 max-h-[400px] w-full overflow-y-auto rounded-lg border bg-app border-default">
      <FlatList
        data={users}
        renderItem={renderUser}
        onEndReached={onEndReached}
        isFetchingNextPage={isFetchingNextPage}
        keyExtractor={userKeyExtractor}
        emptyView={<DefaultEmptyListView message={emptyText} />}
      />
    </div>
  );
};

interface SelectedUserProps {
  fid: number;
}

const SelectedUser: FC<SelectedUserProps> = ({ fid }) => {
  const { data } = useUser({ fid });

  const user = useMemo(() => data?.result.user, [data?.result.user]);

  if (!user) {
    return null;
  }

  return (
    <User
      user={user}
      compact
      avatarSizing="sm"
      hideFollowButton
      showFollowing
      className="border-b-0"
      onClick={(e) => {
        e.preventDefault();
      }}
    />
  );
};

export { SelectUser };
