import { Ionicons, Octicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import * as ImagePicker from 'expo-image-picker';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUser } from 'farcaster-client-data';
import {
  useChangeMemberInPlaintextDirectCastGroup,
  useChangePhotoInPlaintextDirectCastGroup,
  useCreatePlaintextDirectCastGroup,
  useDebouncedValue,
  useDirectCastUsers,
  userKeyExtractor,
} from 'farcaster-client-hooks';
import uniqBy from 'lodash/uniqBy';
import React, { FC, memo } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { CastAvatar } from '~/components/casts/CastAvatar';
import {
  DirectCastsSlimUser,
  DirectCastsSlimUserProps,
} from '~/components/DirectCasts/DirectCastsSlimUser';
import { GroupConversationImage } from '~/components/DirectCasts/GroupConversationImage';
import { ScreenPanel } from '~/components/DirectCasts/ScreenPanel';
import { Empty } from '~/components/Empty';
import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { HeaderRightSubmit } from '~/components/HeaderRightSubmit';
import { LoadingIndicator } from '~/components/LoadingIndicator';
import { buildScreen } from '~/components/Screen';
import { SearchInput } from '~/components/SearchInput';
import { Text } from '~/components/Text';
import { TextInputWithCounter } from '~/components/TextInput/TextInputWithCounter';
import { onEndReachedThreshold } from '~/constants/FlatList';
import { hitSlop } from '~/constants/Pressable';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { useUploadCloudflareImage } from '~/hooks/data/useUploadCloudflareImage';
import { usePop } from '~/hooks/navigation/usePop';
import { useReplace } from '~/hooks/navigation/useReplace';
import { useCommonFlatListExtraData } from '~/hooks/useCommonFlatListExtraData';
import { useDisplayLimit } from '~/hooks/useDisplayLimit';
import { useHaptics } from '~/hooks/useHaptics';
import { PlaintextDirectCastsStackParamList } from '~/types';
import { trackError } from '~/utils/ErrorUtils';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';
import {
  compressImage,
  requestMediaLibraryPermissions,
} from '~/utils/ImageUtils';

const LIST_BATCH_SIZE = 15;

type PlaintextDirectCastsCreateConversationAddMembersScreenProps =
  NativeStackScreenProps<
    PlaintextDirectCastsStackParamList,
    'PlaintextDirectCastsCreateConversationAddMembers'
  >;

const PlaintextDirectCastsCreateConversationAddMembersScreen =
  buildScreen<PlaintextDirectCastsCreateConversationAddMembersScreenProps>(
    {
      name: 'PlaintextDirectCastsCreateConversationAddMembers',
      keyboardVerticalOffset: Platform.select({ default: 0, android: 125 }),
      avoidKeyboard: true,
    },
    ({ route: { params } }) => {
      return (
        <PlaintextDirectCastsCreateConversationAddMembersScreenContent
          {...params}
        />
      );
    },
  );

PlaintextDirectCastsCreateConversationAddMembersScreen.displayName =
  'PlaintextDirectCastsCreateConversationAddMembersScreen';

const PlaintextDirectCastsCreateConversationAddMembersScreenContent: React.FC<
  PlaintextDirectCastsStackParamList['PlaintextDirectCastsCreateConversationAddMembers']
