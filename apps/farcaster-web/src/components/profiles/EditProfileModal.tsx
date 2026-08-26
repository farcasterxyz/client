import { AlertIcon, InfoIcon, PencilIcon } from '@primer/octicons-react';
import classNames from 'classnames';
import { AnalyticsEvent } from 'farcaster-analytics';
import { toHttpsUrl } from 'farcaster-client-data';
import {
  formatDuration,
  getNotionLinkTarget,
  getSpecificallySizedImageUrl,
  useGloballyCachedUser,
  useSetUserUsername,
  useUpdateUser,
  useUserByFid,
  useUserUsernames,
} from 'farcaster-client-hooks';
import { CameraIcon } from 'lucide-react';
import React, { FormEvent, useCallback, useMemo, useState } from 'react';

import { AvatarImage } from '~/components/avatar/AvatarImage';
import { FarcasterProUnlockFeaturesModal } from '~/components/farcasterPro/FarcasterProUnlockFeaturedModal';
import { FileInput } from '~/components/forms/FileInput';
import { Form } from '~/components/forms/Form';
import { FormControl } from '~/components/forms/FormControl';
import { LocationSearchInput } from '~/components/forms/LocationSearchInput';
import { SelectInput, SelectInputOption } from '~/components/forms/SelectInput';
import { Textarea } from '~/components/forms/Textarea';
import { TextInput } from '~/components/forms/TextInput';
import { TokenSearchInput } from '~/components/forms/TokenSearchInput';
import { Image } from '~/components/images/Image';
import { ExternalLink } from '~/components/links/ExternalLink';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { AddEnsNameModal } from '~/components/modals/AddEnsNameModal';
import { DefaultModalActionButtons } from '~/components/modals/DefaultModalActionButtons';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { DefaultModalContent } from '~/components/modals/DefaultModalContent';
import { DefaultModalHeader } from '~/components/modals/DefaultModalHeader';
import { Modal } from '~/components/modals/Modal';
import { defaultTextareaRows } from '~/constants/forms';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useUploadCloudflareImage } from '~/hooks/data/useUploadCloudflareImage';
import { useCurrentUserLevel } from '~/hooks/data/useUserLevel';
import { trackError } from '~/utils/errorUtils';
import { hasProfileLocation, hasProfileToken } from '~/utils/profile';
import { toast } from '~/utils/toast';

const pfpFileInputId = 'pfp-file-input-modal';
const bannerFileInputId = 'banner-file-input-modal';
const USERNAME_ADD_ENS_OPTION_VALUE = '----add-new';

type EditProfileModalProps = {
  onClose: () => void;
  initialFocus?: 'location' | 'token';
};

const EditProfileModal: React.FC<EditProfileModalProps> = React.memo(
  ({ onClose, initialFocus }) => {
    return (
      <Modal>
        <DefaultModalContainer onClose={onClose}>
          <DefaultModalContent>
            <DefaultModalHeader title="Edit profile" onClose={onClose} />
            <React.Suspense
              fallback={
                <span className="flex size-full flex-row items-center justify-center py-8">
                  <LoadingIndicator />
                </span>
              }
            >
              <EditProfileModalContent
                onClose={onClose}
                initialFocus={initialFocus}
              />
            </React.Suspense>
          </DefaultModalContent>
        </DefaultModalContainer>
      </Modal>
    );
  },
);
EditProfileModal.displayName = 'EditProfileModal';

type EditProfileModalContentProps = {
  onClose: () => void;
  initialFocus?: 'location' | 'token';
};

