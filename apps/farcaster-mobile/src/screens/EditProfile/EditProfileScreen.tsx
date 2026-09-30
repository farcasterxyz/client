import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiProfileToken,
  ApiProfileTokenData,
  toHttpsUrl,
} from 'farcaster-client-data';
import {
  formatAddress,
  useGloballyCachedUser,
  useUpdateUser,
  useUserByFid,
} from 'farcaster-client-hooks';
import {
  Avatar,
  hitSlop,
  LoadingIndicator,
  TokenIcon,
  useHaptics,
  useUserLevel,
} from 'farcaster-expo';
import { ArrowUpRightIcon, CameraIcon } from 'lucide-react-native';
import React from 'react';
import {
  InteractionManager,
  Platform,
  Pressable,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import {
  KeyboardAwareScrollView,
  KeyboardAwareScrollViewRef,
} from 'react-native-keyboard-controller';
import { useToast } from 'react-native-toast-notifications';

import { FarcasterProUnlockFeaturesSheet } from '~/components/FarcasterPro/FarcasterProUnlockFeaturesSheet';
import { HeaderImage, ImageUploaderInterface } from '~/components/HeaderImage';
import { buildScreen } from '~/components/Screen';
import { Text2 } from '~/components/Text';
import { TextInput, TextInputProps } from '~/components/TextInput/TextInput';
import { IconPressable } from '~/components/UserProfileWithBanner/IconPressable';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import {
  prefetchAllVariants,
  useOptimisticUploadCloudflareImage,
} from '~/hooks/data/useOptimisticUploadCloudflareImage';
import { usePop } from '~/hooks/navigation/usePop';
import { usePush } from '~/hooks/navigation/usePush';
import { useKeyboardVisibility } from '~/hooks/useKeyboardVisibility';
import { CommonStackParamList } from '~/types';
import { trackError } from '~/utils/ErrorUtils';
import { compressImage } from '~/utils/ImageUtils';

import {
  EditProfileStateProvider,
  useEditProfileState,
} from './ProfileStateProvider';

type EditProfileScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'EditProfile'
>;

const Profile = {
  PressableInput: ({
    value,
    placeholder,
    label,
    onPress,
  }: {
    value?: string;
    placeholder: string;
    label: string;
    onPress: () => void;
  }) => {
    const t = useTheme();

    const wrapperStyle = React.useMemo(() => {
      return [
        t.flexCol,
        t.border,
        t.borderDefault,
        { borderRadius: 12 },
        t.pY2,
        t.pX3,
      ] satisfies ViewStyle[];
    }, [t.border, t.borderDefault, t.flexCol, t.pX3, t.pY2]);

    const valueToDisplay = React.useMemo(() => {
      if (typeof value === 'undefined' || value.trim() === '') {
        return placeholder;
      }

      return value;
    }, [placeholder, value]);

    return (
      <Pressable style={wrapperStyle} onPress={onPress}>
        <Text2 size="sm" color="secondary">
          {label}
        </Text2>
        <Text2
          color={
            typeof value === 'undefined' || value.trim() === ''
              ? 'tertiary'
              : 'primary'
          }
        >
          {valueToDisplay}
        </Text2>
        <ArrowUpRightIcon
          size={12}
          style={[
            t.absolute,
            t.bottom0,
            t.right0,
            t.mR1,
            t.mB1,
            t.texts.secondary,
          ]}
        />
      </Pressable>
    );
  },
  ProfileTokenInput: ({
    label,
    placeholder,
    tokenUri,
    tokenData,
    onPress,
  }: {
    label: string;
    placeholder: string;
    tokenUri?: string;
    tokenData?: ApiProfileTokenData;
    onPress: () => void;
  }) => {
    const t = useTheme();
    const wrapperStyle = React.useMemo(() => {
      return [
        t.flexCol,
        t.border,
        t.borderDefault,
        { borderRadius: 12 },
        t.pY2,
        t.pX3,
      ] satisfies ViewStyle[];
    }, [t.border, t.borderDefault, t.flexCol, t.pX3, t.pY2]);

    const displayText = tokenData?.ticker
      ? `$${tokenData.ticker}`
      : tokenData?.ca
        ? formatAddress(tokenData?.ca)
        : 'Unknown Token';

    return (
      <Pressable style={wrapperStyle} onPress={onPress}>
        <Text2 size="sm" color="secondary">
          {label}
        </Text2>
        {tokenUri && tokenData ? (
          <View style={[t.flexRow, t.itemsCenter, t.flex1, { gap: 4 }]}>
            <TokenIcon
              key={`${tokenData.chain}-${tokenData.ca}`}
              iconUrl={tokenData.imageUrl}
              diameter={16}
              symbol={tokenData.ticker}
            />
            <Text2
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{ flex: 1, paddingRight: 20 }}
            >
              {displayText}
            </Text2>
          </View>
        ) : (
          <Text2 color="tertiary">{placeholder}</Text2>
        )}
        <ArrowUpRightIcon
          size={12}
          style={[
            t.absolute,
            t.bottom0,
            t.right0,
            t.mR1,
            t.mB1,
            t.texts.secondary,
          ]}
        />
      </Pressable>
    );
  },
  Input: ({
    autoCorrect,
    autoCapitalize,
    autoFocus,
    spellCheck,
    maxLength,
    label,
    placeholder,
    defaultValue,
    onChangeText,
    keyboardType,
    onFocus,
  }: React.PropsWithChildren<{ label: string }> &
    Pick<
      TextInputProps,
      | 'autoCorrect'
      | 'autoCapitalize'
      | 'autoFocus'
      | 'spellCheck'
      | 'maxLength'
      | 'placeholder'
      | 'defaultValue'
      | 'onChangeText'
      | 'keyboardType'
      | 'onFocus'
    >) => {
    const t = useTheme();

    const wrapperStyle = React.useMemo(() => {
      return [
        t.border,
        t.borderDefault,
        { borderRadius: 12 },
        t.pY2,
        t.pX3,
      ] satisfies ViewStyle[];
    }, [t.border, t.borderDefault, t.pX3, t.pY2]);

    const inputStyle = React.useMemo(() => {
      return [] satisfies TextStyle[];
    }, []);

    const onChangeTextWrapped = React.useCallback(
      (text: string) => {
        onChangeText?.(text);
      },
      [onChangeText],
    );

    return (
      <View style={wrapperStyle}>
        <Text2 size="sm" color="secondary">
          {label}
        </Text2>
        <TextInput
          variant="no-style"
          autoCorrect={autoCorrect}
          autoCapitalize={autoCapitalize}
          autoFocus={autoFocus}
          keyboardType={keyboardType}
          spellCheck={spellCheck}
          clearButtonMode="never"
          maxLength={maxLength}
          placeholder={placeholder}
          placeholderTextColor={t.colors.text.tertiary}
          inputStyle={inputStyle}
          defaultValue={defaultValue}
          // For onboarding inputs we are moving away from the controlled inputs
          value={undefined}
          onChangeText={onChangeTextWrapped}
          onFocus={onFocus}
        />
      </View>
    );
  },

  TextArea: ({
    autoCorrect,
    autoCapitalize,
    autoFocus,
    spellCheck,
    maxLength,
    label,
    placeholder,
    defaultValue,
    onChangeText,
    keyboardType,
    onFocus,
  }: React.PropsWithChildren<{ label: string }> &
    Pick<
      TextInputProps,
      | 'autoCorrect'
      | 'autoCapitalize'
      | 'autoFocus'
      | 'spellCheck'
      | 'maxLength'
      | 'placeholder'
      | 'defaultValue'
      | 'onChangeText'
      | 'keyboardType'
      | 'onFocus'
    >) => {
    const t = useTheme();

    const [hasValue, setHasValue] = React.useState(!!defaultValue);

    const wrapperStyle = React.useMemo(() => {
      return [
        t.border,
        t.borderDefault,
        { borderRadius: 12 },
        t.pY2,
        t.pX3,
        !hasValue && t.bgLightGray,
      ] satisfies ViewStyle[];
    }, [hasValue, t.bgLightGray, t.border, t.borderDefault, t.pX3, t.pY2]);

    const inputStyle = React.useMemo(() => {
      return [{ height: 148, textAlignVertical: 'top' }] satisfies TextStyle[];
    }, []);

    const onChangeTextWrapped = React.useCallback(
      (text: string) => {
        setHasValue(!!text);
        onChangeText?.(text);
      },
      [onChangeText],
    );

    return (
      <View style={wrapperStyle}>
        <Text2 size="sm" color="secondary">
          {label}
        </Text2>
        <TextInput
          variant="no-style"
          autoCorrect={autoCorrect}
          autoCapitalize={autoCapitalize}
          autoFocus={autoFocus}
          keyboardType={keyboardType}
          spellCheck={spellCheck}
          clearButtonMode="never"
          maxLength={maxLength}
          placeholder={placeholder}
          placeholderTextColor={t.colors.text.tertiary}
          inputStyle={inputStyle}
          defaultValue={defaultValue}
          // For onboarding inputs we are moving away from the controlled inputs
          value={undefined}
          onChangeText={onChangeTextWrapped}
          multiline={true}
          numberOfLines={8}
          onFocus={onFocus}
        />
      </View>
    );
  },
};