> = ({ conversationId, excludeFids }) => {
  const t = useTheme();
  const { setOptions } = useNavigation();
  const replace = useReplace();
  const pop = usePop();
  const { trackEvent } = useAnalytics();
  const toast = useToast();
  const currentUser = useCurrentUser_UNSAFE();
  const currentUserFid = currentUser.fid;

  const [selectedUsers, setSelectedUsers] = React.useState<ApiUser[]>([]);
  const [showGroupCreationFlow, setShowGroupCreationFlow] =
    React.useState<boolean>(false);
  const [groupImage, setGroupImage] = React.useState<string | undefined>(
    undefined,
  );
  const [groupName, setGroupName] = React.useState<string>('');
  const [creatingGroup, setCreatingGroup] = React.useState<boolean>(false);
  const [addingMembers, setAddingMembers] = React.useState<boolean>(false);
  const [editingPhoto, setEditingPhoto] = React.useState<boolean>(false);
  const [q, setQ] = React.useState<string>('');

  const debouncedQ = useDebouncedValue({ value: q });

  const createPlaintextDirectCastGroup = useCreatePlaintextDirectCastGroup();
  const changeMembershipInPlaintextDirectCastGroup =
    useChangeMemberInPlaintextDirectCastGroup();
  const changePhoto = useChangePhotoInPlaintextDirectCastGroup();
  const uploadImageToCloudflare = useUploadCloudflareImage();

  const createGroupFlow = React.useMemo(() => {
    return typeof conversationId === 'undefined';
  }, [conversationId]);

  const onCreateGroupPress = React.useCallback(async () => {
    if (!createGroupFlow || groupName.trim().length === 0) {
      return;
    }

    setCreatingGroup(true);

    try {
      const data = await createPlaintextDirectCastGroup({
        fid: currentUserFid,
        participantFids: selectedUsers.map((p) => p.fid),
        name: groupName,
      });
      if (data === null) {
        // eslint-disable-next-line no-console
        console.warn(
          'data was null: PlaintextDirectCastsCreateConversationAddMembersScreen:createPlaintextDirectCastGroup',
        );
      }
      const { result } = data;

      if (typeof groupImage !== 'undefined') {
        await changePhoto({
          fid: currentUserFid,
          conversationId: result.conversationId,
          photoUrl: groupImage,
        });
      }

      trackEvent(AnalyticsEvent.CreateGroupDirectCasts, {
        participant_count: selectedUsers.length + 1,
        with_image: typeof groupImage !== 'undefined',
      });

      replace('PlaintextDirectCastsConversation', {
        conversationId: result.conversationId,
        counterParty: selectedUsers[0],
        create: false,
        intentText: undefined,
      });
    } finally {
      setCreatingGroup(false);
    }
  }, [
    changePhoto,
    createGroupFlow,
    createPlaintextDirectCastGroup,
    currentUserFid,
    groupImage,
    groupName,
    replace,
    selectedUsers,
    trackEvent,
  ]);

  const onAddMembersPress = React.useCallback(async () => {
    if (
      createGroupFlow ||
      selectedUsers.length === 0 ||
      typeof conversationId === 'undefined'
    ) {
      return;
    }

    setAddingMembers(true);

    try {
      trackEvent(AnalyticsEvent.AddMemberDirectCastsGroup, {
        new_member_count: selectedUsers.length,
      });

      await changeMembershipInPlaintextDirectCastGroup({
        senderContext: {
          fid: currentUserFid,
          displayName: currentUser.displayName,
          username: currentUser.username,
        },
        conversationId: conversationId,
        action: 'add',
        participants: selectedUsers,
      });

      pop(2);
    } finally {
      setAddingMembers(false);
    }
  }, [
    changeMembershipInPlaintextDirectCastGroup,
    conversationId,
    createGroupFlow,
    currentUser,
    currentUserFid,
    pop,
    selectedUsers,
    trackEvent,
  ]);

  React.useEffect(() => {
    if (showGroupCreationFlow) {
      setOptions({
        headerTitle: 'New Group',
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => {
              setShowGroupCreationFlow(false);
            }}
          >
            <Text style={[t.texts.brand, t.textBase]}>Back</Text>
          </TouchableOpacity>
        ),
        headerRight: () => (
          <HeaderRightSubmit
            disabled={groupName.trim().length === 0 || editingPhoto}
            loading={creatingGroup}
            onPress={onCreateGroupPress}
            actionTextOverload={'Create'}
            style={[{ marginLeft: -14 }]}
          />
        ),
      });
    } else if (createGroupFlow) {
      setOptions({
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => {
              pop();
            }}
          >
            <Text style={[t.texts.brand, t.textBase]}>Cancel</Text>
          </TouchableOpacity>
        ),
        headerTitle: 'Add to group',
        headerRight: () => (
          <HeaderRightSubmit
            disabled={selectedUsers.length === 0}
            loading={false}
            onPress={() => {
              setShowGroupCreationFlow(true);
            }}
            actionTextOverload={'Next'}
          />
        ),
      });
    } else {
      setOptions({
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => {
              pop();
            }}
          >
            <Text style={[t.texts.brand, t.textBase]}>Cancel</Text>
          </TouchableOpacity>
        ),
        headerTitle: 'Add to group',
        headerRight: () => (
          <HeaderRightSubmit
            disabled={selectedUsers.length === 0}
            loading={addingMembers}
            onPress={() => {
              Alert.alert(
                `Are you sure you want to invite ${selectedUsers.length} ${
                  selectedUsers.length === 1 ? 'member' : 'members'
                }?`,
                '',
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                  {
                    text: 'Invite',
                    style: 'default',
                    onPress: onAddMembersPress,
                  },
                ],
              );
            }}
            actionTextOverload={'Invite'}
          />
        ),
      });
    }
  }, [
    addingMembers,
    createGroupFlow,
    creatingGroup,
    editingPhoto,
    groupName,
    onAddMembersPress,
    onCreateGroupPress,
    pop,
    selectedUsers.length,
    setOptions,
    showGroupCreationFlow,
    t.textBase,
    t.texts.brand,
  ]);

  const onAddUserPress = React.useCallback(
    ({ user }: { user: ApiUser }) => {
      if (showGroupCreationFlow) {
        return;
      }

      setSelectedUsers((users) => {
        users.push(user);

        // We are not able to modify the click handlers as FlashList optimizes the
        // callbacks. So no way to guarantee unique selections from the list at
        // the moment. So instead we are going to go with capping the selections here.
        const filtered = Array.from(
          new Set<number>(users.map(({ fid }) => fid)),
        );
        const selected = filtered.map(
          // ! here as users has to have the referenced value
          (f) => users.find(({ fid }) => f === fid)!,
        );
        return selected;
      });

      // Clear the search query after user selects the user from search
      setQ('');
    },
    [showGroupCreationFlow],
  );

  const onRemoveUserPress = React.useCallback(
    ({ user }: { user: ApiUser }) => {
      if (showGroupCreationFlow) {
        return;
      }

      setSelectedUsers((users) => {
        const filtered = users.filter(({ fid }) => fid !== user.fid);
        return [...filtered];
      });
    },
    [showGroupCreationFlow],
  );

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

      if (pickImageResult.canceled) {
        setEditingPhoto(false);
        return;
      }
    } catch (e) {
      trackError(e);
      toast.show('Failed to pick image', { type: 'danger' });
      return;
    }

    const { assets } = pickImageResult;
    const asset = assets ? assets[0] : undefined;

    if (!asset) {
      setEditingPhoto(false);
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
      name: 'direct-cast-group-img',
    });

    if (typeof result === 'undefined') {
      toast.show('Failed to upload image', { type: 'danger' });
      return;
    }

    setGroupImage(result.imageUrl.replace(/original$/, 'rectcrop3'));
    setEditingPhoto(false);
  }, [uploadImageToCloudflare, toast]);

  const onResetPhotoPress = React.useCallback(() => {
    setGroupImage(undefined);
  }, []);

  return (
    <View style={[t.hFull, t.pX2]}>
      {showGroupCreationFlow ? (
        <ScreenPanel
          dangerouslyApplyExtraStyles={[t.justifyCenter, { height: 98 }]}
          animated={false}
        >
          <View style={[t.flex, t.flexRow, t.pX2, t.pY2, t.wFull]}>
            <View style={[t.selfStart, { width: 60, height: 60 }]}>
              {groupImage ? (
                <View
                  style={[
                    t.relative,
                    t.flex,
                    t.flexCol,
                    t.itemsStart,
                    t.justifyCenter,
                    { height: 52, width: 52 },
                    t.pT1,
                    t.pB2,
                    t.mR2,
                  ]}
                >
                  <GroupConversationImage diameter={48} imageURL={groupImage} />
                  <TouchableOpacity
                    style={[
                      t.absolute,
                      t.right0,
                      t.top0,
                      t.borderHairline,
                      t.borderDefault,
                      t.roundedFull,
                      t.shadow,
                      t.flex,
                      t.itemsCenter,
                      t.justifyCenter,
                      t.flexRow,
                      t.w5,
                      t.h5,
                      { backgroundColor: '#6a7175' },
                    ]}
                    activeOpacity={0.65}
                    onPress={onResetPhotoPress}
                    hitSlop={hitSlop}
                  >
                    <Octicons
                      name="x"
                      size={16}
                      style={[{ color: '#ffffff' }, { paddingLeft: 0.5 }]}
                    />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    t.flexRow,
                    t.justifyCenter,
                    t.borderDefault,
                    t.borderHairline,
                    t.roundedFull,
                    t.itemsCenter,
                    { height: 48, width: 48 },
                    { backgroundColor: t.dark ? '#6a7175' : '#dfe5e7' },
                  ]}
                  onPress={onEditPhotoPress}
                >
                  {editingPhoto ? (
                    <LoadingIndicator />
                  ) : (
                    <Ionicons
                      name="people"
                      size={48 / 1.75}
                      style={[{ color: '#ffffff' }]}
                    />
                  )}
                </TouchableOpacity>
              )}
            </View>
            <TextInputWithCounter
              autoCorrect={false}
              autoFocus={true}
              clearButtonMode="never"
              multiline={false}
              numberOfLines={1}
              maxLength={32}
              onChangeText={setGroupName}
              placeholder="Add group name"
              value={groupName}
              inputStyle={[t.textBase]}
              containerStyle={[t.mL0, t.flexGrow]}
            />
          </View>
        </ScreenPanel>
      ) : (
        <View style={[t.flex, t.flexRow, t.pX2]}>
          <SearchInput
            align="left"
            onChangeText={(text) => setQ(text)}
            value={q}
            placeholder="Search"
            autoCorrect={false}
            width="100%"
            autoCapitalize="none"
          />
        </View>
      )}
      <PlaintextDirectCastUsers
        q={debouncedQ}
        excludeFids={excludeFids}
        onAddUserPress={onAddUserPress}
        onRemoveUserPress={onRemoveUserPress}
        selectedUsers={selectedUsers}
        showGroupCreationFlow={showGroupCreationFlow}
      />
    </View>
  );
};

