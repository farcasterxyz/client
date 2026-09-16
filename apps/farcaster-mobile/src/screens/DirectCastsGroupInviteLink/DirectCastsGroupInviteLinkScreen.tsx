import { Octicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  getNotionLinkTarget,
  useCreatePlaintextDirectCastGroupInvite,
  useInvalidatePlaintextDirectCastGroupInvite,
  usePlaintextDirectCastGroupInvite,
} from 'farcaster-client-hooks';
import React, { SetStateAction, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useToast } from 'react-native-toast-notifications';

import { ButtonV2 } from '~/components/ButtonV2';
import {
  DirectCastsPermissionSelector,
  DirectCastsPermissionSelectorPermission,
} from '~/components/DirectCasts/DirectCastsPermissionSelector';
import { HeaderRightSubmit } from '~/components/HeaderRightSubmit';
import { buildScreen } from '~/components/Screen';
import { Switch } from '~/components/Switch';
import { Text, Text2 } from '~/components/Text';
import { TextWithPress } from '~/components/TextWithPress';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { useGoBack } from '~/hooks/navigation/useGoBack';
import { PlaintextDirectCastsStackParamList } from '~/types';
import { shareUrl } from '~/utils/SharingUtils';

type DirectCastsGroupInviteLinkScreenProps = NativeStackScreenProps<
  PlaintextDirectCastsStackParamList,
  'DirectCastsGroupInviteLink'
>;

const DirectCastsGroupInviteLinkScreen =
  buildScreen<DirectCastsGroupInviteLinkScreenProps>(
    { name: 'DirectCastsGroupInviteLink' },
    ({
      route: {
        params: { conversationId },
      },
    }) => {
      return (
        <React.Suspense>
          <DirectCastsGroupInviteLink conversationId={conversationId} />
        </React.Suspense>
      );
    },
  );

DirectCastsGroupInviteLinkScreen.displayName = 'DirectCasts';

const whoCanJoinPermissionOptions: DirectCastsPermissionSelectorPermission<
  'everyone' | 'follows'
>[] = [
  { value: 'everyone', title: 'Everyone' },
  { value: 'follows', title: 'People I follow' },
];

const openSeaCollectionMatcher =
  /https:\/\/(www.)?opensea.io\/collection\/([a-z0-9-_]+)/i;
const CAIP_10_PATTERN = /eip155:(\d+):(0x[a-fA-F0-9]+)(?::(\d+))?/;

const openNFTDoc = () => {
  Linking.openURL(getNotionLinkTarget({ to: 'nft-collections' }));
};

type DirectCastsGroupInviteLinkProps = {
  conversationId: string;
};

