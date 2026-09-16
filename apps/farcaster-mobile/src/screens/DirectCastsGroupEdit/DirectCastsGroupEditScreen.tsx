import { Octicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import {
  ApiDirectCastConversationInfoV3,
  ApiDirectCastConversationMessageTTLDays,
} from 'farcaster-client-data';
import {
  getSpecificallySizedImageUrl,
  resolveUsername,
  useChangePhotoInPlaintextDirectCastGroup,
  useCreatePlaintextDirectCastGroupInvite,
  useDirectCastConversation,
  useInvalidatePlaintextDirectCastGroupInvite,
  usePlaintextDirectCastGroupInvite,
  useRenamePlaintextDirectCastGroup,
  useUpdateConversationMessageTTL,
  useUpdateDirectCastGroupPreferences,
} from 'farcaster-client-hooks';
import React, { useRef } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import {
  DirectCastsPermissionSelector,
  DirectCastsPermissionSelectorPermission,
} from '~/components/DirectCasts/DirectCastsPermissionSelector';
import { GroupConversationImage } from '~/components/DirectCasts/GroupConversationImage';
import { Empty } from '~/components/Empty';
import { HeaderRightSubmit } from '~/components/HeaderRightSubmit';
import { buildScreen } from '~/components/Screen';
import { SimplerRemoteImage } from '~/components/SimplerRemoteImage';
import { Text, Text2 } from '~/components/Text';
import { defaultAvatarUrl } from '~/constants/Avatar';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { useUploadCloudflareImage } from '~/hooks/data/useUploadCloudflareImage';
import { useCurrentUserLevel } from '~/hooks/data/useUserLevel';
import { useGoBack } from '~/hooks/navigation/useGoBack';
import { usePush } from '~/hooks/navigation/usePush';
import { PlaintextDirectCastsStackParamList } from '~/types';
import { trackError } from '~/utils/ErrorUtils';
import {
  compressImage,
  requestMediaLibraryPermissions,
} from '~/utils/ImageUtils';

type DirectCastsGroupEditScreenProps = NativeStackScreenProps<
  PlaintextDirectCastsStackParamList,
  'DirectCastsGroupEdit'
>;

const DirectCastsGroupEditScreen = buildScreen<DirectCastsGroupEditScreenProps>(
  { name: 'DirectCastsGroupEdit' },
  ({
    route: {
      params: { conversationId },
    },
  }) => {
    return (
      <React.Suspense>
        <DirectCastsGroupEdit conversationId={conversationId} />
      </React.Suspense>
    );
  },
);

DirectCastsGroupEditScreen.displayName = 'DirectCasts';

type DirectCastsGroupEditProps = {
  conversationId: string;
};

const DirectCastsGroupEdit: React.FC<DirectCastsGroupEditProps> = ({
  conversationId,
}) => {
  const t = useTheme();

  const { data: conversation } = useDirectCastConversation({
    conversationId,
  });

  if (typeof conversation === 'undefined') {
    return (
      <View style={[t.hFull]}>
        <Empty message="No group info found." />
      </View>
    );
  }

  return <DirectCastGroupEditContent conversation={conversation} />;
};

const baseTTLPermissionOptions: DirectCastsPermissionSelectorPermission<ApiDirectCastConversationMessageTTLDays>[] =
  [
    { value: 1, title: '1 day' },
    { value: 7, title: '7 days' },
    { value: 30, title: '30 days' },
    { value: 365, title: '1 year' },
  ];

const whoCanInvitePermissionOptions: DirectCastsPermissionSelectorPermission<
  'everyone' | 'admins'
>[] = [
  { value: 'everyone', title: 'Everyone' },
  { value: 'admins', title: 'Admins' },
];

const avatarDiameter = 108;

const DirectCastGroupEditContent: React.FC<{
  conversation: ApiDirectCastConversationInfoV3;
}> = React.memo(({ conversation }) => {
  const t = useTheme();
  const back = useGoBack();
  const { setOptions } = useNavigation();
  const currentUser = useCurrentUser_UNSAFE();
  const toast = useToast();

  const [groupName, setGroupName] = React.useState<string>(
    conversation.name ?? '',
  );
  const [groupDescription, setGroupDescription] = React.useState<string>(
    conversation.description ?? '',
  );

  const [savingUpdates, setSavingUpdates] = React.useState<boolean>(false);
  const [editingPhoto, setEditingPhoto] = React.useState<boolean>(false);
  const [imageURL, setImageURL] = React.useState<string | undefined>(
    conversation.photoUrl,
  );
  const [whoCanInviteValue, setWhoCanInviteValue] = React.useState<
    'everyone' | 'admins'
  >(
    typeof conversation.groupPreferences !== 'undefined' &&
      conversation.groupPreferences.membersCanInvite
      ? 'everyone'
      : 'admins',
  );
  const [newMessageTTL, setNewMessageTTL] =
    React.useState<ApiDirectCastConversationMessageTTLDays>(
      conversation.messageTTLDays,
    );
  const uploadImageToCloudflare = useUploadCloudflareImage();
  const changePhoto = useChangePhotoInPlaintextDirectCastGroup();
  const rename = useRenamePlaintextDirectCastGroup();
  const updateDirectCastGroupPreferences =
    useUpdateDirectCastGroupPreferences();
  const updateConversationMessageTTL = useUpdateConversationMessageTTL();
  const showNeverOptionOnce = useRef(false);
  const [ttlPermissionOptions, setTTLPermissionOptions] = React.useState<
    DirectCastsPermissionSelectorPermission<ApiDirectCastConversationMessageTTLDays>[]
  >(baseTTLPermissionOptions);
  const isProUser = useCurrentUserLevel() === 'pro';

  React.useEffect(() => {
    if (showNeverOptionOnce.current) {
      return;
    }

    if (conversation.isGroup) {
      showNeverOptionOnce.current = true;
      return;
    }
    if (conversation.messageTTLDays === 'Infinity' || isProUser) {
      showNeverOptionOnce.current = true;
      setTTLPermissionOptions([
        ...baseTTLPermissionOptions,
        {
          value: 'Infinity',
          title: 'Never',
        },
      ]);
    }
  }, [
    conversation.isGroup,
    conversation.messageTTLDays,
    setTTLPermissionOptions,
    isProUser,
  ]);

  const onEditPhotoPress = React.useCallback(async () => {
    setEditingPhoto(true);

    await requestMediaLibraryPermissions();

    let pickImageResult: ImagePicker.ImagePickerResult | undefined;
    try {
      pickImageResult = await ImagePicker.launchImageLibraryAsync({
        base64: true,
        allowsMultipleSelection: false,
        selectionLimit: 1,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: undefined,
        allowsEditing: false,
      });
    } catch (e) {
      trackError(e);
      toast.show('Failed to pick image', { type: 'danger' });
      return;
    }

    if (pickImageResult.canceled) {
      setEditingPhoto(false);
      return;
    }

    const { assets } = pickImageResult;
    const asset = assets ? assets[0] : undefined;

    if (!asset) {
      return;
    }

    const compressedImageAsset = await compressImage({
      source: {
        path: asset.uri,
        height: asset.height,
        width: asset.width,
      },
    });

    const result = await uploadImageToCloudflare({
      uri: compressedImageAsset.uri,
      name: 'direct-cast-group-image',
    });

    if (typeof result === 'undefined') {
      throw 'Failed to upload image';
    }

    setImageURL(result.imageUrl.replace(/original$/, 'rectcrop3'));

    setEditingPhoto(false);
  }, [uploadImageToCloudflare, toast]);

  const onResetPhotoPress = React.useCallback(() => {
    setImageURL(undefined);
  }, []);

  const onSavePress = React.useCallback(async () => {
    setSavingUpdates(true);

    try {
      if (
        typeof conversation !== 'undefined' &&
        groupName.trim() !== '' &&
        (conversation.name !== groupName ||
          conversation.description !== groupDescription)
      ) {
        await rename({
          fid: currentUser.fid,
          conversationId: conversation.conversationId,
          name: groupName,
          description: groupDescription,
        });
      }

      const membersCanInvite = whoCanInviteValue === 'everyone';
      if (
        typeof conversation.groupPreferences !== 'undefined' &&
        conversation.groupPreferences.membersCanInvite !== membersCanInvite
      ) {
        await updateDirectCastGroupPreferences({
          conversationId: conversation.conversationId,
          membersCanInvite: membersCanInvite,
          // TODO: Eventually we will allow users to set this on mobile as well.
          // For the time being lets default to the existing group value so changing
          // other settings does not regress.
          periodicallyValidateMemberships:
            conversation.groupPreferences.periodicallyValidateMemberships,
        });
      }

      if (newMessageTTL !== conversation.messageTTLDays) {
        await updateConversationMessageTTL({
          conversationId: conversation.conversationId,
          ttl: newMessageTTL,
          senderContext: {
            fid: currentUser.fid,
            displayName: currentUser.displayName,
            username: currentUser.username,
          },
        });
      }

      if (conversation.isGroup) {
        await changePhoto({
          fid: currentUser.fid,
          conversationId: conversation.conversationId,
          photoUrl: imageURL,
        });
      }
      back();
    } finally {
      setSavingUpdates(false);
    }
  }, [
    back,
    changePhoto,
    conversation,
    currentUser,
    groupDescription,
    groupName,
    imageURL,
    newMessageTTL,
    rename,
    updateConversationMessageTTL,
    updateDirectCastGroupPreferences,
    whoCanInviteValue,
  ]);

  React.useEffect(() => {
    setOptions({
      headerRight: () => (
        <HeaderRightSubmit
          loading={savingUpdates}
          disabled={
            savingUpdates ||
            editingPhoto ||
            (conversation.isGroup && groupName.trim() === '')
          }
          onPress={onSavePress}
          actionTextOverload="Save"
        />
      ),
    });
  }, [
    editingPhoto,
    groupName,
    onSavePress,
    savingUpdates,
    setOptions,
    conversation.isGroup,
  ]);

  const { data: invite, refetch } = usePlaintextDirectCastGroupInvite({
    fid: currentUser.fid,
    conversationId: conversation.conversationId,
  });

  const inviteCode = invite?.inviteCode;
  const inviteURL = React.useMemo(
    () => (inviteCode ? `farcaster.xyz/~/group/${inviteCode}` : ''),
    [inviteCode],
  );

  const push = usePush();

  const invalidatePlaintextDirectCastGroupInvite =
    useInvalidatePlaintextDirectCastGroupInvite();
  const createPlaintextDirectCastGroupInvite =
    useCreatePlaintextDirectCastGroupInvite();
  const onInviteToGroup = React.useCallback(async () => {
    if (inviteURL) {
      push('DirectCastsGroupInviteLink', {
        conversationId: conversation.conversationId,
      });
      return;
    }
    await createPlaintextDirectCastGroupInvite({
      fid: currentUser.fid,
      conversationId: conversation.conversationId,
    });
    invalidatePlaintextDirectCastGroupInvite({
      fid: currentUser.fid,
      conversationId: conversation.conversationId,
    });
    refetch();
    push('DirectCastsGroupInviteLink', {
      conversationId: conversation.conversationId,
    });
  }, [
    conversation.conversationId,
    createPlaintextDirectCastGroupInvite,
    currentUser.fid,
    invalidatePlaintextDirectCastGroupInvite,
    inviteURL,
    push,
    refetch,
  ]);

  const inviteLinkText = inviteURL ? inviteURL : 'Create invite link';

  const headerHeight = useHeaderHeight();

  const { counterParty } = conversation.viewerContext;

  let mainContent;
  if (!conversation.isGroup && counterParty) {
    const pfp = counterParty?.pfp;
    const optimizedImageUrl = pfp
      ? getSpecificallySizedImageUrl({
          staticRaster: pfp.url,
          h: avatarDiameter,
          w: avatarDiameter,
        })
      : defaultAvatarUrl;
    const conversationName = resolveUsername(counterParty);
    mainContent = (
      <View style={[t.flex, t.flexCol, t.itemsCenter, t.justifyCenter]}>
        <SimplerRemoteImage
          uri={optimizedImageUrl}
          height={avatarDiameter}
          width={avatarDiameter}
          style={t.roundedFull}
          recyclingKey={optimizedImageUrl}
        />
        <Text
          style={[
            t.texts.primary,
            t.fontSemibold,
            t.text2xl,
            t.mT3,
            t.mX2,
            t.textCenter,
          ]}
          numberOfLines={1}
        >
          {conversationName}
        </Text>
      </View>
    );
  } else {
    mainContent = (
      <>
        <View style={[t.flex, t.flexCol, t.itemsCenter, t.justifyCenter]}>
          <View style={[t.relative]}>
            <GroupConversationImage
              imageURL={imageURL}
              diameter={avatarDiameter}
            />
            {imageURL !== undefined && !editingPhoto && (
              <View
                style={[
                  t.absolute,
                  t.top0,
                  t.right0,
                  t.roundedFull,
                  t.bgDefault,
                  t.p1,
                ]}
              >
                <TouchableOpacity
                  onPress={onResetPhotoPress}
                  style={[
                    { width: 28, height: 28 },
                    t.bgMuted,
                    t.roundedFull,
                    t.flex,
                    t.itemsCenter,
                    t.justifyCenter,
                  ]}
                >
                  <Octicons
                    name="x"
                    style={[t.texts.primary, { paddingLeft: 1 }]}
                    size={20}
                  />
                </TouchableOpacity>
              </View>
            )}
            {editingPhoto && (
              <View
                style={[
                  t.absolute,
                  t.inset0,
                  t.flex,
                  t.itemsCenter,
                  t.justifyCenter,
                  {
                    shadowColor: '#000',
                    shadowOpacity: 0.3,
                    shadowOffset: { width: 1, height: 1 },
                    shadowRadius: 2,
                  },
                ]}
                pointerEvents="none"
              >
                <ActivityIndicator
                  color={t.colors.text.light}
                  size="large"
                  style={t.pL1}
                />
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={onEditPhotoPress}
            disabled={editingPhoto}
            style={[
              t.mT3,
              t.mB2,
              t.pY3,
              t.pX4,
              t.flex,
              t.flexRow,
              t.justifyCenter,
              t.borderDefault,
              t.borderHairline,
              t.roundedFull,
            ]}
            activeOpacity={0.6}
          >
            <Text style={[t.fontSemibold, t.texts.primary, t.textBase]}>
              {imageURL ? 'Change image' : 'Add image'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={[t.pX4, t.texts.primary, t.textLg, t.fontMedium, t.mY3]}>
          General
        </Text>
        <Text style={[t.pX4, t.texts.secondary, t.fontMedium, t.mY1]}>
          Group name
        </Text>
        <View style={[t.pX3, t.mY1]}>
          <TextInput
            value={groupName}
            onChangeText={setGroupName}
            autoCorrect={false}
            clearButtonMode="never"
            multiline={false}
            maxLength={32}
            placeholder="Add group name"
            style={[
              t.textBase,
              t.texts.primary,
              t.flexGrow,
              t.flexShrink,
              t.borderHairline,
              t.borderDefault,
              t.p3,
              t.roundedLg,
            ]}
          />
        </View>
        <Text style={[t.pX4, t.texts.secondary, t.fontMedium, t.mY1]}>
          Description
        </Text>
        <View style={[t.pX3, t.mY1]}>
          <TextInput
            value={groupDescription}
            onChangeText={setGroupDescription}
            clearButtonMode="never"
            multiline={false}
            maxLength={128}
            placeholder="Add group description"
            style={[
              t.textBase,
              t.texts.primary,
              t.flexGrow,
              t.flexShrink,
              t.borderHairline,
              t.borderDefault,
              t.p3,
              t.roundedLg,
            ]}
          />
        </View>
        <Text style={[t.pX4, t.texts.secondary, t.fontMedium, t.mY1]}>
          Invite link
        </Text>
        <TouchableOpacity
          style={[
            t.mY1,
            t.mX3,
            t.borderHairline,
            t.borderDefault,
            t.p3,
            t.roundedLg,
            t.flexRow,
            t.itemsCenter,
            t.justifyBetween,
            { gap: 8 },
          ]}
          activeOpacity={0.5}
          onPress={onInviteToGroup}
        >
          <Octicons name="link" size={20} color={t.colors.text.secondary} />
          <Text2 style={[t.pL1, t.flex1]} numberOfLines={1}>
            {inviteLinkText}
          </Text2>
          <Octicons
            name="chevron-right"
            size={24}
            color={t.colors.text.tertiary}
          />
        </TouchableOpacity>
        <Text
          style={[t.pX4, t.texts.primary, t.textLg, t.fontMedium, t.mB3, t.mT6]}
        >
          Permissions
        </Text>
        <Text style={[t.pX4, t.texts.secondary, t.fontMedium, t.mY1]}>
          Who can add users
        </Text>
        <DirectCastsPermissionSelector
          options={whoCanInvitePermissionOptions}
          value={whoCanInviteValue}
          onChange={setWhoCanInviteValue}
        />
      </>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={headerHeight}
      style={[t.flex1]}
    >
      <ScrollView
        style={[t.borderTHairline, t.borderDefault]}
        contentContainerStyle={[t.pT5]}
      >
        {mainContent}
        <Text
          style={[t.pX4, t.texts.primary, t.textLg, t.fontMedium, t.mB3, t.mT6]}
        >
          Message retention
        </Text>
        <Text style={[t.pX4, t.texts.secondary, t.fontMedium, t.mY1]}>
          Auto-delete after
        </Text>
        <DirectCastsPermissionSelector
          options={ttlPermissionOptions}
          value={newMessageTTL}
          onChange={setNewMessageTTL}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
});

export { DirectCastsGroupEditScreen };
