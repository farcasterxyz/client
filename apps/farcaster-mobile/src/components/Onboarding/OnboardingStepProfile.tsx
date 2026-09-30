import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import { Image } from 'expo-image';
import {
  ImagePickerResult,
  launchImageLibraryAsync,
  MediaTypeOptions,
} from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  usePrefetchOnboardingInterestCategories,
  useUpdateUser,
} from 'farcaster-client-hooks';
import { AnimatedPressable } from 'farcaster-expo';
import { PenIcon } from 'lucide-react-native';
import React from 'react';
import {
  Alert,
  Keyboard,
  Platform,
  TextInput as TextInputRN,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useToast } from 'react-native-toast-notifications';

import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import {
  prefetchAllVariants,
  useOptimisticUploadCloudflareImage,
} from '~/hooks/data/useOptimisticUploadCloudflareImage';
import { useUserAppContextGate } from '~/hooks/useUserAppContextGate';
import { trackError } from '~/utils/ErrorUtils';
import { compressImage } from '~/utils/ImageUtils';
import { sleep } from '~/utils/PromiseUtils';
import { openWarpcastSettings } from '~/utils/UrlUtils';

import { supportedOnboardingInterestCategoriesQueryString } from './constants';
import { Onboarding, trackOnboardingError } from './Onboarding';
import { OnboardingPortal } from './OnboardingPortal';
import { useOnboardingStateForOnboarding } from './StateProvider';
import { useOnboardingSteps } from './StepsProvider';

const defaultAvatars = [
  // Orange
  'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/780ec646-00f5-4679-0eeb-7b9734e48d00/rectcontain2',
  // Blue
  'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/ff2d6f17-94a8-4e28-79c7-105627504d00/rectcontain2',
  // Green
  'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/0089c4cc-b59e-42a7-8c49-52ecc509d700/rectcontain2',
  // Dark Blue
  'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/6793598c-8068-49d9-986b-6f417e4fd300/rectcontain2',
  // Pink
  'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/592ce94e-e846-446e-3e81-060242b18f00/rectcontain2',
  // Teal
  'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/a48fa7e4-d1b9-4659-513b-bc2df9eb7500/rectcontain2',
  // Maroon
  'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/edaa089d-b8c4-4b1d-ee68-2c25b904e300/rectcontain2',
  // Yellow
  'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/3355c5ea-0758-45ef-a113-a13f89be1500/rectcontain2',
  // Pistachio
  'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/15cea028-d06c-4bfb-4657-3c41af873d00/rectcontain2',
];

const getRandomDefaultAvatar = () =>
  defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];

const openPermissionAlert = () => {
  Alert.alert(
    'Permission needed',
    `Farcaster does not have permission to access your photo library.`,
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      { text: 'Open Settings', onPress: openWarpcastSettings },
    ],
  );
};

export function usePhotoLibraryPermission() {
  const [res, requestPermission] = MediaLibrary.usePermissions({
    granularPermissions: ['photo'],
  });
  const requestPhotoAccessIfNeeded = async () => {
    if (res?.granted) {
      return true;
    } else if (!res || res.status === 'undetermined' || res?.canAskAgain) {
      const { canAskAgain, granted, status } = await requestPermission();

      if (!canAskAgain && status === 'undetermined') {
        openPermissionAlert();
      }

      return granted;
    } else {
      openPermissionAlert();
      return false;
    }
  };
  return { requestPhotoAccessIfNeeded };
}

