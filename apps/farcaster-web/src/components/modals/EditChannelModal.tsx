import {
  ArrowLeftIcon,
  ChevronRightIcon,
  DeviceCameraIcon,
  KeyIcon,
  PencilIcon,
  PersonAddIcon,
  ShieldCheckIcon,
} from '@primer/octicons-react';
import cn from 'classnames';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiChannel,
  ApiChannelCastingMode,
  ApiChannelUser,
  getWarpcastInviteUrl,
} from 'farcaster-client-data';
import {
  getChannelDefaultFeed,
  useChannelBannedUsers,
  useChannelUsersForInvite,
  useChannelUsersForManagement,
  useInviteToChannel,
  useResetChannelInviteCode,
  useTrackEvent,
  useUpdateChannel,
} from 'farcaster-client-hooks';
import { ApiUser } from 'farcaster-cryptography';
import React, {
  FC,
  memo,
  Suspense,
  useCallback,
  useMemo,
  useState,
} from 'react';

import { RitualsIcon } from '~/components/casts/actions/icons/RitualsIcon';
import { ChannelUserListItem } from '~/components/channelUsers/ChannelUserListItem';
import { Divider } from '~/components/Divider';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { CheckboxInput } from '~/components/forms/CheckBoxInput';
import { FileInput } from '~/components/forms/FileInput';
import { SearchInput } from '~/components/forms/SearchInput';
import { SelectOne, SelectOneOption } from '~/components/forms/SelectOne';
import { SelectUser } from '~/components/forms/SelectUser';
import { Textarea } from '~/components/forms/Textarea';
import { TextInput } from '~/components/forms/TextInput';
import { GroupInviteLink } from '~/components/groupChat/GroupInviteLink';
import { Image } from '~/components/images/Image';
import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { FlatList } from '~/components/lists/FlatList';
import { FullScreenLoadingIndicator } from '~/components/loaders/FullScreenLoadingIndicator';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { ConfirmationModal } from '~/components/modals/ConfirmationModal';
import { DefaultCloseModalButton } from '~/components/modals/DefaultCloseModalButton';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { Modal } from '~/components/modals/Modal';
import { defaultTextareaRows } from '~/constants/forms';
import { appPathPrefix } from '~/constants/routePrefixes';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useUploadCloudflareImage } from '~/hooks/data/useUploadCloudflareImage';
import { useGoBack } from '~/hooks/navigation/useGoBack';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { useChannelModOrOwner } from '~/hooks/useUserChannelRole';
import { ChannelEditSection } from '~/types/routing';
import { trackError } from '~/utils/errorUtils';
import { toast } from '~/utils/toast';

import { RitualsModalContent } from './RitualsModal';

const channelIconFileInputId = 'channel-icon-file-input';

type EditChannelModalProps = {
  channel: ApiChannel;
  onClose: () => void;
  section?: ChannelEditSection;
};

const EditChannelModal: FC<EditChannelModalProps> = memo((props) => {
  return (
    <>
      <Modal>
        <DefaultModalContainer onClose={props.onClose}>
          <div className="flex size-full flex-col items-center justify-center">
            <div
              className="scrollbar-vert relative flex max-h-[780px] w-[388px] min-w-[36rem] flex-col justify-between space-y-0 rounded-lg bg-app"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <Suspense
                fallback={
                  <div className="flex items-center justify-center p-6">
                    <LoadingIndicator />
                  </div>
                }
              >
                <EditChannelModalInner {...props} />
              </Suspense>
            </div>
          </div>
        </DefaultModalContainer>
      </Modal>
    </>
  );
});
EditChannelModal.displayName = 'EditChannelModal';

