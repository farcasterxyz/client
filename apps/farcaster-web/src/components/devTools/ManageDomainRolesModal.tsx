import { ApiDomainRoleDetails, ApiUser } from 'farcaster-client-data';
import {
  resolveUsernameShort,
  useDevToolsAddDomainRole,
  useDevToolsDomainRoles,
  useDevToolsRemoveDomainRole,
  useNonSuspenseSearchUsers,
} from 'farcaster-client-hooks';
import { UserMinusIcon, UserPlusIcon, XIcon } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Avatar } from '~/components/avatar/Avatar';
import { FarcasterProBadge } from '~/components/badges/FarcasterProBadge';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { SearchInput } from '~/components/forms/SearchInput';
import { FlatList } from '~/components/lists/FlatList';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { DefaultModalActionButtons } from '~/components/modals/DefaultModalActionButtons';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { DefaultModalContent } from '~/components/modals/DefaultModalContent';
import { DefaultModalHeader } from '~/components/modals/DefaultModalHeader';
import { Modal } from '~/components/modals/Modal';
import { useUserLevel } from '~/hooks/data/useUserLevel';
import { cn } from '~/lib/utils';
import { toast } from '~/utils/toast';

const MAX_NUM_TARGETS_TO_SHOW = 5;
const APPROX_HEIGHT_PER_TARGET = 62;

type DomainRoleSection = 'roles' | 'add' | 'remove';

interface ManageDomainRolesModalProps {
  domain: string;
  onClose: () => void;
}

interface ManageDomainRolesContentProps {
  domain: string;
  onAddAdmin: () => void;
  onRemoveAdmin: (role: ApiDomainRoleDetails) => void;
}

const ManageDomainRolesModal: React.FC<ManageDomainRolesModalProps> = ({
  domain,
  onClose,
}) => {
  const [section, setSection] = useState<DomainRoleSection>('roles');
  const [selectedRole, setSelectedRole] = useState<ApiDomainRoleDetails | null>(
    null,
  );

  const getTitle = () => {
    switch (section) {
      case 'roles':
        return 'Manage Roles';
      case 'add':
        return 'Add Admin';
      case 'remove':
        return 'Remove Admin';
    }
  };

  const handleBack = () => {
    setSection('roles');
  };

  return (
    <Modal>
      <DefaultModalContainer onClose={onClose}>
        <DefaultModalContent>
          <DefaultModalHeader
            title={getTitle()}
            onClose={onClose}
            onBackClick={section !== 'roles' ? handleBack : undefined}
            hideDefaultCloseModalButton={section !== 'roles'}
          />
          <div className="size-full overflow-hidden">
            {section === 'roles' && (
              <ManageDomainRolesContent
                domain={domain}
                onAddAdmin={() => setSection('add')}
                onRemoveAdmin={(role) => {
                  setSelectedRole(role);
                  setSection('remove');
                }}
              />
            )}
            {section === 'add' && (
              <AddAdminContent domain={domain} onBack={handleBack} />
            )}
            {section === 'remove' && selectedRole && (
              <RemoveAdminContent
                domain={domain}
                role={selectedRole}
                onBack={handleBack}
              />
            )}
          </div>
        </DefaultModalContent>
      </DefaultModalContainer>
    </Modal>
  );
};