type PlaintextDirectCastUsersProps = {
  q: string;
  excludeFids?: number[];
  onAddUserPress: ({ user }: { user: ApiUser }) => void;
  onRemoveUserPress: ({ user }: { user: ApiUser }) => void;
  selectedUsers: ApiUser[];
  showGroupCreationFlow: boolean;
};

const PlaintextDirectCastUsers: React.FC<PlaintextDirectCastUsersProps> = ({
  q,
  excludeFids,
  onAddUserPress,
  onRemoveUserPress,
  selectedUsers,
  showGroupCreationFlow,
}) => {
  const t = useTheme();
  const { trackEvent } = useAnalytics();

  const { triggerImpactAsync } = useHaptics();

  const { data, fetchNextPage, isFetching, hasNextPage } = useDirectCastUsers({
    q,
    excludeFids: [...(excludeFids ?? []), ...selectedUsers.map((u) => u.fid)],
  });

  const flatListRef = React.useRef<FlashListRef<ApiUser>>(null);
  const scrollRef = React.useRef<ScrollView>(null);

  const extraData = useCommonFlatListExtraData();
  const users = React.useMemo(
    () =>
      uniqBy(
        data?.pages.flatMap((page) => page.result.users) || [],
        userKeyExtractor,
      ),
    [data],
  );

  const { displayedItems: displayedUsers, handleEndReached } = useDisplayLimit({
    data: users,
    batchSize: LIST_BATCH_SIZE,
    hasNextPage,
    isFetching,
    fetchNextPage,
  });

  React.useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [selectedUsers]);

  const renderUser = React.useCallback(
    ({ item: user }: { item: ApiUser }) => {
      const viewerCanSendDirectCasts = !!user.viewerContext?.canSendDirectCasts;
      const userClickDisabled = !viewerCanSendDirectCasts;

      const navigate = () => {
        if (userClickDisabled) {
          return;
        }

        triggerImpactAsync();

        trackEvent(AnalyticsEvent.ClickSearchDirectCastUser, {});
        onAddUserPress({ user });
      };
      return (
        <Pressable
          style={[userClickDisabled && t.opacity75]}
          onPress={navigate}
        >
          <MaybeDisabledUser
            disabled={!viewerCanSendDirectCasts}
            user={user}
            onUserPressCallback={navigate}
            lastInList={false}
          />
        </Pressable>
      );
    },
    [onAddUserPress, t.opacity75, trackEvent, triggerImpactAsync],
  );

  if (users.length === 0 && !isFetching && !!q) {
    return (
      <View style={[t.hFull]}>
        <Empty
          justify="start"
          message={'No users found to start a conversation.'}
        />
      </View>
    );
  }

  return (
    <View style={[t.hFull]}>
      {selectedUsers.length !== 0 && (
        <ScreenPanel
          dangerouslyApplyExtraStyles={[t.border0, t.mX2, t.mT2]}
          animated={true}
        >
          <ScrollView
            ref={scrollRef}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[]}
          >
            {selectedUsers.map((su) => (
              <View
                key={su.fid}
                style={[
                  t.relative,
                  t.flex,
                  t.flexCol,
                  t.itemsStart,
                  t.justifyCenter,
                  { width: 52 },
                  t.pY2,
                  t.mR2,
                ]}
              >
                <CastAvatar avatarDiameter={48} user={su} disabled={true} />
                <Text
                  style={[
                    t.wFull,
                    t.textCenter,
                    t.texts.tertiary,
                    t.textXs,
                    t.mT1,
                  ]}
                  numberOfLines={1}
                >
                  {su.displayName.split(' ')[0]}
                </Text>
                {!showGroupCreationFlow && (
                  <TouchableOpacity
                    style={[
                      t.absolute,
                      t.right0,
                      t.top0,
                      t.mT1,
                      t.borderHairline,
                      t.borderDefault,
                      t.roundedFull,
                      t.shadow,
                      t.flex,
                      t.itemsCenter,
                      t.justifyCenter,
                      t.flexRow,
                      t.w5,
                      t.h5,
                      {
                        backgroundColor: t.colors.blueMarguerite,
                      },
                    ]}
                    activeOpacity={0.65}
                    onPress={() => {
                      onRemoveUserPress({ user: su });
                    }}
                    hitSlop={hitSlop}
                  >
                    <Octicons
                      name="x"
                      size={16}
                      style={[{ color: '#ffffff' }, { paddingLeft: 0.5 }]}
                    />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </ScrollView>
        </ScreenPanel>
      )}
      {!showGroupCreationFlow && (
        <ScreenPanel
          dangerouslyApplyExtraStyles={[
            t.flex1,
            { maxHeight: '90%' },
            t.border0,
            t.mT2,
            t.mB10,
          ]}
          animated={false}
        >
          {isFetching ? (
            <FullScreenLoadingIndicator
              debugName="DirectCastUsers"
              style={[t.mT5]}
              justify="start"
            />
          ) : (
            <FlashList
              data={displayedUsers}
              extraData={extraData}
              keyExtractor={userKeyExtractor}
              onEndReached={handleEndReached}
              onEndReachedThreshold={onEndReachedThreshold}
              ref={flatListRef}
              keyboardShouldPersistTaps="handled"
              {...STANDARD_FLASHLIST_PERF_PROPS}
              renderItem={renderUser}
            />
          )}
        </ScreenPanel>
      )}
    </View>
  );
};

PlaintextDirectCastsCreateConversationAddMembersScreenContent.displayName =
  'PlaintextDirectCastsCreateConversationAddMembersScreenContent';

const MaybeDisabledUser: FC<DirectCastsSlimUserProps & { disabled: boolean }> =
  memo(({ disabled, ...props }) => {
    const t = useTheme();

    return (
      <View style={[disabled && t.opacity75]}>
        <DirectCastsSlimUser {...props} />
      </View>
    );
  });

MaybeDisabledUser.displayName = 'MaybeDisabledUser';

export { PlaintextDirectCastsCreateConversationAddMembersScreen };