const EditChannelModalInner: FC<EditChannelModalProps> = memo(
  ({ channel, section }) => {
    const navigate = useNavigate();
    const goBack = useGoBack();
    const role = useChannelModOrOwner(channel.key);

    const onCloseButtonPress = React.useCallback(() => {
      if (!section) {
        navigate({ to: 'channel', params: { channelKey: channel.key } });
      } else {
        goBack();
      }
    }, [section, navigate, channel.key, goBack]);

    const [title] = React.useMemo(() => {
      if (!section) {
        return ['Manage channel'];
      } else {
        switch (section) {
          case 'members':
            return ['Members'];
          case 'banned-users':
            return ['Banned users'];
          case 'invite':
            return ['Invite a member'];
          case 'owner':
            return ['Transfer channel ownership'];
          case 'details':
            return ['Edit channel details'];
          case 'rituals':
            return ['Rituals'];
          case 'who-can-cast':
            return ['Who can cast'];
        }
      }
    }, [section]);

    const sectionComponent = React.useMemo<React.ReactNode>(() => {
      if (!section) {
        return (
          <EditModalContent
            role={role}
            onClickSection={(section: ChannelEditSection) => {
              navigate({
                to: 'channelSettingsSection',
                params: { channelKey: channel.key, section },
              });
            }}
          />
        );
      } else {
        switch (section) {
          case 'members':
            return (
              <EditChannelMembers
                channel={channel}
                onClose={onCloseButtonPress}
                inviteUsers={() => {
                  navigate({
                    to: 'channelSettingsSection',
                    params: { channelKey: channel.key, section: 'invite' },
                  });
                }}
              />
            );
          case 'banned-users':
            return (
              <EditChannelBannedUsers
                channel={channel}
                onClose={onCloseButtonPress}
              />
            );
          case 'invite':
            return (
              <InviteChannelMembers
                channel={channel}
                onClose={onCloseButtonPress}
              />
            );
          case 'owner':
            return (
              <EditChannelOwnerContent
                channel={channel}
                onClose={onCloseButtonPress}
              />
            );
          case 'details':
            return (
              <EditChannelDetailsContent
                channel={channel}
                onClose={onCloseButtonPress}
              />
            );
          case 'rituals':
            return (
              <RitualsModalContent
                channel={channel}
                onClose={onCloseButtonPress}
              />
            );
          case 'who-can-cast':
            return <WhoCanCast channel={channel} />;
        }
      }
    }, [channel, navigate, onCloseButtonPress, role, section]);

    return (
      <>
        <div
          className={cn(
            'relative flex w-full flex-row items-center gap-4 border-b p-4 border-default',
            section === 'rituals' && 'hidden',
          )}
        >
          {typeof section !== 'undefined' && (
            <div
              className="flex flex-none cursor-pointer items-center justify-center rounded-full p-2 text-faint hover:bg-overlay-faint hover:text-default"
              onClick={onCloseButtonPress}
            >
              <ArrowLeftIcon size={20} />
            </div>
          )}
          <div className="flex-1 text-xl font-semibold">{title}</div>
          <div className="flex-none self-end">
            {typeof section === 'undefined' && (
              <DefaultCloseModalButton
                onClick={onCloseButtonPress}
                className="p-2"
              />
            )}
            {section === 'members' && (
              <DefaultButton
                variant="secondary"
                onClick={() => {
                  navigate({
                    to: 'channelSettingsSection',
                    params: { channelKey: channel.key, section: 'invite' },
                  });
                }}
                className="flex flex-row items-center justify-center gap-2"
                title="Invite a member"
              >
                <PersonAddIcon size={18} />
                Invite
              </DefaultButton>
            )}
          </div>
        </div>
        <div>
          <Suspense fallback={<FullScreenLoadingIndicator />}>
            {sectionComponent}
          </Suspense>
        </div>
      </>
    );
  },
);

type EditModalContentProps = {
  role: 'moderator' | 'owner' | undefined;
  onClickSection: (section: ChannelEditSection) => void;
};

const EditModalContent: FC<EditModalContentProps> = memo(
  ({ onClickSection, role }) => {
    return (
      <div className="flex flex-col space-y-0">
        <EditModalButtonContent section="details" onPress={onClickSection} />
        <Divider />
        <EditModalButtonContent section="members" onPress={onClickSection} />
        <Divider />
        <EditModalButtonContent
          section="banned-users"
          onPress={onClickSection}
        />
        <Divider />
        <EditModalButtonContent section="invite" onPress={onClickSection} />
        {role === 'owner' && (
          <>
            <Divider />
            <EditModalButtonContent
              section="rituals"
              onPress={onClickSection}
            />
            <Divider />
            <EditModalButtonContent
              section="who-can-cast"
              onPress={onClickSection}
            />
            <Divider />
            <EditModalButtonContent section="owner" onPress={onClickSection} />
          </>
        )}
      </div>
    );
  },
);

