import { Octicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import {
  ImageUploadError,
  useChannel,
  useUpdateChannel,
} from 'farcaster-client-hooks';
import { useRootToast } from 'farcaster-expo';
import React, { useCallback, useRef, useState } from 'react';
import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { Badge } from '~/components/Badge';
import { ButtonV2 } from '~/components/ButtonV2';
import { buildScreen } from '~/components/Screen';
import { Text2 } from '~/components/Text';
import { TextInputWithCounter } from '~/components/TextInput/TextInputWithCounter';
import { useTheme } from '~/contexts/ThemeProvider';
import { useUploadCloudflareImage } from '~/hooks/data/useUploadCloudflareImage';
import { usePop } from '~/hooks/navigation/usePop';
import { CommonStackParamList } from '~/types';
import { trackError } from '~/utils/ErrorUtils';

type ChannelManageDetailsScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'ChannelManageDetails'
>;

const ChannelManageDetailsScreen = buildScreen<ChannelManageDetailsScreenProps>(
  { name: 'ChannelManageDetails' },
  ({
    route: {
      params: { channelKey },
    },
  }) => {
    const t = useTheme();
    const pop = usePop();
    const toast = useRootToast();

    const uploadImageToCloudflare = useUploadCloudflareImage();
    const updateChannel = useUpdateChannel();
    const { data: channel } = useChannel({ key: channelKey });

    const uploadingPromise = useRef<Promise<string | void> | null>(null);

    const [name, setName] = useState(channel?.name ?? '');
    const [description, setDescription] = useState(channel?.description ?? '');
    const [ctaTitle, setCTATitle] = useState(
      channel?.headerAction?.title ?? '',
    );
    const [ctaTarget, setCTATarget] = useState(
      channel?.headerAction?.target ?? '',
    );

    const [imageUrl, setImageUrl] = useState(channel?.imageUrl);
    const [, setImageUploadError] = useState<string>();

    const disabled = Boolean(
      (!ctaTarget && ctaTitle) || (ctaTarget && !ctaTitle),
    );

    const pickImage = React.useCallback(async () => {
      try {
        // No permissions request is necessary for launching the image library
        const pickImageResult = await ImagePicker.launchImageLibraryAsync({
          allowsMultipleSelection: false,
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
        });

        if (pickImageResult.canceled) {
          return;
        }

        const { assets } = pickImageResult;
        const asset = assets ? assets[0] : undefined;

        if (!asset) {
          return;
        }

        uploadingPromise.current = (async () => {
          try {
            setImageUrl(asset.uri);

            const result = await uploadImageToCloudflare({
              uri: asset.uri,
              name: 'channel-pfp',
            });

            if (typeof result === 'undefined') {
              setImageUrl(channel?.imageUrl);
              setImageUploadError('Failed to upload image');
            }

            return result?.imageUrl;
          } catch (error) {
            uploadingPromise.current = null;
            setImageUploadError('Failed to upload image');
          }
        })();
      } catch (error: unknown | ImagePicker.ImagePickerErrorResult) {
        // Track image picker errors individually by their code
        // so we can see how many times each one occurs.
        if ('code' in (error as ImagePicker.ImagePickerErrorResult)) {
          const imagePickerError = error as ImagePicker.ImagePickerErrorResult;
          trackError(new ImageUploadError({ error }), {
            fingerprint: ['{{ default }}', imagePickerError.code],
          });
        } else {
          trackError(new ImageUploadError({ error }));
        }

        setImageUploadError('Failed to upload image');
      }
    }, [uploadImageToCloudflare, channel?.imageUrl]);

    const submit = useCallback(async () => {
      try {
        if (!channel) {
          return;
        }

        const params: Partial<Parameters<typeof updateChannel>[0]> = {};

        if (uploadingPromise.current) {
          const uploadedUrl = await uploadingPromise.current;
          if (uploadedUrl) {
            params.imageUrl = uploadedUrl;
          }
        }

        if (name !== channel.name) {
          params.name = name.trim().replace('\n', ' ');
        }

        if (description !== channel.description) {
          params.description = description.trim().replace('\n', ' ');
        }

        if (
          (typeof channel.headerAction === 'undefined' &&
            ctaTitle !== '' &&
            ctaTarget !== '') ||
          (typeof channel.headerAction !== 'undefined' &&
            (ctaTitle !== channel.headerAction.title ||
              ctaTarget !== channel.headerAction.target))
        ) {
          params.headerAction = {
            title: ctaTitle,
            target: ctaTarget,
          };
        }

        if (description !== channel.description) {
          params.description = description.trim().replace('\n', ' ');
        }

        if (Object.keys(params).length > 0) {
          await updateChannel({
            key: channel.key,
            ...params,
          });
          toast.show('Channel updated');
        }

        pop();
      } catch (e) {
        trackError(new Error('Failed to update channel', { cause: e }));
        toast.show('Failed to updated channel', {
          placement: 'top',
          type: 'danger',
        });
      }
    }, [
      channel,
      ctaTarget,
      ctaTitle,
      description,
      name,
      pop,
      toast,
      updateChannel,
    ]);

    return (
      <KeyboardAwareScrollView
        style={[t.flexGrow]}
        contentContainerStyle={[
          t.p4,
          t.flexGrow,
          t.justifyBetween,
          { gap: 12 },
        ]}
        keyboardDismissMode="on-drag"
      >
        <View style={[t.flex, t.flexCol, { gap: 12 }]}>
          <View style={[t.flex, t.flexCol, t.itemsCenter, { gap: 12 }]}>
            <Image
              source={{ uri: imageUrl }}
              style={[{ height: 108, width: 108 }, t.roundedFull, t.pB4]}
            />
            <ButtonV2
              title="Change image"
              variant="tertiary"
              height="sm"
              Icon={({ color }) => (
                <Octicons name="image" size={18} color={color} />
              )}
              onPress={pickImage}
            />
          </View>
          <View style={[t.mT6]}>
            <Text2 color="secondary" size="sm" style={[t.mB2]}>
              Channel name
            </Text2>
            <TextInputWithCounter
              autoCorrect={false}
              autoFocus={false}
              clearButtonMode="never"
              maxLength={32}
              placeholder="Enter channel display name"
              value={name}
              onChangeText={setName}
            />
          </View>
          <View>
            <Text2 color="secondary" size="sm" style={[t.mB2]}>
              Description
            </Text2>
            <TextInputWithCounter
              autoCorrect={false}
              autoFocus={false}
              clearButtonMode="never"
              multiline={true}
              numberOfLines={4}
              maxLength={256}
              onChangeText={setDescription}
              placeholder="Share what your community is about …"
              value={description}
            />
          </View>
          <View>
            <View style={[t.mB3]}>
              <View style={[t.flex, t.flexRow, t.itemsCenter]}>
                <Text2 weight="medium" style={[t.mR2]}>
                  External Link
                </Text2>
                <Badge color="secondary" label="Optional" size="xs" />
              </View>
              <Text2 color="secondary" size="sm" style={[t.mT1]}>
                Link to a frame or a website from your channel page.
              </Text2>
            </View>
            <Text2 color="secondary" size="sm">
              Title
            </Text2>
            <TextInputWithCounter
              autoCorrect={false}
              autoFocus={false}
              clearButtonMode="never"
              multiline={true}
              numberOfLines={1}
              maxLength={16}
              onChangeText={setCTATitle}
              placeholder=""
              value={ctaTitle}
            />
            <View>
              <Text2 color="secondary" size="sm" style={[t.mB2]}>
                Target
              </Text2>
              <TextInputWithCounter
                autoCorrect={false}
                autoFocus={false}
                clearButtonMode="never"
                multiline={true}
                numberOfLines={1}
                maxLength={256}
                onChangeText={setCTATarget}
                placeholder=""
                value={ctaTarget}
              />
            </View>
          </View>
        </View>
        <View style={[t.justifyEnd]}>
          <ButtonV2
            onPress={submit}
            title="Save changes"
            variant="primary"
            disabled={disabled}
          />
        </View>
      </KeyboardAwareScrollView>
    );
  },
);

ChannelManageDetailsScreen.displayName = 'ChannelManageDetailsScreen';

export { ChannelManageDetailsScreen };
