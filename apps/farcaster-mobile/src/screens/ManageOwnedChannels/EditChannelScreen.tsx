import { Octicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { ImagePickerErrorResult } from 'expo-image-picker';
import { isHandledFetchError } from 'farcaster-client-data';
import { ImageUploadError, useUpdateChannel } from 'farcaster-client-hooks';
import { convertHexToRGBA } from 'farcaster-expo';
import React, { useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { FullScreenMenu } from '~/components/FullScreenMenu/FullScreenMenu';
import { MenuEntryConfig } from '~/components/FullScreenMenu/MenuEntry';
import { RitualsIcon } from '~/components/images/RitualsIcon';
import { buildScreen } from '~/components/Screen';
import { useTheme } from '~/contexts/ThemeProvider';
import { useUploadCloudflareImage } from '~/hooks/data/useUploadCloudflareImage';
import { usePush } from '~/hooks/navigation/usePush';
import { CommonStackParamList } from '~/types';
import { trackError } from '~/utils/ErrorUtils';
import { requestMediaLibraryPermissions } from '~/utils/ImageUtils';

type EditChannelScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'EditChannel'
>;

const EditChannelScreen = buildScreen<EditChannelScreenProps>(
  { name: 'EditChannel', insetTop: false },
  ({
    route: {
      params: { channelKey },
    },
  }) => {
    const t = useTheme();
    const push = usePush();
    const uploadImageToCloudflare = useUploadCloudflareImage();

    const toast = useToast();

    const updateChannel = useUpdateChannel();

    const [isUpdatingImage, setIsUpdatingImage] = useState(false);

    const changeImagePress = React.useCallback(async () => {
      try {
        await requestMediaLibraryPermissions();

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

        setIsUpdatingImage(true);

        const doAsync = async () => {
          try {
            const result = await uploadImageToCloudflare({
              uri: asset.uri,
              name: 'channel-image',
            });

            if (typeof result === 'undefined') {
              throw 'Failed to upload image';
            }

            await updateChannel({
              key: channelKey,
              imageUrl: result.imageUrl.replace(/original$/, 'rectcrop3'),
            });

            toast.show('Channel image updated', {
              type: 'success',
            });
          } catch (error) {
            if (
              isHandledFetchError(error) &&
              error.responseData.errors.length
            ) {
              const message = error.responseData.errors[0].message;
              return Alert.alert('Error changing channel image', message, [
                {
                  text: 'OK',
                },
              ]);
            } else {
              return Alert.alert(
                'Error changing channel image',
                'Please try again later',
                [
                  {
                    text: 'OK',
                  },
                ],
              );
            }
          } finally {
            setIsUpdatingImage(false);
          }
        };

        void doAsync();
      } catch (error: unknown | ImagePickerErrorResult) {
        // Track image picker errors individually by their code
        // so we can see how many times each one occurs.
        if ('code' in (error as ImagePickerErrorResult)) {
          const imagePickerError = error as ImagePickerErrorResult;
          trackError(new ImageUploadError({ error }), {
            fingerprint: ['{{ default }}', imagePickerError.code],
          });
        } else {
          trackError(new ImageUploadError({ error }));
        }

        Alert.alert(
          'Error changing channel image',
          'There was a problem uploading your image, please try again later',
          [{ text: 'OK' }],
        );
      }
    }, [channelKey, toast, updateChannel, uploadImageToCloudflare]);

    const items: MenuEntryConfig[] = useMemo(
      () => [
        {
          icon: (
            <Octicons name="pencil" size={20} color={t.colors.text.primary} />
          ),
          title: 'Change display name',
          subtitle: 'A friendly title for your followers',
          onPress: () => {
            push('EditChannelName', { channelKey });
          },
        },
        {
          icon: (
            <Octicons name="note" size={20} color={t.colors.text.primary} />
          ),
          title: 'Edit description',
          subtitle: 'Tell people why they should join',
          onPress: () => {
            push('EditChannelDescription', { channelKey });
          },
        },
        {
          icon: (
            <Octicons
              name="issue-draft"
              size={20}
              color={t.colors.text.primary}
            />
          ),
          title: 'Change image',
          subtitle: 'Make your channel recognizable',
          onPress: changeImagePress,
        },
        {
          icon: <RitualsIcon color={t.colors.text.secondary} size={20} />,
          title: 'Rituals',
          subtitle: 'Available on web',
          onPress: () => {},
          disabled: true,
        },
        {
          icon: (
            <Octicons
              name="person-add"
              size={20}
              color={t.colors.text.secondary}
            />
          ),
          title: 'Configure moderation',
          subtitle: 'Available on web',
          onPress: () => {},
          disabled: true,
        },
        {
          icon: (
            <Octicons name="key" size={20} color={t.colors.text.secondary} />
          ),
          title: 'Change owner',
          subtitle: 'Available on web',
          onPress: () => {},
          disabled: true,
        },
      ],
      [changeImagePress, channelKey, push, t],
    );

    return (
      <View style={[t.hFull]}>
        <FullScreenMenu items={items} />
        {isUpdatingImage && (
          <View style={[t.absolute, t.hFull, t.wFull]}>
            <FullScreenLoadingIndicator
              message="Updating image"
              style={[
                {
                  backgroundColor: t.dark
                    ? convertHexToRGBA(t.colors.black, 0.8)
                    : convertHexToRGBA(t.colors.white, 0.9),
                },
              ]}
            />
          </View>
        )}
      </View>
    );
  },
);

EditChannelScreen.displayName = 'EditChannelScreen';

export { EditChannelScreen };