type EditModalButtonProps = {
  section: ChannelEditSection;
  onPress: (property: ChannelEditSection) => void;
};

const EditModalButtonContent: FC<EditModalButtonProps> = memo(
  ({ onPress, section }) => {
    const iconComp = React.useMemo<React.ReactNode>(() => {
      switch (section) {
        case 'details':
          return (
            <PencilIcon
              size={40}
              className="rounded-full p-3 bg-overlay-medium dark:bg-overlay-light"
            />
          );
        case 'members':
          return (
            <ShieldCheckIcon
              size={40}
              className="rounded-full p-3 bg-overlay-medium dark:bg-overlay-light"
            />
          );
        case 'banned-users':
          return (
            <ShieldCheckIcon
              size={40}
              className="rounded-full p-3 bg-overlay-medium dark:bg-overlay-light"
            />
          );
        case 'invite':
          return (
            <PersonAddIcon
              size={40}
              className="rounded-full p-3 bg-overlay-medium dark:bg-overlay-light"
            />
          );
        case 'owner':
          return (
            <KeyIcon
              size={40}
              className="rounded-full p-3 bg-overlay-medium dark:bg-overlay-light"
            />
          );
        case 'rituals':
          return (
            <div className="rounded-full p-3 bg-overlay-medium dark:bg-overlay-light">
              <RitualsIcon />
            </div>
          );
        case 'who-can-cast':
          return (
            <div className="rounded-full p-3 bg-overlay-medium dark:bg-overlay-light">
              <PencilIcon />
            </div>
          );
      }
    }, [section]);

    const [title, subtitle] = React.useMemo(() => {
      return (() => {
        switch (section) {
          case 'members':
            return ['Manage members', 'Add, remove members and moderators'];
          case 'banned-users':
            return ['Banned users', 'View banned users and unban them'];
          case 'invite':
            return [
              'Invite a member',
              'Invite someone to become a member of your channel',
            ];
          case 'details':
            return [
              'Edit channel profile',
              'Edit the name, description and images',
            ];
          case 'owner':
            return ['Change owner', 'Transfer the channel to another user'];
          case 'rituals':
            return ['Rituals', 'Create, edit and manage rituals'];
          case 'who-can-cast':
            return [
              'Who can cast',
              `Decide who's allowed to cast in the channel`,
            ];
        }
      })();
    }, [section]);

    const onPressCallback = React.useCallback(() => {
      onPress(section);
    }, [section, onPress]);

    return (
      <div
        className="flex cursor-pointer flex-row items-center justify-between gap-4 px-8 py-4 hover:bg-overlay-light"
        onClick={onPressCallback}
      >
        <div className="flex-0">{iconComp}</div>
        <div className="flex flex-1 flex-col">
          <span className="text-lg font-semibold">{title}</span>
          <span className="text-md text-muted">{subtitle}</span>
        </div>
        <div className="flex flex-col">
          <ChevronRightIcon size={20} className="text-muted" />
        </div>
      </div>
    );
  },
);