function OnboardingStepProfile() {
  const t = useTheme();

  const { trackEvent } = useAnalytics();
  const toast = useToast();

  const { requestPhotoAccessIfNeeded } = usePhotoLibraryPermission();

  const uploadImageToCloudflare = useOptimisticUploadCloudflareImage();

  const { fullRefresh, onboardingState } = useOnboardingStateForOnboarding();

  const [previewPfp, setPreviewPfp] = React.useState<string | undefined>();
  const [pfp, setPfp] = React.useState<string | undefined>();
  const [avatarUploadPromise, setAvatarUploadPromise] = React.useState<
    Promise<Response> | undefined
  >();

  const [displayName, setDisplayName] = React.useState<string | undefined>(
    () => {
      if (
        onboardingState.user?.displayName &&
        !onboardingState.user.displayName.startsWith('!')
      ) {
        return onboardingState.user.displayName;
      }

      if (typeof onboardingState.twitterProfile !== 'undefined') {
        if (typeof displayName === 'undefined') {
          return onboardingState.twitterProfile.displayName;
        }
      }

      return onboardingState.user?.username;
    },
  );

  const [bio, setBio] = React.useState<string | undefined>(() => {
    if (onboardingState.user?.profile.bio) {
      return onboardingState.user.profile.bio.text;
    }

    if (typeof onboardingState.twitterProfile !== 'undefined') {
      if (typeof bio === 'undefined') {
        return onboardingState.twitterProfile.bio;
      }
    }
  });

  const updateUser = useUpdateUser();

  const [, dispatch] = useOnboardingSteps();

  const onDisplayNameChange = React.useCallback((text: string) => {
    setDisplayName(text);
  }, []);

  const onBioChange = React.useCallback((text: string) => {
    setBio(text);
  }, []);

  const openPicker = React.useCallback(async () => {
    let response: ImagePickerResult | undefined;
    try {
      response = await launchImageLibraryAsync({
        exif: false,
        mediaTypes: MediaTypeOptions.Images,
        quality: Platform.OS === 'android' ? 1 : 0.8,
        aspect: [1, 1],
        legacy: true,
        allowsEditing: true,
      });
    } catch (e) {
      trackError(e);
      toast.show('Failed to pick image', { type: 'danger' });
      return;
    }

    return (response.assets ?? [])
      .slice(0, 1)
      .filter((asset) => {
        if (
          !asset.mimeType?.startsWith('image/') ||
          (!asset.mimeType?.endsWith('jpeg') &&
            !asset.mimeType?.endsWith('jpg') &&
            !asset.mimeType?.endsWith('png'))
        ) {
          // ERR: Unsupported pfp type
          return false;
        }
        return true;
      })
      .map((image) => ({
        mime: 'image/jpeg',
        height: image.height,
        width: image.width,
        path: image.uri,
        size: image.fileSize,
      }));
  }, [toast]);

  const openLibrary = React.useCallback(async () => {
    await sleep(300);

    if (!(await requestPhotoAccessIfNeeded())) {
      return;
    }

    const items = await openPicker();
    const image = items?.[0];
    if (!image) {
      return;
    }

    setPreviewPfp(image.path);

    const compressedImage = await compressImage({
      source: {
        path: image.path,
        height: image.height,
        width: image.width,
      },
    });

    const result = await uploadImageToCloudflare({
      uri: compressedImage.uri,
      name: 'onboarding-user-avatar-v2',
    });

    if (typeof result === 'undefined') {
      throw 'Failed to upload image';
    }

    setAvatarUploadPromise(result.uploadPromise);
    setPfp(result.imageUrl);
  }, [openPicker, requestPhotoAccessIfNeeded, uploadImageToCloudflare]);

  const isContinueButtonDisabled = React.useMemo(() => {
    return typeof pfp === 'undefined' || typeof displayName === 'undefined';
  }, [displayName, pfp]);
  const { checkUserAppContextGate } = useUserAppContextGate();

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const onContinuePress = React.useCallback(async () => {
    if (isContinueButtonDisabled || isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    try {
      trackEvent(AnalyticsEvent.OnboardingCompleteProfile, {});
      if (typeof avatarUploadPromise !== 'undefined') {
        try {
          await avatarUploadPromise.then(async (r) => {
            const response: {
              success: boolean;
              result: { variants: string[] };
            } = await r.json();

            if (
              typeof response === 'undefined' ||
              !response.success ||
              typeof response.result.variants === 'undefined' ||
              response.result.variants.length === 0
            ) {
              throw new Error('Cloudflare failed to upload image');
            }

            void prefetchAllVariants({ variants: response.result.variants });
          });
        } catch (uploadError) {
          trackOnboardingError(uploadError, 'profile_avatar_upload');
          DdRum.addAction(RumActionType.CUSTOM, 'onboarding:error', {
            error: uploadError,
            fid: onboardingState.user?.fid || -1,
            email: onboardingState.email || '<missing-onboarding-email>',
          });
          toast.show(
            'We could not upload your photo. Please try a different image or tap Skip.',
            { type: 'danger' },
          );
          return;
        }
      }

      await updateUser({
        bio,
        displayName,
        pfp,
      });
      const isOnboardingEnabled =
        checkUserAppContextGate('onboarding-trading').value;
      if (isOnboardingEnabled) {
        trackEvent(AnalyticsEvent.OnboardingNoSkipScreens, {
          screen: 'profile',
        });
        dispatch({
          type: 'SetStep',
          step: 'SelectInterests',
          direction: 'forwards',
        });
        return;
      }
      trackEvent(AnalyticsEvent.OnboardingSkippedScreens, {
        screen: 'profile',
      });
      await fullRefresh();
    } catch (error) {
      trackOnboardingError(error, 'profile');
      DdRum.addAction(RumActionType.CUSTOM, 'onboarding:error', {
        error,
        fid: onboardingState.user?.fid || -1,
        email: onboardingState.email || '<missing-onboarding-email>',
      });
      toast.show(
        'We could not save your profile. Please check your connection and try again.',
        { type: 'danger' },
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    avatarUploadPromise,
    bio,
    dispatch,
    displayName,
    isContinueButtonDisabled,
    isSubmitting,
    pfp,
    updateUser,
    checkUserAppContextGate,
    fullRefresh,
    onboardingState.email,
    onboardingState.user?.fid,
    trackEvent,
    toast,
  ]);

  const onSkipPress = React.useCallback(async () => {
    const defaultPfp = getRandomDefaultAvatar();

    trackEvent(AnalyticsEvent.OnboardingSkippedProfile, {});
    void updateUser({
      bio: undefined,
      displayName,
      pfp: defaultPfp,
    });
    const isOnboardingEnabled =
      checkUserAppContextGate('onboarding-trading').value;

    if (isOnboardingEnabled) {
      trackEvent(AnalyticsEvent.OnboardingNoSkipScreens, {
        screen: 'profile',
      });
      dispatch({
        type: 'SetStep',
        step: 'SelectInterests',
        direction: 'forwards',
      });
      return;
    }
    try {
      trackEvent(AnalyticsEvent.OnboardingSkippedScreens, {
        screen: 'profile',
      });
      await fullRefresh();
    } catch (error) {
      trackOnboardingError(error, 'profile_skip');
      DdRum.addAction(RumActionType.CUSTOM, 'onboarding:error', {
        error,
        fid: onboardingState.user?.fid || -1,
        email: onboardingState.email || '<missing-onboarding-email>',
      });
      toast.show(
        'Something went wrong. Please check your connection and try again.',
        { type: 'danger' },
      );
    }
  }, [
    displayName,
    checkUserAppContextGate,
    updateUser,
    dispatch,
    trackEvent,
    fullRefresh,
    onboardingState.user?.fid,
    onboardingState.email,
    toast,
  ]);

  const convertPfp = React.useCallback(
    async ({ uri }: { uri: string }) => {
      const result = await uploadImageToCloudflare({
        uri: uri,
        name: 'onboarding-user-avatar-v2',
      });

      if (typeof result === 'undefined') {
        throw 'Failed to upload image';
      }

      setAvatarUploadPromise(result.uploadPromise);
      setPfp(result.imageUrl);
    },
    [uploadImageToCloudflare],
  );

  React.useEffect(() => {
    if (previewPfp) {
      return;
    }

    if (
      typeof onboardingState.twitterProfile !== 'undefined' &&
      typeof onboardingState.twitterProfile.pfpUrl !== 'undefined' &&
      onboardingState.twitterProfile.pfpUrl?.trim() !== ''
    ) {
      if (typeof pfp === 'undefined') {
        setPreviewPfp(onboardingState.twitterProfile.pfpUrl);
        convertPfp({ uri: onboardingState.twitterProfile.pfpUrl }).catch(() => {
          const randomPfp = getRandomDefaultAvatar();
          setPreviewPfp(randomPfp);
          setPfp(randomPfp);
        });
      }

      return;
    }

    if (typeof pfp === 'undefined') {
      const randomPfp = getRandomDefaultAvatar();
      setPreviewPfp(randomPfp);
      setPfp(randomPfp);
    }
  }, [convertPfp, onboardingState.twitterProfile, pfp, previewPfp]);

  const prefetchOnboardingInterestCategories =
    usePrefetchOnboardingInterestCategories({
      categories: supportedOnboardingInterestCategoriesQueryString,
    });

  React.useEffect(() => {
    void prefetchOnboardingInterestCategories();
  }, [prefetchOnboardingInterestCategories]);

  const bioInputRef = React.useRef<TextInputRN>(null);

  const onDisplayNameSubmitEditing = React.useCallback(() => {
    bioInputRef.current?.focus();
  }, []);

  return (
    <Onboarding.Layout
      hideIcons
      onBackPress={undefined}
      onSkipPress={undefined}
    >
      <TouchableWithoutFeedback style={{ flex: 1 }} onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'android' ? 80 : 60}
          behavior={'position'}
        >
          <Onboarding.Title>Complete your profile</Onboarding.Title>
          <Onboarding.Text>
            Complete your profile to have a better reach
          </Onboarding.Text>
          <View style={[t.flex, t.flexCol, t.gap4, t.mT6]}>
            <View style={[t.wFull, t.flex, t.itemsCenter, t.flexCol]}>
              <View style={[t.relative]}>
                <AnimatedPressable
                  style={[
                    t.h25,
                    t.w25,
                    t.borderDefault,
                    t.borderHairline,
                    t.roundedFull,
                  ]}
                  onPress={openLibrary}
                >
                  <Image
                    source={previewPfp}
                    contentFit="cover"
                    style={[
                      t.h25,
                      t.w25,
                      t.roundedFull,
                      t.borderDefault,
                      t.borderHairline,
                      t.backgrounds.brandLight,
                      { aspectRatio: 1 },
                    ]}
                  />
                </AnimatedPressable>
                <View
                  style={[
                    t.absolute,
                    t.bottom0,
                    t.right0,
                    { margingBottom: 1, marginRight: 1 },
                  ]}
                >
                  <Onboarding.IconButton onPress={openLibrary}>
                    <PenIcon
                      size={16}
                      fill={t.colors.text.brand}
                      stroke={t.colors.text.brand}
                    />
                  </Onboarding.IconButton>
                </View>
              </View>
            </View>
            <Onboarding.Input
              autoCapitalize="words"
              autoCorrect={false}
              keyboardType={'default'}
              autoFocus={false}
              placeholder="John Gadgetson"
              onChangeText={onDisplayNameChange}
              label="Display name"
              defaultValue={displayName}
              maxLength={32}
              color="primary"
              returnKeyType="next"
              onSubmitEditing={onDisplayNameSubmitEditing}
            />
            <Onboarding.TextArea
              autoCapitalize="sentences"
              autoCorrect={false}
              keyboardType={'default'}
              autoFocus={false}
              placeholder="Tech enthusiast, part-time trivia nerd, trader, developer"
              label="Bio (optional)"
              onChangeText={onBioChange}
              defaultValue={bio}
              maxLength={160}
              ref={bioInputRef}
            />
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      <OnboardingPortal.Portal>
        <Onboarding.Button
          onPress={onContinuePress}
          disabled={isContinueButtonDisabled || isSubmitting}
          loading={isSubmitting}
        >
          Continue
        </Onboarding.Button>
        <Onboarding.SecondaryButton
          onPress={onSkipPress}
          disabled={isSubmitting}
        >
          Skip
        </Onboarding.SecondaryButton>
      </OnboardingPortal.Portal>
    </Onboarding.Layout>
  );
}

export { OnboardingStepProfile };
