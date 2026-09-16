import { ChevronLeftIcon, KebabHorizontalIcon } from '@primer/octicons-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import classNames from 'classnames';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiDirectCastConversationFilter,
  ApiDirectCastConversationViewCategory,
} from 'farcaster-client-data';
import {
  useDebouncedValue,
  useDirectCastConversation,
  usePrefetchDirectCastInboxByAccount,
} from 'farcaster-client-hooks';
import React, { useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { DirectCastsInbox } from '~/components/directCasts/DirectCastsInbox';
import { DropdownMenuItem } from '~/components/dropdownMenu/DropdownMenuItem';
import { Filter } from '~/components/Filter';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { SearchInput } from '~/components/forms/SearchInput';
import { FullScreenLoadingIndicator } from '~/components/loaders/FullScreenLoadingIndicator';
import { NewDirectCastConversationModal } from '~/components/modals/NewDirectCastConversationModal';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useDirectCasts } from '~/contexts/DirectCastsProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { useParams } from '~/hooks/navigation/useParams';
import { getConversationIdFromActiveConversationId } from '~/utils/directCastUtils';

const filterTabs = [
  {
    value: 'all',
    name: 'All',
  },
  {
    value: 'unread',
    name: 'Unread',
  },
  {
    value: 'group',
    name: 'Groups',
  },
  {
    value: '1-1',
    name: '1:1s',
  },
];

const requestsFilterTabs = [
  {
    value: 'request',
    name: 'You may know',
  },
  {
    value: 'void',
    name: 'Low priority',
  },
];

const RequestsIcon: React.FC = React.memo(() => {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.25 4C3.11193 4 3 4.11193 3 4.25V16.75C3 16.8881 3.11193 17 3.25 17H5.75C6.16421 17 6.5 17.3358 6.5 17.75V20.9393L10.2197 17.2197C10.3603 17.079 10.5511 17 10.75 17H20.75C20.8881 17 21 16.8881 21 16.75V4.25C21 4.11193 20.8881 4 20.75 4H3.25ZM1.5 4.25C1.5 3.2835 2.2835 2.5 3.25 2.5H20.75C21.7165 2.5 22.5 3.2835 22.5 4.25V16.75C22.5 17.7165 21.7165 18.5 20.75 18.5H11.0607L7.48744 22.0732C7.21418 22.3465 6.84356 22.5 6.45711 22.5C5.65237 22.5 5 21.8476 5 21.0429V18.5H3.25C2.2835 18.5 1.5 17.7165 1.5 16.75V4.25Z"
        className="fill-[#8B99A4] dark:fill-[#9FA3AF]"
      />
      <path
        d="M11.0398 14.8636V7H12.8239V14.8636H11.0398ZM8 11.8239V10.0398H15.8636V11.8239H8Z"
        className="fill-[#8B99A4] dark:fill-[#9FA3AF]"
      />
    </svg>
  );
});

const NoteIcon: React.FC<{ size: number }> = React.memo(({ size }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="li:pen-square" clipPath="url(#clip0_112_2072)">
        <path
          id="Vector"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M1.25253 2.58579C1.62761 2.21071 2.13632 2 2.66675 2H7.33341C7.7016 2 8.00008 2.29848 8.00008 2.66667C8.00008 3.03486 7.7016 3.33333 7.33341 3.33333H2.66675C2.48994 3.33333 2.32037 3.40357 2.19534 3.5286C2.07032 3.65362 2.00008 3.82319 2.00008 4V13.3333C2.00008 13.5101 2.07032 13.6797 2.19534 13.8047C2.32037 13.9298 2.48994 14 2.66675 14H12.0001C12.1769 14 12.3465 13.9298 12.4715 13.8047C12.5965 13.6797 12.6667 13.5101 12.6667 13.3333V8.66667C12.6667 8.29848 12.9652 8 13.3334 8C13.7016 8 14.0001 8.29848 14.0001 8.66667V13.3333C14.0001 13.8638 13.7894 14.3725 13.4143 14.7475C13.0392 15.1226 12.5305 15.3333 12.0001 15.3333H2.66675C2.13631 15.3333 1.62761 15.1226 1.25253 14.7475C0.877462 14.3725 0.666748 13.8638 0.666748 13.3333V4C0.666748 3.46957 0.877462 2.96086 1.25253 2.58579Z"
          className="fill-[#24292E] dark:fill-[#FFFFFF]"
        />
        <path
          id="Vector_2"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M13.3334 1.91927C13.1352 1.91927 12.945 1.99803 12.8048 2.13822L6.60207 8.34098L6.24967 9.75057L7.65926 9.39818L13.862 3.19541C14.0022 3.05522 14.081 2.86508 14.081 2.66682C14.081 2.46856 14.0022 2.27841 13.862 2.13822C13.7218 1.99803 13.5317 1.91927 13.3334 1.91927ZM11.862 1.19541C12.2523 0.805172 12.7815 0.585938 13.3334 0.585938C13.8853 0.585938 14.4146 0.805172 14.8048 1.19541C15.1951 1.58565 15.4143 2.11493 15.4143 2.66682C15.4143 3.2187 15.1951 3.74798 14.8048 4.13822L8.4715 10.4716C8.38606 10.557 8.27901 10.6176 8.16179 10.6469L5.49512 11.3136C5.26794 11.3704 5.02761 11.3038 4.86202 11.1382C4.69644 10.9726 4.62987 10.7323 4.68667 10.5051L5.35333 7.83846C5.38264 7.72124 5.44325 7.61419 5.52869 7.52875L11.862 1.19541Z"
          className="fill-[#24292E] dark:fill-[#FFFFFF]"
        />
      </g>
      <defs>
        <clipPath id="clip0_112_2072">
          <rect
            width={size}
            height={size}
            className="fill-[#24292E] dark:fill-[#FFFFFF]"
          />
        </clipPath>
      </defs>
    </svg>
  );
});