const EditChannelDetailsContent: FC<{
  channel: ApiChannel;
  onClose: () => void;
}> = memo(({ channel, onClose }) => {
  const [submitting, setSubmitting] = useState(false);
  const [uploadingHeader, setUploadingHeader] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [imageUrl, setImageUrl] = useState(channel.imageUrl);
  const [headerImageUrl, setHeaderImageUrl] = useState(channel.headerImageUrl);
  const [description, setDescription] = useState(channel.description ?? '');
  const [name, setName] = useState(channel.name || channel.key || '');

  const [url, setUrl] = useState(channel.headerAction?.target ?? '');
  const [urlCta, setUrlCta] = useState(channel?.headerAction?.title ?? '');
  const uploadCloudflareImage = useUploadCloudflareImage();
  const updateChannel = useUpdateChannel();

  const channelHeaderImageSrc = React.useMemo(() => {
    if (typeof headerImageUrl !== 'undefined') {
      return headerImageUrl;
    }

    return `${appPathPrefix}/images/DefaultChannelCoverImage.png`;
  }, [headerImageUrl]);

  const disabled =
    Boolean((!urlCta && url) || (urlCta && !url)) ||
    uploadingHeader ||
    uploadingIcon ||
    submitting;

  const submit = async () => {
    if (disabled) {
      return;
    }

    try {
      setSubmitting(true);

      await updateChannel({
        key: channel.key,
        name,
        description,
        imageUrl:
          imageUrl && imageUrl !== channel.imageUrl ? imageUrl : undefined,
        headerImageUrl:
          headerImageUrl && headerImageUrl !== channel.headerImageUrl
            ? headerImageUrl
            : undefined,
        headerAction: {
          title: urlCta,
          target: url,
        },
      });
    } catch (e) {
      toast({ message: 'Failed to update channel details', type: 'error' });
    } finally {
      setSubmitting(false);
    }

    onClose();
  };

  return (
    <div className="overflow-y-auto">
      <div className="relative h-[180px]">
        <Image
          alt="og"
          src={channelHeaderImageSrc}
          className="absolute aspect-[3/1] size-full object-cover object-center"
        />
        <div
          className="group relative flex size-full cursor-pointer items-center justify-center hover:bg-overlay"
          onClick={() => {
            const input = document.getElementById('channelheaderinput');
            if (input) {
              input.click();
            }
          }}
        >
          <div className="hidden text-white group-hover:block">
            <DeviceCameraIcon size={20} />
          </div>
        </div>
      </div>
      <div className="ml-4 mt-[-48px]">
        <div className="border-light-app-background dark:border-dark-app-background relative size-[88px] overflow-hidden rounded-full border">
          <div className="absolute inset-0 size-full bg-muted">
            {imageUrl && (
              <Image
                src={imageUrl}
                className="size-full rounded-full object-cover"
                alt={'Channel image'}
              />
            )}
          </div>
          <div
            className="group relative flex size-full cursor-pointer items-center justify-center hover:bg-overlay"
            onClick={() => {
              const input = document.getElementById('channeliconinput');
              if (input) {
                input.click();
              }
            }}
          >
            <div className="hidden text-white group-hover:block">
              <DeviceCameraIcon size={20} />
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3 p-3">
        <FileInput
          id={'channelheaderinput'}
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files && e.target.files[0];

            if (!file) {
              return;
            }

            try {
              setUploadingHeader(true);
              const uploadResult = await uploadCloudflareImage({
                file,
              });

              if (uploadResult?.imageUrl) {
                setHeaderImageUrl(uploadResult.imageUrl);
              }
            } catch (error) {
              trackError(error);
              toast({ message: 'Failed to upload image', type: 'error' });
            } finally {
              setUploadingHeader(false);
            }
          }}
        />
        <FileInput
          id={'channeliconinput'}
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files && e.target.files[0];

            if (!file) {
              return;
            }

            try {
              setUploadingIcon(true);
              const uploadResult = await uploadCloudflareImage({
                file,
              });

              if (uploadResult?.imageUrl) {
                setImageUrl(uploadResult.imageUrl);
              }
            } catch (error) {
              trackError(error);
              toast({ message: 'Failed to upload image', type: 'error' });
            } finally {
              setUploadingIcon(false);
            }
          }}
        />
        <div>
          <div className="mb-2 text-xs text-muted">Name</div>
          <TextInput
            autoCapitalize={'false'}
            autoFocus={false}
            autoCorrect={'false'}
            onChange={(e) => setName(e.target.value)}
            maxLength={32}
            value={name}
          />
        </div>
        <div>
          <div className="mb-2 text-xs text-muted">Description</div>
          <Textarea
            value={description}
            rows={defaultTextareaRows}
            maxLength={256}
            withCharCounter={true}
            hideResizeHandle
            onChange={async (e) => {
              setDescription(e.target.value);
            }}
          />
        </div>
        <div>
          <div className="flex flex-row items-center gap-1">
            <div className="text-xs font-semibold">External Link</div>
            <div className="rounded-[35px] bg-[#EFEFEF] px-2.5 py-0.5 text-xs text-muted dark:bg-[#2E2835]">
              Optional
            </div>
          </div>
          <div className="mt-1 text-sm text-muted">
            Link to a mini app or a website from your channel page.
          </div>
        </div>
        <div>
          <div className="mb-2 text-xs text-muted">Title</div>
          <TextInput
            autoCapitalize={'false'}
            autoFocus={false}
            autoCorrect={'false'}
            onChange={(e) => setUrlCta(e.target.value)}
            value={urlCta}
            maxLength={16}
            withCharCounter
          />
        </div>
        <div>
          <div className="mb-2 text-xs text-muted">URL</div>
          <TextInput
            autoCapitalize={'false'}
            autoFocus={false}
            autoCorrect={'false'}
            onChange={(e) => setUrl(e.target.value)}
            value={url}
            maxLength={256}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <DefaultButton size={'lg'} onClick={onClose} variant="secondary">
            Cancel
          </DefaultButton>
          <DefaultButton size={'lg'} onClick={submit} disabled={disabled}>
            Save changes
          </DefaultButton>
        </div>
      </div>
    </div>
  );
});