const EditProfileScreen = buildScreen<EditProfileScreenProps>(
  { name: 'EditProfile', insetTop: Platform.OS === 'android' },
  () => {
    const { fid } = useCurrentUser_UNSAFE();

    const {
      data: {
        result: { user: fallbackUser },
      },
    } = useUserByFid({ fid });

    const user = useGloballyCachedUser({ fallback: fallbackUser });

    const userIsPro = useUserLevel(user) === 'pro';

    return (
      <EditProfileStateProvider user={user}>
        <EditProfileContent userIsPro={userIsPro} />
      </EditProfileStateProvider>
    );
  },
);

EditProfileScreen.displayName = 'EditProfileScreen';

function EditProfileContent({ userIsPro }: { userIsPro: boolean }) {
  const t = useTheme();

  const pop = usePop();
  const push = usePush();
  const toast = useToast();

  const { trackEvent } = useAnalytics();
  const { triggerImpactAsync } = useHaptics();

  const [updatingPfp, setUpdatingPfp] = React.useState<boolean>(false);
  const [saving, setSaving] = React.useState<boolean>(false);
  const [showUnlockSheet, setShowUnlockSheet] = React.useState(false);

  const [state, dispatch] = useEditProfileState();

  const updateUser = useUpdateUser();

  const onImageChange = React.useCallback(
    async ({ imageUrl }: { imageUrl: string }) => {
      trackEvent(AnalyticsEvent.EditProfileItem, {
        item: 'banner image',
      });

      dispatch({ type: 'SetBannerImageUrl', bannerImageUrl: imageUrl });
    },
    [dispatch, trackEvent],
  );

  const uploadImageToCloudflare = useOptimisticUploadCloudflareImage();

  const openPicker = React.useCallback(async () => {
    let response: ImagePicker.ImagePickerResult | undefined;
    try {
      response = await ImagePicker.launchImageLibraryAsync({
        exif: false,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

  const onUserPfpEditPress = React.useCallback(async () => {
    if (updatingPfp) {
      return;
    }

    const items = await openPicker();
    const image = items?.[0];
    if (!image) {
      return;
    }

    setUpdatingPfp(true);

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
      setUpdatingPfp(false);
      throw 'Failed to upload banner image';
    }

    await result.uploadPromise.then(async (r) => {
      const response: { success: boolean; result: { variants: string[] } } =
        await r.json();

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

    trackEvent(AnalyticsEvent.EditProfileItem, { item: 'pfp image' });

    dispatch({ type: 'SetPfp', pfp: result.imageUrl });

    setUpdatingPfp(false);
  }, [dispatch, openPicker, trackEvent, updatingPfp, uploadImageToCloudflare]);

  const onCancelPress = React.useCallback(() => {
    if (saving) {
      return;
    }

    triggerImpactAsync();

    pop();
  }, [pop, saving, triggerImpactAsync]);

  const onSavePress = React.useCallback(async () => {
    if (saving) {
      return;
    }

    setSaving(true);

    let normalizedUrl = state.url?.trim();
    if (normalizedUrl) {
      if (normalizedUrl.includes('://')) {
        try {
          const url = new URL(normalizedUrl);
          if (url.protocol === 'http:' || url.protocol === 'https:') {
            normalizedUrl = toHttpsUrl(normalizedUrl);
          } else {
            normalizedUrl = '';
          }
        } catch {
          normalizedUrl = '';
        }
      } else {
        try {
          new URL(`https://${normalizedUrl}`);
          normalizedUrl = `https://${normalizedUrl}`;
        } catch {
          normalizedUrl = '';
        }
      }
    } else {
      normalizedUrl = '';
    }

    await updateUser({
      bio: state.bio,
      displayName: state.displayName,
      pfp: state.pfp,
      bannerImageUrl: state.bannerImageUrl,
      url: normalizedUrl,
      location: state.location,
      profileToken: state.profileToken?.tokenUri,
    });

    setSaving(false);

    pop();
  }, [
    pop,
    saving,
    state.bannerImageUrl,
    state.bio,
    state.displayName,
    state.location,
    state.pfp,
    state.profileToken,
    state.url,
    updateUser,
  ]);

  const onDisplayNameChange = React.useCallback(
    (text: string) => {
      trackEvent(AnalyticsEvent.EditProfileItem, {
        item: 'display name',
      });

      dispatch({ type: 'SetDisplayName', displayName: text });
    },
    [dispatch, trackEvent],
  );

  const onBioChange = React.useCallback(
    (text: string) => {
      trackEvent(AnalyticsEvent.EditProfileItem, { item: 'bio' });

      dispatch({ type: 'SetBio', bio: text });
    },
    [dispatch, trackEvent],
  );

  const onWebsiteChange = React.useCallback(
    (text: string) => {
      trackEvent(AnalyticsEvent.EditProfileItem, { item: 'url' });

      dispatch({ type: 'SetUrl', url: text.trim() });
    },
    [dispatch, trackEvent],
  );

  const onLocationChangePress = React.useCallback(() => {
    trackEvent(AnalyticsEvent.EditProfileItem, { item: 'location' });

    push('EditLocation', {});
  }, [push, trackEvent]);

  const onUsernameChangePress = React.useCallback(() => {
    trackEvent(AnalyticsEvent.EditProfileItem, { item: 'username' });

    push('EditUsername', {});
  }, [push, trackEvent]);

  const onProfileTokenPress = React.useCallback(() => {
    trackEvent(AnalyticsEvent.EditProfileItem, { item: 'profile token' });

    const onTokenSelected = (profileToken: ApiProfileToken) => {
      dispatch({ type: 'SetProfileToken', profileToken });
    };

    push('EditProfileToken', { onTokenSelected });
  }, [push, trackEvent, dispatch]);

  React.useEffect(() => {
    trackEvent(AnalyticsEvent.ViewEditProfile, {});
  });

  const headerImageUploaderRef = React.useRef<ImageUploaderInterface>(null);

  const onHeaderImageUploadPress = React.useCallback(() => {
    if (!userIsPro) {
      setShowUnlockSheet(true);
      return;
    }

    if (
      userIsPro &&
      typeof headerImageUploaderRef.current !== 'undefined' &&
      headerImageUploaderRef.current !== null
    ) {
      headerImageUploaderRef.current.startHeaderImageUpload();
    }
  }, [userIsPro]);

  const { isVisible: isKeyboardVisible, keyboardHeight } =
    useKeyboardVisibility();

  const scrollRef = React.useRef<KeyboardAwareScrollViewRef>(null);

  const scrollIntoView = React.useCallback(() => {
    if (!isKeyboardVisible || keyboardHeight === 0) {
      return;
    }

    InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ y: 120, animated: true });
      });
    });
  }, [isKeyboardVisible, keyboardHeight]);

  return (
    <>
      <KeyboardAwareScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        style={{ flex: 1 }}
        contentContainerStyle={[
          { paddingBottom: isKeyboardVisible ? keyboardHeight : 0 },
        ]}
      >
        <View
          style={[
            t.flex,
            t.flexRow,
            t.itemsCenter,
            t.justifyBetween,
            t.wFull,
            t.h12,
            t.pX3,
          ]}
        >
          <TouchableOpacity
            style={[t.flex, t.flexRow, t.itemsCenter, t.justifyStart, t.w16]}
            onPress={onCancelPress}
            hitSlop={hitSlop}
            activeOpacity={0.8}
          >
            <Text2 color="brand" weight="regular" size="base">
              Cancel
            </Text2>
          </TouchableOpacity>
          <Text2 color="primary" weight="semibold" size="lg">
            Edit profile
          </Text2>
          <TouchableOpacity
            style={[t.flex, t.flexRow, t.itemsCenter, t.justifyEnd, t.w16]}
            onPress={onSavePress}
            hitSlop={hitSlop}
            activeOpacity={0.8}
          >
            {saving ? (
              <LoadingIndicator />
            ) : (
              <Text2 color="brand" weight="semibold" size="base">
                Save
              </Text2>
            )}
          </TouchableOpacity>
        </View>
        <View style={[t.relative]}>
          <HeaderImage
            currentImageUrl={state.bannerImageUrl}
            viewerCanUpdate={true}
            disabled={!userIsPro}
            onImageChange={onImageChange}
            imageUploaderRef={headerImageUploaderRef}
          />
          <View style={[t.absolute, t.bottom0, t.right0, t.mR2, t.mB2]}>
            <IconPressable
              Icon={({ color, size }) => (
                <CameraIcon size={size} color={color} />
              )}
              onPress={onHeaderImageUploadPress}
            />
          </View>
        </View>
        <View
          style={[
            t.relative,
            t.flexRow,
            t.itemsCenter,
            t.justifyEnd,
            { height: 48 },
          ]}
        >
          <Pressable
            style={[
              t.absolute,
              t.roundedFull,
              t.bgElevated,
              { left: 12, top: -48, zIndex: 1 },
            ]}
            onPress={onUserPfpEditPress}
          >
            <View
              style={[
                { width: 96, height: 96 },
                t.relative,
                t.borderDefault,
                t.bgDefault,
                t.roundedFull,
                t.justifyCenter,
                t.itemsCenter,
              ]}
            >
              <Avatar pfpUrl={state.pfp} diameter={88} blockAnimated={true} />
              <View
                style={[
                  {
                    backgroundColor: 'black',
                    opacity: 0.15,
                  },
                  t.absolute,
                  t.inset0,
                  t.roundedFull,
                  t.itemsCenter,
                  t.justifyCenter,
                ]}
              />
              <View
                style={[
                  t.absolute,
                  t.inset0,
                  t.roundedFull,
                  t.itemsCenter,
                  t.justifyCenter,
                ]}
              >
                {updatingPfp ? (
                  <LoadingIndicator color={t.colors.text.light} />
                ) : (
                  <CameraIcon color={t.colors.text.light} size={24} />
                )}
              </View>
            </View>
          </Pressable>
        </View>
        <View style={[t.pX3, t.mT3, { gap: 12 }]}>
          <Profile.Input
            autoCapitalize="words"
            autoCorrect={false}
            keyboardType={'default'}
            autoFocus={false}
            label={'Name'}
            placeholder="John Gadgetson"
            onChangeText={onDisplayNameChange}
            defaultValue={state.displayName}
            maxLength={32}
          />
          <Profile.TextArea
            autoCapitalize="sentences"
            autoCorrect={false}
            keyboardType={'default'}
            autoFocus={false}
            label="Bio"
            placeholder="Mediocre athlete, tech enthusiast, and part-time trivia nerd."
            onChangeText={onBioChange}
            defaultValue={state.bio}
            maxLength={160}
            onFocus={scrollIntoView}
          />
          <Profile.Input
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType={'default'}
            autoFocus={false}
            label={'Website'}
            placeholder="https://farcaster.xyz"
            onChangeText={onWebsiteChange}
            defaultValue={state.url}
            maxLength={256}
            onFocus={scrollIntoView}
          />
          <Profile.PressableInput
            label={'Username'}
            placeholder="@farcaster"
            value={state.username}
            onPress={onUsernameChangePress}
          />
          <Profile.PressableInput
            label={'Location'}
            placeholder="San Francisco, CA"
            value={state.location?.description}
            onPress={onLocationChangePress}
          />
          <Profile.ProfileTokenInput
            label="Profile Token"
            placeholder="Set a profile token"
            tokenUri={state.profileToken?.tokenUri}
            tokenData={state.profileToken?.token}
            onPress={onProfileTokenPress}
          />
        </View>
      </KeyboardAwareScrollView>
      {showUnlockSheet && (
        <FarcasterProUnlockFeaturesSheet
          emphasis="banner"
          source="edit-profile"
          onDismiss={() => setShowUnlockSheet(false)}
        />
      )}
    </>
  );
}

export { EditProfileScreen };
