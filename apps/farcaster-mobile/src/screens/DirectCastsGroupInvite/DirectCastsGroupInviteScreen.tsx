import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  useChangeMemberInPlaintextDirectCastGroup,
  useFarcasterApiClient,
  usePlaintextDirectCastGroupInvite,
} from 'farcaster-client-hooks';
import {
  AtomsButton,
  ToastProvider,
  useDefaultToastProviderProps,
  useRootToast,
} from 'farcaster-expo';
import React, { useCallback, useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

import { GroupConversationImage } from '~/components/DirectCasts/GroupConversationImage';
import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { useGoBack } from '~/hooks/navigation/useGoBack';
import { useReplace } from '~/hooks/navigation/useReplace';
import { PlaintextDirectCastsStackParamList } from '~/types';

type DirectCastsGroupInviteScreenProps = NativeStackScreenProps<
  PlaintextDirectCastsStackParamList,
  'DirectCastsGroupInvite'
>;

const DirectCastsGroupInviteScreen =
  buildScreen<DirectCastsGroupInviteScreenProps>(
    { name: 'DirectCastsGroupInvite' },
    ({
      route: {
        params: { inviteCode },
      },
    }) => {
      return (
        <React.Suspense>
          <DirectCastsGroupInvite inviteCode={inviteCode} />
        </React.Suspense>
      );
    },
  );

DirectCastsGroupInviteScreen.displayName = 'DirectCasts';

type DirectCastsGroupInviteProps = {
  inviteCode: string;
};

const DirectCastsGroupInviteContent: React.FC<DirectCastsGroupInviteProps> = ({
  inviteCode,
}) => {
  const t = useTheme();
  const back = useGoBack();
  const { setOptions } = useNavigation();
  const replace = useReplace();
  const { trackEvent } = useAnalytics();
  const currentUser = useCurrentUser_UNSAFE();
  const currentUserFid = currentUser.fid;
  const { apiClient } = useFarcasterApiClient();
  const [isJoining, setIsJoining] = useState(false);
  const { data: invite, isPending } = usePlaintextDirectCastGroupInvite({
    fid: currentUserFid,
    inviteCode: inviteCode,
  });
  const [canJoin, setCanJoin] = useState<boolean>(false);
  const particpantsCount = invite?.participantCount ?? 0;

  const changeMemberInGroup = useChangeMemberInPlaintextDirectCastGroup();
  const toast = useRootToast();

  React.useEffect(() => {
    trackEvent(AnalyticsEvent.ViewDirectCastInvite, {
      conversationId: invite?.conversationId,
    });
    setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => {
            back();
          }}
        >
          <Text style={[t.texts.brand, t.textBase]}>Cancel</Text>
        </TouchableOpacity>
      ),
    });
  }, [
    back,
    invite?.conversationId,
    setOptions,
    t.textBase,
    t.texts.brand,
    trackEvent,
  ]);

  const onJoin = useCallback(() => {
    trackEvent(AnalyticsEvent.ClientDirectCastInviteJoin, {
      conversationId: invite?.conversationId,
    });
    changeMemberInGroup({
      senderContext: {
        fid: currentUserFid,
        displayName: currentUser.displayName,
        username: currentUser.username,
      },
      conversationId: invite!.conversationId,
      participants: [currentUser],
      inviteCode: inviteCode,
      action: 'add',
    })
      .then(async () => {
        trackEvent(AnalyticsEvent.JoinDirectCastsGroup, {
          conversationId: invite?.conversationId,
        });
        setIsJoining(true);
        // TODO(gabriel): Replace with a hook instead of using the api client.
        const response = await apiClient.getDirectCastConversation({
          conversationId: invite!.conversationId,
        });
        back();
        setIsJoining(false);
        replace('PlaintextDirectCastsConversation', {
          conversationId: invite!.conversationId,
          counterParty: response.data.result.conversation.participants[0],
          create: false,
          intentText: undefined,
        });
      })
      .catch(() => {
        trackEvent(AnalyticsEvent.ClientDirectCastInviteJoinFailed, {
          conversationId: invite?.conversationId,
          inviteCode: inviteCode,
        });
        toast.show('Failed to join group');
      });
  }, [
    apiClient,
    back,
    changeMemberInGroup,
    currentUserFid,
    currentUser,
    invite,
    inviteCode,
    replace,
    trackEvent,
    toast,
  ]);

  useEffect(() => {
    if (invite?.criteria) {
      if (invite.criteria.followers && !invite.meetsCriteria?.followers) {
        setCanJoin(false);
        return;
      }

      if (
        (invite.criteria.hasCollectionIds?.length || 0) !== 0 &&
        !invite.meetsCriteria?.hasCollectionIds
      ) {
        setCanJoin(false);
        return;
      }

      setCanJoin(true);
    } else if (!isPending) {
      setCanJoin(true);
    } else {
      setCanJoin(true);
    }
  }, [invite, isPending]);

  return (
    <View
      style={[
        t.bgDefault,
        t.hFull,
        t.wFull,
        t.borderTHairline,
        t.borderDefault,
        t.pT8,
        t.pB8,
      ]}
    >
      <View
        style={[
          t.flex,
          t.flexCol,
          t.justifyBetween,
          t.itemsCenter,
          t.hFull,
          t.wFull,
          t.mB4,
        ]}
      >
        <View
          style={[
            t.wFull,
            t.itemsCenter,
            t.mX4,
            t.pB4,
            t.borderDefault,
            t.borderB,
            t.borderBHairline,
          ]}
        >
          <GroupConversationImage diameter={96} imageURL={invite?.photoUrl} />
          <Text style={[t.texts.primary, t.m4, t.text2xl, t.fontSemibold]}>
            {!invite?.expired
              ? (invite?.name ?? 'Expired Link')
              : 'Expired Link'}
          </Text>
        </View>
        <View
          style={[
            t.flex,
            t.flexCol,
            t.wFull,
            t.p2,
            t.mT2,
            t.pX4,
            t.flexGrow,
            t.itemsCenter,
          ]}
        >
          {canJoin ? (
            <Text style={[t.texts.primary, t.mB2]}>
              You can join the group.
            </Text>
          ) : (
            <Text style={[t.texts.primary, t.mB2]}>
              You cannot join the group.
            </Text>
          )}
          {invite?.criteria ? (
            <>
              {invite.meetsCriteria?.followers !== undefined ? (
                invite.meetsCriteria?.followers === false ? (
                  <Text style={[t.texts.primary, t.mB2]}>
                    The host must be following you.
                  </Text>
                ) : (
                  <></>
                )
              ) : (
                <></>
              )}
              {invite.meetsCriteria?.hasCollectionIds !== undefined ? (
                invite.meetsCriteria?.hasCollectionIds === false ? (
                  <Text style={[t.texts.primary, t.mB2]}>
                    You don't have the required onchain collection memberships.
                  </Text>
                ) : (
                  <Text style={[t.texts.primary, t.mB2]}>
                    You have the required onchain collection memberships.
                  </Text>
                )
              ) : (
                <></>
              )}
            </>
          ) : (
            <></>
          )}
          {invite?.expired && (
            <Text style={[t.texts.primary]}>
              Message the host to send you a new one
            </Text>
          )}
        </View>
        <View
          style={[
            t.flex,
            t.flexCol,
            t.wFull,
            t.p2,
            t.mT2,
            t.pX4,
            t.itemsCenter,
          ]}
        >
          {!invite?.expired &&
            (particpantsCount >= 1000 ? (
              <Text style={[t.texts.primary]}>
                Groups can have a maximum 1000 users
              </Text>
            ) : canJoin ? (
              <AtomsButton
                onPress={onJoin}
                loading={isJoining}
                size="l"
                hierarchy="primary"
                style={[t.wFull]}
              >
                Join
              </AtomsButton>
            ) : (
              <AtomsButton
                onPress={() => {
                  back();
                }}
                size="l"
                hierarchy="overlay"
                style={[t.wFull]}
              >
                Back to home
              </AtomsButton>
            ))}
        </View>
      </View>
    </View>
  );
};

const DirectCastsGroupInvite: React.FC<DirectCastsGroupInviteProps> = ({
  inviteCode,
}) => {
  const defaultToastProviderProps = useDefaultToastProviderProps();
  return (
    <ToastProvider {...defaultToastProviderProps}>
      <DirectCastsGroupInviteContent inviteCode={inviteCode} />
    </ToastProvider>
  );
};

export { DirectCastsGroupInviteScreen };