const ManageDomainRolesContent: React.FC<ManageDomainRolesContentProps> = ({
  domain,
  onAddAdmin,
  onRemoveAdmin,
}) => {
  const { data, isLoading, isError } = useDevToolsDomainRoles({ domain });
  const admins = data?.filter((role) => role.role === 'admin');

  if (!data) {
    if (isLoading) {
      return (
        <div className="flex size-full items-center justify-center p-4">
          <LoadingIndicator />
        </div>
      );
    }
    if (isError) {
      return (
        <div className="flex size-full items-center justify-center p-4">
          <div className="text-center text-sm text-muted">
            Failed to fetch domain roles, please try again later.
          </div>
        </div>
      );
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold">Admins</span>
          <span className="text-sm text-muted">
            Up to 10 admins can be added to help manage {domain}
          </span>
        </div>
        {admins && admins.length > 0 ? (
          <div className="flex flex-col gap-2">
            {admins?.map((admin, index) => (
              <RoleRow
                key={admin.fid}
                domain={domain}
                role={admin}
                isLast={index === admins.length - 1}
                onRemoveAdmin={onRemoveAdmin}
              />
            ))}
          </div>
        ) : (
          <div className="flex h-[150px] flex-col items-center justify-center gap-2">
            <div className="text-sm text-faint">No admins found</div>
          </div>
        )}
      </div>
      <div className="flex-1" />
      <div className="flex flex-row items-center justify-center gap-2">
        <div className="flex w-full justify-end p-[16px] border-default">
          <DefaultModalActionButtons
            onPrimaryButtonClick={onAddAdmin}
            primaryButtonLabel={
              <div className="flex flex-row items-center gap-2">
                <UserPlusIcon className="size-4" />
                Add Admin
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
};

const AddAdminContent: React.FC<{ domain: string; onBack: () => void }> = ({
  domain,
  onBack,
}) => {
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = React.useState('');
  const [selectedTargets, setSelectedTargets] = useState<ApiUser[]>([]);
  const addAdmin = useDevToolsAddDomainRole();
  const { data: domainRoles } = useDevToolsDomainRoles({ domain });
  const admins = domainRoles?.filter((role) => role.role === 'admin');

  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const {
    data: searchedResults,
    onEndReached,
    isFetchingNextPage,
  } = useNonSuspenseSearchUsers({
    q: query,
    excludeSelf: true,
  });

  const results = useMemo(() => {
    return (
      searchedResults?.pages.flatMap(({ result: { users } }) =>
        users.filter(
          (user) => !admins?.some((admin) => admin.fid === user.fid),
        ),
      ) || []
    );
  }, [searchedResults, admins]);

  const handleConfirm = useCallback(async () => {
    setAdding(true);
    try {
      await Promise.all(
        selectedTargets.map((target) =>
          addAdmin({ domain, fid: target.fid, role: 'admin' }),
        ),
      );
      toast({
        message: 'Admins added',
        type: 'success',
      });
      onBack();
    } catch (error) {
      toast({
        message: 'Failed to add admins',
        type: 'error',
      });
    } finally {
      setAdding(false);
    }
  }, [onBack, setAdding, domain, selectedTargets, addAdmin]);

  const handleSelectionChanged = useCallback((users: ApiUser[]) => {
    setSelectedTargets(users);
  }, []);

  const maxNumSelectedTargets = 10 - (admins?.length || 0);

  return (
    <div className="flex h-full flex-col">
      <SearchForUsersToAdd
        onSelectionChanged={handleSelectionChanged}
        searchInputRef={searchInputRef}
        results={results}
        onEndReached={onEndReached}
        isFetchingNextPage={isFetchingNextPage}
        showEmptyResultsView={true}
        onQueryStringChange={setQuery}
        maxNumSelectedTargets={maxNumSelectedTargets}
      />
      <div className="flex-1" />
      <div className="flex flex-row items-center justify-center gap-2">
        <div className="flex w-full justify-end p-[16px] border-default">
          <DefaultModalActionButtons
            isLoading={adding}
            isPrimaryButtonDisabled={selectedTargets.length === 0}
            onSecondaryButtonClick={onBack}
            onPrimaryButtonClick={handleConfirm}
            secondaryButtonLabel={'Cancel'}
            primaryButtonLabel={'Add'}
          />
        </div>
      </div>
    </div>
  );
};

const RemoveAdminContent: React.FC<{
  domain: string;
  role: ApiDomainRoleDetails;
  onBack: () => void;
}> = ({ domain, role, onBack }) => {
  const removeAdmin = useDevToolsRemoveDomainRole();
  const [removing, setRemoving] = useState(false);

  const handleConfirm = useCallback(async () => {
    try {
      setRemoving(true);
      await removeAdmin({ domain, fid: role.fid });
      onBack();
      toast({
        message: 'Admin removed',
        type: 'success',
      });
    } catch (error) {
      toast({
        message: 'Failed to remove admin',
        type: 'error',
      });
    } finally {
      setRemoving(false);
    }
  }, [domain, onBack, removeAdmin, role.fid]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-full flex-col gap-8 p-4">
        <span className="text-base">
          This will remove{' '}
          <span className="font-semibold">{role.user.username}</span> as an
          admin of <span className="font-semibold">{domain}</span>. They will no
          longer have access to analytics and other management tools.
        </span>
        <span className="text-base text-muted">
          Are you sure you want to proceed?
        </span>
      </div>
      <div className="flex-1" />
      <div className="flex flex-row items-center justify-center gap-2">
        <div className="flex w-full justify-end p-[16px] border-default">
          <DefaultModalActionButtons
            isLoading={removing}
            isPrimaryButtonDisabled={false}
            onSecondaryButtonClick={onBack}
            onPrimaryButtonClick={handleConfirm}
            secondaryButtonLabel={'Cancel'}
            primaryButtonLabel={'Confirm'}
            primaryIsDestructive={true}
          />
        </div>
      </div>
    </div>
  );
};

const RoleRow: React.FC<{
  domain: string;
  role: ApiDomainRoleDetails;
  isLast: boolean;
  onRemoveAdmin: (role: ApiDomainRoleDetails) => void;
}> = ({ role, isLast, onRemoveAdmin }) => {
  return (
    <div
      className={cn('flex flex-row items-center justify-between py-2', {
        'border-b border-default': !isLast,
      })}
    >
      <div className="flex flex-row items-center gap-2">
        <Avatar user={role.user as ApiUser} />
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted">{role.user.username}</span>
        </div>
      </div>
      <div className="flex flex-row items-center gap-2">
        <DefaultButton variant="muted" onClick={() => onRemoveAdmin(role)}>
          <UserMinusIcon className="size-4 text-danger" />
        </DefaultButton>
      </div>
    </div>
  );
};

interface SearchForUsersToAddProps {
  onSelectionChanged: (selectedTargets: ApiUser[]) => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  noSelectionView?: React.ReactNode;
  results: ApiUser[];
  onEndReached: () => void;
  isFetchingNextPage: boolean;
  showEmptyResultsView?: boolean;
  maxNumSelectedTargets?: number;
  onQueryStringChange: (query: string) => void;
}

const SearchForUsersToAdd: React.FC<SearchForUsersToAddProps> = ({
  onSelectionChanged,
  searchInputRef,
  noSelectionView,
  results,
  onEndReached,
  isFetchingNextPage,
  showEmptyResultsView,
  maxNumSelectedTargets,
  onQueryStringChange,
}) => {
  const [query, setQuery] = useState('');
  const [selectedTargets, setSelectedTargets] = useState<ApiUser[]>([]);
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

  const availableTargets = results.filter(
    (user) => !selectedTargets.includes(user),
  );

  const selectedMaximumTargets = !!(
    maxNumSelectedTargets && selectedTargets.length >= maxNumSelectedTargets
  );

  const handleSelect = useCallback(
    (user: ApiUser) => {
      setSelectedTargets((prev) => {
        const updated = [...prev, user];
        onSelectionChanged(updated);
        return updated;
      });
      setQuery('');
      onQueryStringChange('');
      if (searchInputRef?.current) {
        searchInputRef.current.focus();
      }
    },
    [onSelectionChanged, onQueryStringChange, searchInputRef],
  );

  const handleRemove = useCallback(
    (user: ApiUser) => {
      setSelectedTargets((prev) => {
        const updated = prev.filter((t) => t !== user);
        onSelectionChanged(updated);
        return updated;
      });
    },
    [onSelectionChanged],
  );

  const renderItem = useCallback(
    ({ item }: { item: ApiUser }) => {
      return (
        <SearchResultEntry
          user={item}
          handleSelect={handleSelect}
          selectedMaximumTargets={selectedMaximumTargets}
        />
      );
    },
    [handleSelect, selectedMaximumTargets],
  );

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
                {selectedTargets.map((user) => (
                  <SelectedTargetEntry
                    key={user.fid}
                    user={user}
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
          keyExtractor={(item) => item.fid.toString()}
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

const SearchResultEntry: React.FC<{
  user: ApiUser;
  handleSelect: (user: ApiUser) => void;
  selectedMaximumTargets: boolean;
}> = ({ user, handleSelect, selectedMaximumTargets }) => {
  const userIsProUser = useUserLevel(user) === 'pro';
  return (
    <div
      className={cn(
        'relative flex cursor-pointer flex-row items-center gap-2 py-2 pl-3 hover:cursor-pointer hover:bg-overlay-faint',
        selectedMaximumTargets && 'pointer-events-none opacity-50',
      )}
      onClick={() => handleSelect(user)}
    >
      <Avatar user={user} />
      <span className="text-sm text-muted">{user.username}</span>
      {userIsProUser && <FarcasterProBadge size={18} />}
    </div>
  );
};

const SelectedTargetEntry: React.FC<{
  user: ApiUser;
  handleRemove: (user: ApiUser) => void;
}> = ({ user, handleRemove }) => {
  const userIsProUser = useUserLevel(user) === 'pro';
  return (
    <div
      key={user.fid}
      onClick={() => handleRemove(user)}
      className="mb-2 mr-2 flex cursor-pointer flex-row items-center gap-1 rounded-md border p-1 align-baseline text-sm bg-overlay-medium border-default"
    >
      <Avatar className="z-0 mr-2" size="xs" user={user} />
      <span>
        {resolveUsernameShort({
          username: user?.username,
          fid: user?.fid,
        })}
      </span>
      {userIsProUser && <FarcasterProBadge size={14} />}
      <div className="ml-2 mt-[2px] inline-block size-[16px] cursor-pointer rounded-full text-center leading-[10px]">
        <XIcon size={16} />
      </div>
    </div>
  );
};

export { ManageDomainRolesModal };