const DirectCastsInboxPage: React.FC = React.memo(() => {
  const { conversationId: activeConversationId } = useParams(
    'directCastsConversation',
  );
  const conversationId =
    getConversationIdFromActiveConversationId(activeConversationId);

  const { fid } = useCurrentUser();
  const prefetchDirectCastInbox = usePrefetchDirectCastInboxByAccount();
  const navigate = useNavigate();

  const {
    hasArchived,
    isInitializing,
    isEmpty,
    requestsCount,
    hasUnreadRequests,
    filter,
    setFilter,
  } = useDirectCasts();

  const { data: conversation } = useDirectCastConversation({
    conversationId,
  });

  const { trackEvent } = useAnalytics();

  const [showNewConversationModal, setShowNewConversationModal] =
    React.useState<boolean>(false);

  const [inbox, setInbox] = useState<ApiDirectCastConversationViewCategory>(
    () => {
      if (conversation) {
        return conversation.viewerContext.category ?? 'default';
      }
      return 'default';
    },
  );

  const [query, setQuery] = React.useState<string>();
  const debouncedQuery = useDebouncedValue({
    value: query,
    debounceDuration: 300,
  });

  const solelyOnInbox = React.useMemo(
    () => !activeConversationId,
    [activeConversationId],
  );

  const showNewDirectCastModal = React.useCallback(() => {
    setShowNewConversationModal(true);
  }, []);

  const showArchivedInboxToggle = React.useMemo(() => {
    return typeof query === 'undefined' && hasArchived && inbox !== 'archived';
  }, [hasArchived, inbox, query]);

  const showRequestsInboxToggle = React.useMemo(() => {
    return (
      typeof query === 'undefined' &&
      inbox === 'default' &&
      !filter &&
      requestsCount !== 0
    );
  }, [query, inbox, requestsCount, filter]);

  const showHiddenInboxToggle = React.useMemo(() => {
    return typeof query === 'undefined' && inbox === 'request' && !filter;
  }, [query, inbox, filter]);

  React.useEffect(() => {
    trackEvent(AnalyticsEvent.ViewDirectCastsInbox, {});
  }, [trackEvent]);

  const prefetchArchived = React.useCallback(() => {
    void prefetchDirectCastInbox({
      fid,
      params: { category: 'archived' },
    });
  }, [prefetchDirectCastInbox, fid]);

  const prefetchRequests = React.useCallback(() => {
    void prefetchDirectCastInbox({
      fid,
      params: { category: 'request' },
    });
  }, [prefetchDirectCastInbox, fid]);

  const prefetchHidden = React.useCallback(() => {
    void prefetchDirectCastInbox({
      fid,
      params: { category: 'void' },
    });
  }, [prefetchDirectCastInbox, fid]);

  const pageTitle = useMemo(() => {
    switch (inbox) {
      case 'request':
        return 'Requests';
      case 'void':
        return 'Hidden';
      case 'archived':
        return 'Archived';
      default:
        return 'Direct casts';
    }
  }, [inbox]);

  // IF_CHANGED_CHANGE(DirectCastsConversationPage.tsx):
  // Adjust the Page calculated height if the height of the collapsed inbox changes.
  return (
    <>
      <Page meta={{ title: 'Direct Casts / Farcaster' }}>
        <BorderedMainContent className="flex flex-col lg:w-[1023px] lg:flex-row">
          <div
            className={classNames(
              'max-h-screen w-full min-w-0 shrink-0 flex-col border-default lg:w-[393px] lg:border-r',
              solelyOnInbox ? 'flex' : 'hidden lg:flex',
            )}
          >
            <div className="flex flex-col">
              <PageHeader hideCastButton={true} hideBorderBottom={true}>
                <div className="flex flex-col">
                  <div className="flex flex-row">
                    {inbox !== 'default' && (
                      <div
                        className="cursor-pointer pr-4"
                        onClick={() =>
                          setInbox(inbox === 'void' ? 'request' : 'default')
                        }
                      >
                        <ChevronLeftIcon size={24} />
                      </div>
                    )}
                    <PageTitle>{pageTitle}</PageTitle>
                  </div>
                </div>
                <div className="ml-auto flex flex-none flex-row items-center space-x-4">
                  <div>
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger className="outline-hidden group flex size-[24px] cursor-pointer flex-col items-center justify-center rounded-full hover:bg-overlay-light">
                        <KebabHorizontalIcon className="rounded-full" />
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Content
                        side="bottom"
                        align="end"
                        sideOffset={4}
                        onClick={(e) => e.stopPropagation()}
                        className="outline-hidden z-20 min-w-32 rounded-md border p-1 shadow-lg bg-app border-default"
                      >
                        {showArchivedInboxToggle && (
                          <DropdownMenuItem
                            onSelect={() => {
                              setInbox('archived');
                            }}
                            onMouseOver={prefetchArchived}
                          >
                            Archived
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onSelect={() => {
                            navigate({
                              to: 'settingsDirectCasts',
                              params: {},
                            });
                          }}
                        >
                          Settings
                        </DropdownMenuItem>
                      </DropdownMenu.Content>
                    </DropdownMenu.Root>
                  </div>
                  <div
                    className="group mb-[2px] flex size-[24px] cursor-pointer flex-col items-center justify-center rounded-full hover:bg-overlay-light"
                    onClick={showNewDirectCastModal}
                  >
                    <NoteIcon size={16} />
                  </div>
                </div>
              </PageHeader>
            </div>
            {isInitializing ? (
              <FullScreenLoadingIndicator />
            ) : (
              <>
                {inbox === 'default' && (
                  <div
                    className={classNames(
                      'space-y-[12px] border-b p-[12px] border-default',
                      {
                        'pb-[16px]': query,
                        'pb-[8px]': !query,
                      },
                    )}
                  >
                    <div>
                      <SearchInput
                        variant="muted"
                        value={query || ''}
                        onChange={(e) => {
                          if (e.target.value === '') {
                            setQuery(undefined);
                          } else {
                            setQuery(e.target.value);
                          }
                        }}
                        onClear={() => setQuery(undefined)}
                        placeholder="Search"
                      />
                    </div>
                    {!debouncedQuery && (
                      <div>
                        <Filter
                          items={filterTabs}
                          value={filter ?? 'all'}
                          onValueChange={(value) => {
                            if (value) {
                              setFilter(
                                value === 'all'
                                  ? undefined
                                  : (value as ApiDirectCastConversationFilter),
                              );
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
                {showHiddenInboxToggle &&
                  (inbox === 'request' || inbox === 'void') && (
                    <div className="border-b p-[12px] pb-[8px] border-default">
                      <Filter
                        items={requestsFilterTabs}
                        value={inbox}
                        onValueChange={(value) => {
                          if (value === 'request' || value === 'void') {
                            setInbox(value);
                          }
                        }}
                        onItemMouseOver={(value) => {
                          if (value === 'void') {
                            prefetchHidden();
                          }
                        }}
                      />
                    </div>
                  )}
                <div
                  className={classNames([
                    'scrollbar-vert overflow-y-auto lg:pb-12',
                    solelyOnInbox ? 'block' : 'hidden lg:block',
                  ])}
                >
                  {showRequestsInboxToggle && (
                    <div
                      onClick={() => setInbox('request')}
                      onMouseOver={prefetchRequests}
                      className="flex cursor-pointer flex-row items-center px-[12px] text-default hover:bg-overlay-faint"
                    >
                      <div className="mr-[8px] flex size-[56px] shrink-0 flex-col items-center justify-center rounded-full">
                        <RequestsIcon />
                      </div>
                      <div className="relative flex size-full flex-row items-center justify-between">
                        <div className="font-semibold">Requests</div>
                        <div className="flex flex-row items-center gap-2">
                          <div className="text-sm font-normal text-muted">
                            {requestsCount}
                          </div>
                          {hasUnreadRequests && (
                            <div
                              className={classNames(
                                'shadow-xs flex min-h-[8px] min-w-[8px] items-center justify-center rounded-full px-[3.25px] text-sm font-normal bg-action text-light',
                              )}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <DirectCastsInbox
                    activeConversationId={activeConversationId}
                    filter={debouncedQuery}
                    inboxCategory={inbox}
                  />
                </div>
              </>
            )}
          </div>
          {solelyOnInbox && !isEmpty ? (
            <div className="-mt-32 hidden flex-col items-center justify-center sm:w-[540px] lg:flex lg:w-[620px]">
              <span className="mb-4 text-2xl font-semibold">
                Select a conversation
              </span>
              <DefaultButton onClick={showNewDirectCastModal}>
                New direct cast
              </DefaultButton>
            </div>
          ) : (
            <React.Suspense fallback={<FullScreenLoadingIndicator />}>
              <Outlet />
            </React.Suspense>
          )}
        </BorderedMainContent>
      </Page>
      {showNewConversationModal && (
        <NewDirectCastConversationModal
          allowGroups={true}
          onClose={() => {
            setShowNewConversationModal(false);
          }}
        />
      )}
    </>
  );
});

DirectCastsInboxPage.displayName = 'DirectCastsInboxPage';

export { DirectCastsInboxPage };