function getOptions(): SelectOneOption<ApiChannelCastingMode>[] {
  return [
    {
      title: 'Members only',
      subtitle:
        'Show casts and replies from members. Show replies from recommended users.',
      value: 'members-only',
    },
    {
      title: 'Recommended only',
      subtitle:
        'Show casts and replies from all members and recommended users.',
      value: 'recommended',
    },
    {
      title: 'Everyone',
      subtitle: 'Everyone can cast and reply',
      value: 'everyone',
    },
  ];
}

const WhoCanCast: FC<{
  channel: ApiChannel;
}> = memo(({ channel }) => {
  const updateChannel = useUpdateChannel();

  const [value, setValue] = useState<ApiChannelCastingMode>(
    channel.castingMode || 'recommended',
  );

  const options: SelectOneOption<ApiChannelCastingMode>[] = getOptions();

  const handleChange = (nextValue: ApiChannelCastingMode) => {
    setValue(nextValue);

    void updateChannel({
      publicCasting: nextValue !== 'members-only',
      key: channel.key,
      castingMode: nextValue,
    });
  };

  return (
    <div className="overflow-y-auto">
      <SelectOne options={options} value={value} onChange={handleChange} />
    </div>
  );
});

type EditChannelMembersProps = {
  channel: ApiChannel;
  inviteUsers: () => void;
  onClose: () => void;
};

type ManageMembersListHeader = {
  header: 'mods' | 'members';
};

