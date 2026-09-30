import { Octicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { AnalyticsEvent } from 'farcaster-analytics';
import type { ApiDirectCastConversationInfoV3 } from 'farcaster-client-data';
import {
  useCreatePlaintextDirectCastGroupInvite,
  useInvalidatePlaintextDirectCastGroupInvite,
  usePlaintextDirectCastGroupInvite,
} from 'farcaster-client-hooks';
import * as React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { Text2 } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { usePush } from '~/hooks/navigation/usePush';

const directCastsConversationDetailsInviteLinkRowHeight = 82;

const DirectCastsConversationDetailsInviteLinkRow: React.FC<{
  conversation: ApiDirectCastConversationInfoV3;
}> = React.memo(({ conversation }) => {
  const t = useTheme();

  const currentUser = useCurrentUser_UNSAFE();
  const currentUserFid = currentUser.fid;

  const { data: invite, refetch } = usePlaintextDirectCastGroupInvite({
    fid: currentUserFid,
    conversationId: conversation.conversationId,
  });

  const push = usePush();

  const inviteCode = invite?.inviteCode;
  const inviteURL = React.useMemo(
    () => (inviteCode ? `https://farcaster.xyz/~/group/${inviteCode}` : ''),
    [inviteCode],
  );

  const { trackEvent } = useAnalytics();

  const toast = useToast();

  const isAdmin = conversation.viewerContext.access === 'admin';

  const invalidatePlaintextDirectCastGroupInvite =
    useInvalidatePlaintextDirectCastGroupInvite();
  const createPlaintextDirectCastGroupInvite =
    useCreatePlaintextDirectCastGroupInvite();
  const onInviteToGroup = React.useCallback(async () => {
    if (inviteURL) {
      Clipboard.setUrlAsync(inviteURL);
      trackEvent(AnalyticsEvent.PressDirectCastsInviteCopyLink, undefined);
      toast.show('Copied link to clipboard', { placement: 'bottom' });
      return;
    }
    if (!isAdmin) {
      return;
    }
    await createPlaintextDirectCastGroupInvite({
      fid: currentUserFid,
      conversationId: conversation.conversationId,
    });
    invalidatePlaintextDirectCastGroupInvite({
      fid: currentUserFid,
      conversationId: conversation.conversationId,
    });
    refetch();
    push('DirectCastsGroupInviteLink', {
      conversationId: conversation.conversationId,
    });
  }, [
    conversation.conversationId,
    createPlaintextDirectCastGroupInvite,
    currentUserFid,
    invalidatePlaintextDirectCastGroupInvite,
    inviteURL,
    isAdmin,
    push,
    refetch,
    trackEvent,
    toast,
  ]);

  const inviteURLText = React.useMemo(
    () => (inviteCode ? `farcaster.xyz/~/group/${inviteCode}` : ''),
    [inviteCode],
  );

  if (!inviteURL && !isAdmin) {
    return null;
  }

  let content;
  if (inviteURLText) {
    content = (
      <>
        <View style={[t.flex1]}>
          <Text2 weight="medium">Share invite link</Text2>
          <Text2 color="secondary" size="xs" numberOfLines={1}>
            {inviteURLText}
          </Text2>
        </View>
        <View
          style={[
            t.roundedFull,
            t.bgFaint,
            { height: 42, width: 42 },
            t.flex,
            t.justifyCenter,
            t.itemsCenter,
          ]}
        >
          <Octicons name="copy" size={16} color={t.colors.text.primary} />
        </View>
      </>
    );
  } else {
    content = (
      <>
        <Text2 weight="medium" style={[t.flex1]}>
          Create invite link
        </Text2>
        <Octicons
          name="chevron-right"
          size={24}
          color={t.colors.text.primary}
        />
      </>
    );
  }

  return (
    <TouchableOpacity
      style={[
        t.flexRow,
        t.itemsCenter,
        t.justifyBetween,
        t.pY5,
        t.pX1,
        { gap: 8 },
        { height: directCastsConversationDetailsInviteLinkRowHeight },
      ]}
      activeOpacity={0.5}
      onPress={onInviteToGroup}
    >
      <View
        style={[
          t.roundedFull,
          t.borderDefault,
          t.borderHairline,
          { height: 42, width: 42 },
          t.flex,
          t.justifyCenter,
          t.itemsCenter,
        ]}
      >
        <Octicons name="link" size={20} color={t.colors.text.secondary} />
      </View>
      {content}
    </TouchableOpacity>
  );
});

export {
  DirectCastsConversationDetailsInviteLinkRow,
  directCastsConversationDetailsInviteLinkRowHeight,
};