const DirectCastsGroupInviteLink: React.FC<DirectCastsGroupInviteLinkProps> = ({
  conversationId,
}) => {
  const t = useTheme();
  const back = useGoBack();
  const { setOptions } = useNavigation();
  const toast = useToast();
  const { trackEvent } = useAnalytics();

  const { fid: currentUserFid } = useCurrentUser_UNSAFE();

  const invalidatePlaintextDirectCastGroupInvite =
    useInvalidatePlaintextDirectCastGroupInvite();
  const createPlaintextDirectCastGroupInvite =
    useCreatePlaintextDirectCastGroupInvite();
  const {
    data: invite,
    refetch,
    isPending,
  } = usePlaintextDirectCastGroupInvite({
    fid: currentUserFid,
    conversationId: conversationId,
  });
  const [criteria, setCriteria] = useState<{
    followers?: 'everyone' | 'follows';
    hasCollectionIds?: string[];
  }>(invite?.criteria || {});

  const inviteCode = invite?.inviteCode;
  const inviteURL = React.useMemo(
    () => (inviteCode ? `https://farcaster.xyz/~/group/${inviteCode}` : ''),
    [inviteCode],
  );

  const onCopyLink = React.useCallback(() => {
    Clipboard.setUrlAsync(inviteURL);
    trackEvent(AnalyticsEvent.PressDirectCastsInviteCopyLink, undefined);
    back();
    toast.show('Copied link to clipboard', { placement: 'bottom' });
  }, [inviteURL, trackEvent, back, toast]);

  const onResetLink = React.useCallback(() => {
    Alert.alert('Are you sure you want to reset this link?', '', [
      {
        text: 'No',
        style: 'cancel',
      },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          await createPlaintextDirectCastGroupInvite({
            fid: currentUserFid,
            conversationId,
            criteria,
          });
          await invalidatePlaintextDirectCastGroupInvite({
            fid: currentUserFid,
            conversationId,
          });
          await refetch();
          toast.show('Group invite link updated', { placement: 'bottom' });
        },
      },
    ]);
  }, [
    createPlaintextDirectCastGroupInvite,
    currentUserFid,
    conversationId,
    criteria,
    invalidatePlaintextDirectCastGroupInvite,
    refetch,
    toast,
  ]);

  useEffect(() => {
    if (invite || isPending) {
      return;
    }
    (async () => {
      await createPlaintextDirectCastGroupInvite({
        fid: currentUserFid,
        conversationId: conversationId,
        criteria: {},
      });
      invalidatePlaintextDirectCastGroupInvite({
        fid: currentUserFid,
        conversationId: conversationId,
      });
      await refetch();
    })();
  }, [
    conversationId,
    createPlaintextDirectCastGroupInvite,
    currentUserFid,
    invalidatePlaintextDirectCastGroupInvite,
    invite,
    isPending,
    refetch,
  ]);

  const collectionID =
    invite?.criteria?.hasCollectionIds?.length === 1
      ? invite.criteria.hasCollectionIds[0]
      : undefined;
  const [collectionURL, setCollectionURL] = useState<string>(
    collectionID ? `https://opensea.io/collection/${collectionID}` : '',
  );

  const [collectionURLValid, setCollectionURLValid] = React.useState<
    boolean | undefined
  >();
  const checkCollectionURL = React.useCallback(() => {
    setCollectionURLValid(
      openSeaCollectionMatcher.test(collectionURL) ||
        CAIP_10_PATTERN.test(collectionURL),
    );
  }, [collectionURL]);

  const [saveError, setSaveError] = useState<string | undefined>();

  const onSetCollectionURL = React.useCallback((url: string) => {
    setSaveError(undefined);
    if (openSeaCollectionMatcher.test(url)) {
      setCollectionURL(url);
      const slug = url.match(openSeaCollectionMatcher)![2];
      if (slug) {
        setCriteria((prev) => ({
          ...prev,
          hasCollectionIds: [slug],
        }));
      }
    } else if (CAIP_10_PATTERN.test(url)) {
      setCollectionURL(url);
      setCriteria((prev) => ({
        ...prev,
        hasCollectionIds: [url],
      }));
    } else {
      setCollectionURL(url);
      setCriteria((prev) => ({
        ...prev,
        hasCollectionIds: [],
      }));
    }
  }, []);

  const [mustHoldNFT, baseSetMustHoldNFT] = React.useState<boolean>(
    !!criteria.hasCollectionIds && criteria.hasCollectionIds.length > 0,
  );
  const [mustHoldNFTHasChanged, setMustHoldNFTHasChanged] =
    React.useState<boolean>(false);
  const setMustHoldNFT = React.useCallback(
    (setter: SetStateAction<boolean>) => {
      baseSetMustHoldNFT((prevVal) => {
        let newVal;
        if (typeof setter === 'function') {
          newVal = setter(prevVal);
        } else {
          newVal = setter;
        }
        if (!newVal) {
          setCriteria((prevCriteria) => ({
            ...prevCriteria,
            hasCollectionIds: [],
          }));
          setSaveError(undefined);
        } else if (collectionURL === '') {
          setCollectionURLValid(undefined);
        }
        return newVal;
      });
      setMustHoldNFTHasChanged(true);
    },
    [collectionURL],
  );

  const [savingUpdates, setSavingUpdates] = React.useState<boolean>(false);

  const onSavePress = React.useCallback(async () => {
    checkCollectionURL();
    if (mustHoldNFT && criteria?.hasCollectionIds?.length !== 1) {
      setSaveError('Invalid collection URL provided. Please try again.');
      return;
    }
    if (
      criteria?.followers === invite?.criteria?.followers &&
      (((criteria?.hasCollectionIds === undefined ||
        criteria.hasCollectionIds.length === 0) &&
        (invite?.criteria?.hasCollectionIds === undefined ||
          invite.criteria.hasCollectionIds.length === 0)) ||
        (criteria?.hasCollectionIds?.length === 1 &&
          invite?.criteria?.hasCollectionIds?.length === 1 &&
          criteria.hasCollectionIds[0] === invite.criteria.hasCollectionIds[0]))
    ) {
      return;
    }
    setSavingUpdates(true);
    try {
      await createPlaintextDirectCastGroupInvite({
        fid: currentUserFid,
        conversationId,
        inviteCode,
        criteria,
      });
      if (
        criteria?.hasCollectionIds === undefined ||
        criteria.hasCollectionIds.length === 0
      ) {
        setCollectionURL('');
      }
      await invalidatePlaintextDirectCastGroupInvite({
        fid: currentUserFid,
        conversationId,
      });
      await refetch();
      back();
    } finally {
      setSavingUpdates(false);
    }
  }, [
    back,
    checkCollectionURL,
    createPlaintextDirectCastGroupInvite,
    criteria,
    currentUserFid,
    conversationId,
    invite,
    inviteCode,
    invalidatePlaintextDirectCastGroupInvite,
    mustHoldNFT,
    refetch,
  ]);

  React.useEffect(() => {
    setOptions({
      headerRight: () => (
        <HeaderRightSubmit
          loading={savingUpdates}
          disabled={savingUpdates}
          onPress={onSavePress}
          actionTextOverload="Save"
        />
      ),
    });
  }, [
    setOptions,
    t.textBase,
    t.texts.primary,
    t.texts.brand,
    savingUpdates,
    onSavePress,
  ]);

  const inviteURLText = React.useMemo(
    () => (inviteCode ? `farcaster.xyz/~/group/${inviteCode}` : ''),
    [inviteCode],
  );

  const onShareInviteURL = React.useCallback(() => {
    shareUrl({
      title: 'Invite link to DC group chat',
      url: inviteURL,
    });
  }, [inviteURL]);

  const whoCanJoinPermission = criteria?.followers ?? 'everyone';

  const onChangeWhoCanJoinPermission = React.useCallback(
    (followerCriteria: 'everyone' | 'follows') => {
      setCriteria((prev) => ({
        ...prev,
        followers: followerCriteria,
      }));
    },
    [],
  );

  const headerHeight = useHeaderHeight();

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
        <View style={[t.flex, t.flexCol, t.itemsCenter, t.justifyCenter]}>
          <View
            style={[
              t.roundedFull,
              t.bgElevated,
              { height: 82, width: 82 },
              t.itemsCenter,
              t.justifyCenter,
            ]}
          >
            <Octicons name="link" size={36} color={t.colors.text.secondary} />
          </View>
        </View>
        <Text style={[t.texts.secondary, t.pX24, t.textCenter, t.pY4]}>
          Users will be able to join this group chat using the link below.
        </Text>
        <Text style={[t.pX4, t.texts.secondary, t.fontMedium, t.mY1]}>
          Invite URL
        </Text>
        <View
          style={[
            t.mY1,
            t.mX3,
            t.p3,
            t.bgElevated,
            t.roundedLg,
            t.flexRow,
            t.itemsCenter,
            t.justifyBetween,
            { gap: 8 },
          ]}
        >
          <Octicons name="link" size={20} color={t.colors.text.secondary} />
          <Text2 style={[t.pL1, t.flex1]} numberOfLines={1}>
            {inviteURLText}
          </Text2>
          <TouchableOpacity onPress={onResetLink}>
            <Octicons name="sync" size={24} color={t.colors.text.brand} />
          </TouchableOpacity>
        </View>
        <View style={[t.mT2, t.mB3, t.mX3, t.flexRow, { gap: 12 }]}>
          <ButtonV2
            onPress={onShareInviteURL}
            width="flex1"
            variant="secondary"
            title="Share"
            textSize="lg"
          />
          <ButtonV2
            onPress={onCopyLink}
            width="flex1"
            variant="primary"
            title="Copy"
            textSize="lg"
          />
        </View>
        <Text style={[t.pX4, t.texts.secondary, t.fontMedium, t.mY1]}>
          Who can join
        </Text>
        <DirectCastsPermissionSelector
          options={whoCanJoinPermissionOptions}
          value={whoCanJoinPermission}
          onChange={onChangeWhoCanJoinPermission}
        />
        <Text style={[t.pX4, t.texts.secondary, t.fontMedium, t.mY1]}>
          Requirements
        </Text>
        <View
          style={[
            t.mY1,
            t.mX3,
            t.borderHairline,
            t.borderDefault,
            t.roundedLg,
            t.justifyBetween,
          ]}
        >
          <View style={[t.flexRow, t.p3]}>
            <TouchableOpacity
              style={[
                t.flex1,
                t.flexRow,
                t.itemsEnd,
                t.itemsCenter,
                t.justifyBetween,
              ]}
              activeOpacity={0.75}
              onPress={() => setMustHoldNFT((prev) => !prev)}
            >
              <Text style={[t.textBase, t.texts.primary]}>Must hold NFT</Text>
              <Switch
                value={mustHoldNFT}
                style={[
                  t.absolute,
                  t.right0,
                  t._mR1,
                  { transform: [{ scale: 0.8 }] },
                ]}
                onValueChange={setMustHoldNFT}
                newColors
              />
            </TouchableOpacity>
          </View>
          {mustHoldNFT && (
            <Animated.View
              entering={FadeIn}
              exiting={FadeOut}
              style={[
                t.flexRow,
                t.p3,
                t.borderTHairline,
                t.borderDefault,
                t.justifyCenter,
                t.itemsCenter,
              ]}
            >
              <TextInput
                placeholder="Add collection URL..."
                autoFocus={mustHoldNFTHasChanged}
                style={[t.textBase, t.texts.primary, t.flex1]}
                value={collectionURL}
                onChangeText={onSetCollectionURL}
                onBlur={checkCollectionURL}
              />
              {collectionURLValid === true && (
                <Octicons
                  name="check"
                  size={24}
                  style={[t.texts.success, t.pL2, t.pR1]}
                />
              )}
              {collectionURLValid === false && (
                <Octicons
                  name="x"
                  size={24}
                  style={[t.colors.crimson, t.pL2, t.pR1]}
                />
              )}
            </Animated.View>
          )}
        </View>
        {mustHoldNFT && (
          <Animated.Text
            entering={FadeIn}
            exiting={FadeOut}
            style={[t.pX4, t.texts.tertiary, t.mY1]}
          >
            Accepts OpenSea URLs or CAIP-10.{' '}
            <TextWithPress style={[t.texts.brand]} onPress={openNFTDoc}>
              Learn more
            </TextWithPress>
          </Animated.Text>
        )}
        {saveError && (
          <View
            style={[
              t.mX3,
              t.mY3,
              t.pX3,
              t.pY2,
              t.roundedLg,
              t.borderActionDestructive,
              t.border,
              { backgroundColor: `${t.colors.actionRed}19` },
            ]}
          >
            <Text style={[t.textBase, t.texts.primary]}>{saveError}</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export { DirectCastsGroupInviteLinkScreen };