const EditChannelMembers: React.FC<EditChannelMembersProps> = ({
  channel,
  inviteUsers,
}) => {
  const [query, setQuery] = useState('');
  const { flatData, onEndReached, isPending, isFetchingNextPage } =
    useChannelUsersForManagement({
      channelKey: channel.key,
      query,
    });

  const [mods, members] = useMemo(
    () =>
      (flatData ?? []).reduce(
        (acc, channelUser) => {
          acc[
            ['owner', 'moderator', 'pending-moderator'].includes(
              channelUser.relation,
            )
              ? 0
              : 1
          ].push(channelUser);

          return acc;
        },
        [[], []] as [ApiChannelUser[], ApiChannelUser[]],
      ),
    [flatData],
  );

  const includeHeaders = !query;
  const dataWithHeaders = useMemo<
    Array<ApiChannelUser | ManageMembersListHeader>
  >(() => {
    if (!flatData) {
      return [];
    }

    if (!includeHeaders) {
      return flatData;
    }

    return [
      {
        type: 'header',
        header: 'mods',
      },
      ...mods,
      {
        type: 'header',
        header: 'members',
      },
      ...members,
    ];
  }, [flatData, mods, members, includeHeaders]);

  const firstNonModIndex = mods ? mods.length : undefined;
  const skipSeperatorIndices = useMemo(() => {
    if (!includeHeaders) {
      return [];
    }

    return [dataWithHeaders.length - 1, firstNonModIndex];
  }, [includeHeaders, dataWithHeaders.length, firstNonModIndex]);

  const renderItem = useCallback(
    ({
      item,
      index,
    }: {
      item: ApiChannelUser | ManageMembersListHeader;
      index: number;
    }) => {
      if ('header' in item) {
        if (item.header === 'mods') {
          return (
            <div>
              <div className="mb-1 font-semibold">Moderators</div>
              <div className="mb-2 text-sm text-muted">
                Add up to 10 moderators to help manage your channel.
              </div>
            </div>
          );
        } else {
          return (
            <>
              <div className="mt-3">
                <div className="mb-1 font-semibold">Members</div>
                <div className="mb-2 text-sm text-muted">
                  These users can cast and reply in the channel.
                </div>
              </div>
              {members.length === 0 && (
                <div className="mt-1">
                  <DefaultButton
                    variant="secondary"
                    onClick={inviteUsers}
                    className="flex w-full flex-row items-center justify-center gap-2"
                    title="Invite a member"
                  >
                    <PersonAddIcon size={18} />
                    Invite a member
                  </DefaultButton>
                </div>
              )}
            </>
          );
        }
      } else {
        return (
          <ChannelUserListItem
            key={item.user.fid}
            channelUser={item}
            channelKey={channel.key}
            skipSeperator={skipSeperatorIndices.includes(index)}
          />
        );
      }
    },
    [channel.key, inviteUsers, members.length, skipSeperatorIndices],
  );

  return (
    <div className="flex h-[550px] flex-col">
      <div className="flex-none border-b p-3 border-default">
        <SearchInput
          value={query || ''}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          onClear={() => setQuery('')}
          placeholder="Search"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-3">
        {query.length > 0 ? (
          <div>
            {isPending ? (
              <div className="flex size-full flex-col items-center justify-start pt-48">
                <LoadingIndicator />
              </div>
            ) : (
              <FlatList
                data={flatData}
                emptyView={<DefaultEmptyListView message="No members found" />}
                renderItem={renderItem}
                keyExtractor={(item) => item.user.fid.toString()}
                onEndReached={onEndReached}
                isFetchingNextPage={isFetchingNextPage}
              />
            )}
          </div>
        ) : (
          <>
            {isPending ? (
              <div className="flex size-full flex-col items-center justify-start pt-48">
                <LoadingIndicator />
              </div>
            ) : (
              <div className="py-3">
                <FlatList
                  data={dataWithHeaders}
                  emptyView={
                    <DefaultEmptyListView message="No members found" />
                  }
                  renderItem={renderItem}
                  keyExtractor={(item) =>
                    'header' in item ? item.header : item.user.fid.toString()
                  }
                  onEndReached={onEndReached}
                  isFetchingNextPage={isFetchingNextPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

type InviteChannelMembersProps = {
  channel: ApiChannel;
  onClose: () => void;
};

const InviteChannelMembers: React.FC<InviteChannelMembersProps> = ({
  channel,
}) => {
  const { trackEvent } = useTrackEvent();
  const [query, setQuery] = useState('');
  const { flatData, onEndReached, isFetchingNextPage, isPending } =
    useChannelUsersForInvite({
      channelKey: channel.key,
      query,
    });

  const renderInviteUserListItem = useCallback(
    ({ item }: { item: ApiChannelUser }) => (
      <InviteChannelUserListItem
        channelUser={item}
        channel={channel}
        key={item.user.fid}
      />
    ),
    [channel],
  );

  const onCopy = async () => {
    trackEvent(AnalyticsEvent.CopyChannelInviteLink, {
      channelKey: channel.key,
    });
  };

  const resetChannelInviteCode = useResetChannelInviteCode();
  const reset = async () => {
    try {
      await resetChannelInviteCode({ channelKey: channel.key });
      toast({ message: 'Invite link was reset' });
    } catch (e) {
      trackError(new Error('Failed to update invite code', { cause: e }));
      toast({ message: 'Failed to reset link', type: 'error' });
    }
  };

  const inviteUrl = useMemo(() => {
    if (!channel?.inviteCode) {
      return null;
    }

    return getWarpcastInviteUrl({
      channelKey: channel.key,
      inviteCode: channel.inviteCode ?? '',
    });
  }, [channel?.key, channel?.inviteCode]);

  return (
    <div className="flex h-[550px] flex-col">
      <div className="flex flex-none flex-col gap-3 border-b p-3 border-default">
        {inviteUrl && (
          <GroupInviteLink
            groupInviteLink={inviteUrl}
            subtext="Share with people you trust. Avoid posting publicly."
            resetLink={reset}
            onCopy={onCopy}
          />
        )}
        <SearchInput
          value={query || ''}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          onClear={() => setQuery('')}
          placeholder="Search"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-3">
        <>
          {isPending ? (
            <div className="flex size-full flex-col items-center justify-start pt-48">
              <LoadingIndicator />
            </div>
          ) : (
            <FlatList
              data={flatData}
              emptyView={<DefaultEmptyListView message="No users found" />}
              renderItem={renderInviteUserListItem}
              keyExtractor={(item) => item.user.fid.toString()}
              onEndReached={onEndReached}
              isFetchingNextPage={isFetchingNextPage}
            />
          )}
        </>
      </div>
    </div>
  );
};

function InviteChannelUserListItem({
  channelUser,
  channel,
}: {
  channelUser: ApiChannelUser;
  channel: ApiChannel;
}) {
  const [confirmInviteRemoved, setConfirmInviteRemoved] =
    useState<ApiUser | null>(null);

  const inviteToChannel = useInviteToChannel();
  // Consider moving this to backend as criteria may change
  const canInvite = channelUser.relation !== 'none';

  const invite = useCallback(
    async (confirmed = false) => {
      if (channelUser.previouslyRemoved && !confirmed) {
        setConfirmInviteRemoved(channelUser.user);
        return;
      }

      try {
        await inviteToChannel({
          channelKey: channel.key,
          fid: channelUser.user.fid,
        });
      } catch (e) {
        trackError(new Error('Failed to invite user to channel', { cause: e }));
        // toast.show('Failed to invite user', {
        //   placement: 'top',
        //   type: 'danger',
        // });
      }
    },
    [
      channelUser.previouslyRemoved,
      channelUser.user,
      inviteToChannel,
      channel.key,
    ],
  );

  const button = useMemo(() => {
    if (channelUser.relation === 'pending-member') {
      return (
        <DefaultButton disabled variant="muted" size="md">
          Invited
        </DefaultButton>
      );
    } else if (
      ['owner', 'member', 'moderator', 'pending-moderator'].includes(
        channelUser.relation,
      )
    ) {
      return (
        <DefaultButton variant="muted" disabled size="md">
          Member
        </DefaultButton>
      );
    } else if (
      channelUser.relation === 'user-follower' ||
      channelUser.relation === 'channel-follower'
    ) {
      return (
        <DefaultButton onClick={() => invite()} title="Invite" size="md">
          Invite
        </DefaultButton>
      );
    }

    return null;
  }, [invite, channelUser.relation]);

  return (
    <>
      <div className={cn(!canInvite && 'opacity-50')}>
        <ChannelUserListItem
          channelUser={channelUser}
          channelKey={channel.key}
          Action={button}
        />
      </div>
      {confirmInviteRemoved && (
        <ConfirmInviteRestrictedModal
          close={() => setConfirmInviteRemoved(null)}
          invite={() => {
            setConfirmInviteRemoved(null);
            invite(true);
          }}
        />
      )}
    </>
  );
}

type EditChannelBannedUsersProps = {
  channel: ApiChannel;
  onClose: () => void;
};

const EditChannelBannedUsers: React.FC<EditChannelBannedUsersProps> = ({
  channel,
}) => {
  const [query, setQuery] = useState('');
  const { flatData, onEndReached, isLoading, isFetchingNextPage } =
    useChannelBannedUsers({
      channelKey: channel.key,
      query,
    });

  const renderItem = useCallback(
    ({ item }: { item: ApiChannelUser }) => {
      return (
        <ChannelUserListItem
          key={item.user.fid}
          channelUser={item}
          channelKey={channel.key}
          skipSeperator={false}
        />
      );
    },
    [channel.key],
  );

  return (
    <div className="flex h-[550px] flex-col">
      <div className="flex-none border-b p-3 border-default">
        <SearchInput
          value={query || ''}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          onClear={() => setQuery('')}
          placeholder="Search"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-3">
        <div>
          {isLoading ? (
            <div className="flex size-full flex-col items-center justify-start pt-48">
              <LoadingIndicator />
            </div>
          ) : (
            <FlatList
              data={flatData}
              emptyView={<DefaultEmptyListView message="No banned users" />}
              renderItem={renderItem}
              keyExtractor={(item) => item.user.fid.toString()}
              onEndReached={onEndReached}
              isFetchingNextPage={isFetchingNextPage}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export function ConfirmInviteRestrictedModal({
  close,
  invite,
}: {
  invite: () => void;
  close: () => void;
}) {
  return (
    <ConfirmationModal
      onBackdropClose={() => {
        close();
      }}
      onCancel={() => {
        close();
      }}
      onConfirm={invite}
      confirmText="Confirm"
      title="Previously removed"
      body={
        <>
          This member was removed by another moderator. Are you sure you want to
          add them back?
        </>
      }
    />
  );
}

type EditChannelOwnerContentProps = {
  channel: ApiChannel;
  onClose: () => void;
};

const EditChannelOwnerContent: React.FC<EditChannelOwnerContentProps> = ({
  channel,
}) => {
  const [ownerFid, setOwnerFid] = useState<number | undefined>(undefined);
  const [confirmed, setConfirmed] = useState(false);
  const { trackEvent } = useTrackEvent();

  const updateChannel = useUpdateChannel();
  const currentUserFid = useCurrentUser().fid;
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');

  const { flatData, onEndReached, isFetchingNextPage } =
    useChannelUsersForManagement({
      channelKey: channel.key,
      query: searchQuery,
      role: 'moderator',
    });

  const users = useMemo(
    () => flatData?.map((channelUser) => channelUser.user) || [],
    [flatData],
  );

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="text-muted">
        The new owner needs to be a moderator of the channel.
      </div>
      <SelectUser
        fid={ownerFid}
        onUserChange={(fid) => {
          setConfirmed(false);
          setOwnerFid(fid);
        }}
        onSearchChange={(q: string) => {
          setSearchQuery(q);
        }}
        users={users}
        onEndReached={onEndReached}
        isFetchingNextPage={isFetchingNextPage}
        placeholder="Search for a new owner"
        removeButtonLabel="Cancel"
        emptyText="No moderators found"
      />
      <div className="flex flex-row gap-2">
        <CheckboxInput
          checked={confirmed}
          id="confirm"
          onChange={(e) => {
            setConfirmed(e.target.checked);
          }}
        />
        <label htmlFor="confirm">
          I understand that I cannot reverse this change
        </label>
      </div>
      <DefaultButton
        size="lg"
        variant="danger"
        disabled={ownerFid === undefined || !confirmed}
        onClick={async () => {
          if (!ownerFid) {
            return;
          }

          try {
            await updateChannel({ key: channel.key, ownerFid });
            trackEvent(AnalyticsEvent.EditChannelOwner, {
              channelKey: channel.key,
              prevOwnerFid: currentUserFid,
              newOwnerFid: ownerFid,
            });

            navigate({
              to: 'channelFeed',
              params: {
                channelKey: channel.key,
                tab: getChannelDefaultFeed(channel),
              },
            });
          } catch (e) {
            toast({
              message:
                'Error transferring to a new owner, please try again later',
              type: 'error',
            });
            trackError(e);
          }
        }}
      >
        Transfer ownership
      </DefaultButton>
    </div>
  );
};

export { channelIconFileInputId, EditChannelModal };