const EditProfileModalContent: React.FC<EditProfileModalContentProps> = ({
  onClose,
  initialFocus,
}) => {
  const { trackEvent } = useAnalytics();
  const currentUserData = useCurrentUser();
  const { data: userByFidData } = useUserByFid({ fid: currentUserData.fid });
  const currentUser = useGloballyCachedUser({
    fallback: userByFidData?.result.user || currentUserData,
  });
  const { data: usernamesData, refetch: refetchUsernames } = useUserUsernames();
  const updateUser = useUpdateUser();
  const setUserUsername = useSetUserUsername();
  const uploadCloudflareImage = useUploadCloudflareImage();
  const userIsPro = useCurrentUserLevel() === 'pro';
  const [
    showFarcasterProUnlockFeaturesModal,
    setShowFarcasterProUnlockFeaturesModal,
  ] = useState<boolean>(false);

  const [form, setForm] = useState({
    username: { value: currentUser.username || '' },
    displayName: { value: currentUser.displayName },
    bio: { value: currentUser.profile.bio.text },
    url: { value: currentUser.profile.url || '' },
    location: {
      value: hasProfileLocation(currentUser.profile.location)
        ? currentUser.profile.location
        : undefined,
    },
    profileToken: {
      value: hasProfileToken(currentUser.profile.profileToken)
        ? currentUser.profile.profileToken
        : undefined,
    },
  });
  const [newPfpUrl, setNewPfpUrl] = useState<string | undefined>();
  const [newBannerUrl, setNewBannerUrl] = useState<string | undefined>();

  const bannerImageSrc = React.useMemo(() => {
    const url = newBannerUrl || currentUser.profile.bannerImageUrl;
    if (typeof url !== 'undefined') {
      return getSpecificallySizedImageUrl({
        staticRaster: url,
        h: 200,
        w: 600,
        increasedWidth: true,
      });
    }
    return undefined;
  }, [newBannerUrl, currentUser.profile.bannerImageUrl]);

  const [showAddEnsModal, setShowAddEnsModal] = useState<boolean>(false);

  const usernameNotEditableFor = useMemo(() => {
    if (usernamesData) {
      if (usernamesData.nextPossibleUpdateAt) {
        if (usernamesData.nextPossibleUpdateAt > Date.now()) {
          const remainingMsec = usernamesData.nextPossibleUpdateAt - Date.now();
          return remainingMsec;
        }
      }
    }
    return undefined;
  }, [usernamesData]);

  const usernameOptions: SelectInputOption[] = useMemo(() => {
    const usernames: SelectInputOption[] = [];
    if (!currentUser.username) {
      usernames.push({ name: '[none]', value: '' });
    }

    if (usernamesData) {
      usernamesData.usernames.forEach((username) => {
        usernames.push({
          name: '@' + username.name,
          value: username.name,
          disabled: !!usernameNotEditableFor,
        });
      });
    }

    usernames.push({
      name: 'Add new ENS name',
      value: USERNAME_ADD_ENS_OPTION_VALUE,
    });
    return usernames;
  }, [currentUser.username, usernameNotEditableFor, usernamesData]);

  const [profileError, setProfileError] = useState<string>();
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);

  const [isSubmittingPfp, setIsSubmittingPfp] = useState(false);
  const [isSubmittingBanner, setIsSubmittingBanner] = useState(false);

  const updateFormField = useCallback(
    <Name extends keyof typeof form>({
      error,
      name,
      value,
    }: {
      error?: string | undefined;
      name: Name;
      value: (typeof form)[Name]['value'];
    }) => {
      setProfileError(undefined);
      return setForm((prevForm) => ({
        ...prevForm,
        [name]: { value, error },
      }));
    },
    [],
  );

  const hasUpdatesToSave = useMemo(() => {
    if (isSubmittingPfp || isSubmittingBanner || isSubmittingProfile) {
      return false;
    }

    const locationHasChanged =
      form.location.value?.placeId !== currentUser.profile.location?.placeId ||
      form.location.value?.description !==
        currentUser.profile.location?.description;

    const tokenHasChanged =
      form.profileToken.value?.tokenUri !==
      currentUser.profile.profileToken?.tokenUri;

    return (
      newPfpUrl !== undefined ||
      newBannerUrl !== undefined ||
      form.displayName.value !== currentUser.displayName ||
      form.bio.value !== currentUser.profile.bio.text ||
      form.url.value !== (currentUser.profile.url || '') ||
      form.username.value !== (currentUser.username || '') ||
      locationHasChanged ||
      tokenHasChanged
    );
  }, [
    isSubmittingPfp,
    isSubmittingBanner,
    isSubmittingProfile,
    form,
    currentUser.displayName,
    currentUser.profile.bio.text,
    currentUser.profile.url,
    currentUser.profile.location,
    currentUser.profile.profileToken?.tokenUri,
    currentUser.username,
    newPfpUrl,
    newBannerUrl,
  ]);

  const onSave = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault();

      setProfileError(undefined);
      setIsSubmittingProfile(true);

      try {
        if (form.displayName.value !== currentUser.displayName) {
          trackEvent(AnalyticsEvent.UpdateDisplayName, undefined);
        }

        if (form.bio.value !== currentUser.profile.bio.text) {
          trackEvent(AnalyticsEvent.UpdatedBio, undefined);
        }

        let normalizedUrl: string | undefined = form.url.value.trim();
        if (normalizedUrl) {
          try {
            normalizedUrl = toHttpsUrl(normalizedUrl);
            new URL(normalizedUrl);
          } catch {
            normalizedUrl = '';
          }
        } else {
          normalizedUrl = '';
        }

        const updates: Parameters<typeof updateUser>[0] = {
          displayName: form.displayName.value,
          bio: form.bio.value,
          url: normalizedUrl,
        };

        if (newPfpUrl) {
          updates.pfp = newPfpUrl;
        }

        if (newBannerUrl) {
          updates.bannerImageUrl = newBannerUrl;
        }

        // Handle location field
        const formLocationId = form.location.value?.placeId || '';
        const currentLocationId = currentUser.profile.location?.placeId || '';
        if (formLocationId !== currentLocationId) {
          trackEvent(AnalyticsEvent.SetLocation, {
            locationDescription: formLocationId,
          });
        }
        updates.location = form.location.value || {
          placeId: '',
          description: '',
        };

        // Handle profile token field
        const formTokenUri = form.profileToken.value?.tokenUri || '';
        const currentTokenUri =
          currentUser.profile.profileToken?.tokenUri || '';
        if (formTokenUri !== currentTokenUri) {
          trackEvent(AnalyticsEvent.SetProfileToken, {
            tokenUri: formTokenUri,
          });
        }
        updates.profileToken = form.profileToken.value?.tokenUri || '';

        const promises: Promise<unknown>[] = [updateUser(updates)];

        if (
          !usernameNotEditableFor &&
          form.username.value !== (currentUser.username || '')
        ) {
          trackEvent(AnalyticsEvent.UpdateUsername, undefined);
          promises.push(
            setUserUsername({
              fid: currentUser.fid,
              username: form.username.value,
            }),
          );
        }

        await Promise.all(promises);

        onClose();
      } catch (error) {
        setProfileError(error as string);
        trackError(error);
      } finally {
        setIsSubmittingProfile(false);
      }
    },
    [
      currentUser.displayName,
      currentUser.fid,
      currentUser.profile.bio.text,
      currentUser.username,
      currentUser.profile.location,
      currentUser.profile.profileToken,
      form.bio.value,
      form.displayName.value,
      form.url.value,
      form.username.value,
      form.location.value,
      form.profileToken.value,
      setUserUsername,
      trackEvent,
      updateUser,
      usernameNotEditableFor,
      onClose,
      newPfpUrl,
      newBannerUrl,
    ],
  );

  const formControlClassName =
    'flex !flex-col rounded-lg px-3 !pb-2 pt-2 bg-swap';
  const formControlLabelClassName = 'text-sm font-normal text-faint';
  const formControlInputClassName = '-ml-1 !border-none !bg-swap';

  const handleAvaterInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files && e.target.files[0];

      if (!file) {
        return;
      }

      try {
        setIsSubmittingPfp(true);
        const uploadResult = await uploadCloudflareImage({
          file,
        });
        if (uploadResult?.imageUrl) {
          setNewPfpUrl(uploadResult.imageUrl);
        }
      } catch (error) {
        toast({
          type: 'error',
          message: 'Could not update photo',
        });
        trackError(error);
      } finally {
        setIsSubmittingPfp(false);
      }
    },
    [uploadCloudflareImage],
  );

  const handleBannerInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files && e.target.files[0];
      if (!file) {
        return;
      }

      try {
        setIsSubmittingBanner(true);
        const uploadResult = await uploadCloudflareImage({
          file,
        });
        if (uploadResult?.imageUrl) {
          setNewBannerUrl(uploadResult.imageUrl);
        }
      } catch (error) {
        toast({
          type: 'error',
          message: 'Could not update banner',
        });
        trackError(error);
      } finally {
        setIsSubmittingBanner(false);
      }
    },
    [uploadCloudflareImage],
  );

  const userToDisplay = useMemo(() => {
    const user = { ...currentUser };
    if (newPfpUrl) {
      user.pfp = {
        ...user.pfp,
        url: newPfpUrl,
        verified: user.pfp?.verified || false,
      };
    }
    return user;
  }, [currentUser, newPfpUrl]);

  const onBannerPencilClick = useCallback(() => {
    if (!userIsPro) {
      setShowFarcasterProUnlockFeaturesModal(true);
      return;
    }
    const input = document.getElementById(bannerFileInputId);
    if (input) {
      input.click();
    }
  }, [userIsPro]);

  return (
    <div
      className={classNames(
        'flex h-full w-full flex-col justify-between overflow-hidden',
      )}
    >
      <div className="scrollbar-vert h-full overflow-y-auto">
        <div className="relative">
          <div
            className={classNames(
              'relative h-[140px] overflow-hidden bg-light-purple',
            )}
          >
            {bannerImageSrc && (
              <Image
                key={currentUser.fid}
                alt={currentUser.displayName}
                src={bannerImageSrc}
                className="aspect-[3/1] size-full object-cover object-center"
              />
            )}
            {isSubmittingBanner && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <LoadingIndicator />
              </div>
            )}
            {!isSubmittingBanner && (
              <div
                className="absolute bottom-2 right-2 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                onClick={onBannerPencilClick}
                title="Upload banner image"
              >
                <PencilIcon size={16} />
              </div>
            )}
          </div>
          <div className="px-3">
            <div className="relative mt-[-32px] size-24">
              <span className="relative inline-block rounded-full border-[3px] border-app">
                <AvatarImage
                  imgUrl={userToDisplay.pfp?.url}
                  imgAlt={`${userToDisplay.displayName} avatar`}
                  size="xl"
                />
                {!isSubmittingPfp && (
                  <div
                    className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:opacity-100"
                    onClick={(e) => {
                      e.preventDefault();
                      trackEvent(AnalyticsEvent.UpdatePfp, undefined);
                      const input = document.getElementById(pfpFileInputId);
                      if (input) {
                        input.click();
                      }
                    }}
                    title="Upload photo"
                  >
                    <CameraIcon size={24} />
                  </div>
                )}
                {isSubmittingPfp && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                    <LoadingIndicator />
                  </div>
                )}
              </span>
            </div>
          </div>
        </div>
        <FileInput
          id={pfpFileInputId}
          className="hidden"
          onChange={handleAvaterInputChange}
        />
        <FileInput
          id={bannerFileInputId}
          className="hidden"
          onChange={handleBannerInputChange}
        />
        <div className="p-3">
          <Form onSubmit={onSave} className="mb-4 space-y-3">
            <FormControl
              className={formControlClassName}
              label={
                <div className={formControlLabelClassName}>Display Name</div>
              }
              input={
                <TextInput
                  {...form.displayName}
                  maxLength={32}
                  className={formControlInputClassName}
                  withCharCounter
                  onChange={(e) => {
                    updateFormField({
                      name: 'displayName',
                      value: e.target.value,
                    });
                  }}
                />
              }
              instructions={undefined}
            />
            <FormControl
              className={formControlClassName}
              label={
                <div
                  className={classNames(
                    formControlLabelClassName,
                    'flex flex-row items-center gap-1',
                  )}
                >
                  Username
                  <ExternalLink
                    className={'mb-1.5 text-xs text-muted'}
                    title="More info on usernames"
                    href={getNotionLinkTarget({ to: 'usernames' })}
                  >
                    <InfoIcon size={8} />
                  </ExternalLink>
                </div>
              }
              input={
                <SelectInput
                  choices={usernameOptions}
                  {...form.username}
                  className="!border-none !bg-swap"
                  onChange={(e) => {
                    if (e.target.value === USERNAME_ADD_ENS_OPTION_VALUE) {
                      setShowAddEnsModal(true);
                    } else {
                      updateFormField({
                        name: 'username',
                        value: e.target.value,
                      });
                    }
                  }}
                />
              }
              instructions={undefined}
              error={
                usernameNotEditableFor ? (
                  <div className="mt-1 flex items-center gap-1 p-1 text-sm border-faint">
                    <AlertIcon size={14} />
                    <span>
                      Username cannot be changed for{' '}
                      {formatDuration(usernameNotEditableFor, true)}
                    </span>
                  </div>
                ) : null
              }
            />
            <FormControl
              className={formControlClassName}
              label={<div className={formControlLabelClassName}>Bio</div>}
              input={
                <Textarea
                  {...form.bio}
                  className={formControlInputClassName}
                  rows={defaultTextareaRows}
                  maxLength={160}
                  withCharCounter
                  hideResizeHandle
                  onChange={(e) => {
                    updateFormField({ name: 'bio', value: e.target.value });
                  }}
                />
              }
              instructions={undefined}
            />
            <FormControl
              className={formControlClassName}
              label={<div className={formControlLabelClassName}>Website</div>}
              input={
                <TextInput
                  {...form.url}
                  className={formControlInputClassName}
                  onChange={(e) => {
                    updateFormField({ name: 'url', value: e.target.value });
                  }}
                />
              }
              instructions={undefined}
            />
            <FormControl
              className={formControlClassName}
              label={<div className={formControlLabelClassName}>Location</div>}
              input={
                <LocationSearchInput
                  value={form.location.value}
                  onLocationChange={(location) => {
                    updateFormField({
                      name: 'location',
                      value: location,
                    });
                  }}
                  className={formControlInputClassName}
                  autoFocus={initialFocus === 'location'}
                />
              }
              instructions={undefined}
            />
            <FormControl
              className={formControlClassName}
              label={
                <div className={formControlLabelClassName}>Profile Token</div>
              }
              input={
                <TokenSearchInput
                  value={form.profileToken.value}
                  onTokenChange={(token) => {
                    updateFormField({
                      name: 'profileToken',
                      value: token,
                    });
                  }}
                  className={formControlInputClassName}
                  autoFocus={initialFocus === 'token'}
                />
              }
              instructions={undefined}
            />
            {profileError && (
              <div className="mt-4 text-sm font-semibold text-danger">
                {profileError}
              </div>
            )}
          </Form>
        </div>
      </div>
      <div className="rounded-b-md border-t p-[16px] border-default">
        <DefaultModalActionButtons
          isLoading={isSubmittingProfile}
          isPrimaryButtonDisabled={!hasUpdatesToSave}
          onSecondaryButtonClick={onClose}
          onPrimaryButtonClick={onSave}
          secondaryButtonLabel="Cancel"
          primaryButtonLabel="Save changes"
        />
      </div>
      {showAddEnsModal && (
        <AddEnsNameModal
          fid={currentUser.fid}
          usernameNotEditableFor={usernameNotEditableFor}
          usernameUpdateLimitMillis={usernamesData?.usernameUpdateLimitMillis}
          onCancel={() => {
            setShowAddEnsModal(false);
          }}
          onCloseWithUpdates={() => {
            setShowAddEnsModal(false);
            refetchUsernames();
          }}
        />
      )}
      {showFarcasterProUnlockFeaturesModal && (
        <FarcasterProUnlockFeaturesModal
          emphasis="banner"
          onClose={() => setShowFarcasterProUnlockFeaturesModal(false)}
        />
      )}
    </div>
  );
};
EditProfileModalContent.displayName = 'EditProfileModalContent';

export { EditProfileModal };
