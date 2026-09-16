import { BottomSheetView, useBottomSheetModal } from '@gorhom/bottom-sheet';
import { ApiUser, ApiUserMinimal } from 'farcaster-client-data';
import {
  resolveUsername,
  useAcceptGroupInvite,
  useDeclineGroupInvite,
} from 'farcaster-client-hooks';
import { AtomsButton } from 'farcaster-expo';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from 'react-native-toast-notifications';

import {
  BottomSheetModal,
  useBottomSheetModalRef,
} from '~/components/BottomSheet';
import { Heading, Text2 } from '~/components/Text';
import { ReportUser } from '~/components/users/ReportUser';
import { Well } from '~/components/Well';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { usePop } from '~/hooks/navigation/usePop';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';

type GroupInviteRequestDisclaimerProps = {
  conversationId: string;
  inviter?: ApiUser | ApiUserMinimal;
};

const GroupInviteRequestDisclaimer: React.FC<GroupInviteRequestDisclaimerProps> =
  React.memo(({ conversationId, inviter }) => {
    const t = useTheme();
    const toast = useToast();
    const pop = usePop();
    const { fid: currentUserFid } = useCurrentUser_UNSAFE();
    const { dismissAll } = useBottomSheetModal();
    const deleteModalRef = useBottomSheetModalRef();
    const reportUserBottomSheetRef = useBottomSheetModalRef();
    const [submitting, setSubmitting] = useState(false);
    const pushToUserProfile = usePushToUserProfile();

    const acceptGroupInvite = useAcceptGroupInvite();
    const declineGroupInvite = useDeclineGroupInvite();

    const wrappedDeclineGroupInvite = React.useCallback(async () => {
      try {
        setSubmitting(true);

        await declineGroupInvite.mutateAsync({
          fid: currentUserFid,
          conversationId,
        });
      } catch (e) {
        toast.show('Unable to delete conversation', { type: 'danger' });
      } finally {
        setSubmitting(false);
        dismissAll();
        pop();
      }
    }, [
      conversationId,
      currentUserFid,
      declineGroupInvite,
      dismissAll,
      pop,
      toast,
    ]);

    const wrappedAcceptGroupInvite = async () => {
      await acceptGroupInvite.mutateAsync({
        fid: currentUserFid,
        conversationId,
      });
    };

    const handleUserPress = React.useCallback(() => {
      if (typeof inviter !== 'undefined') {
        pushToUserProfile({ fid: inviter.fid });
      }
    }, [inviter, pushToUserProfile]);

    const username = resolveUsername({
      fid: inviter?.fid,
      username: inviter?.username,
    });

    return (
      <>
        <Well style={[{ paddingHorizontal: 27 }, t.itemsCenter]}>
          <Text2 size="lg" style={[t.textCenter, t.fontSemibold]}>
            Join the conversation
          </Text2>
          {username ? (
            <Text2 size="sm" style={[t.textCenter, t.alignCenter]}>
              Accept this group invitation from{' '}
              <Pressable onPress={handleUserPress} style={[{ marginTop: -2 }]}>
                <Text2 size="sm" style={[t.fontSemibold]}>
                  {username}
                </Text2>
              </Pressable>{' '}
              to move it to your inbox.
            </Text2>
          ) : (
            <Text2 size="sm" style={[t.textCenter]}>
              Accept this group invitation to move it to your inbox.
            </Text2>
          )}
          <View
            style={[
              t.pT4,
              t.flex,
              t.flexRow,
              t.justifyBetween,
              t.itemsCenter,
              t.wFull,
              { gap: 12 },
            ]}
          >
            <View style={[t.flex1]}>
              <AtomsButton
                onPress={() => {
                  deleteModalRef.current?.present();
                }}
                hierarchy="dangerSecondary"
                size="s"
                style={[t.wFull]}
              >
                Delete
              </AtomsButton>
            </View>
            {inviter && (
              <View style={[t.flex1]}>
                <AtomsButton
                  onPress={() => {
                    reportUserBottomSheetRef.current?.present();
                  }}
                  hierarchy="overlay"
                  size="s"
                  style={[t.wFull]}
                >
                  Report
                </AtomsButton>
              </View>
            )}
            <View style={[t.flex1]}>
              <AtomsButton
                onPress={wrappedAcceptGroupInvite}
                hierarchy="primary"
                size="s"
                style={[t.wFull]}
              >
                Accept
              </AtomsButton>
            </View>
          </View>
          <BottomSheetModal
            name="declineGroupInvite"
            ref={deleteModalRef}
            handleComponent={null}
            enableDynamicSizing
          >
            <DeclineGroupInviteBottomSheet
              onCancel={() => {
                deleteModalRef.current?.dismiss();
              }}
              onDelete={wrappedDeclineGroupInvite}
              submitting={submitting}
            />
          </BottomSheetModal>
        </Well>
        {inviter && (
          <ReportUser
            ref={reportUserBottomSheetRef}
            targetUser={inviter}
            onDismiss={() => reportUserBottomSheetRef.current?.dismiss()}
            onSubmit={wrappedDeclineGroupInvite}
          />
        )}
      </>
    );
  });

const DeclineGroupInviteBottomSheet = ({
  submitting,
  onCancel,
  onDelete,
}: {
  submitting?: boolean;
  onCancel: () => void;
  onDelete: () => void;
}) => {
  const { bottom } = useSafeAreaInsets();
  const t = useTheme();

  return (
    <BottomSheetView>
      <View style={[t.p4, { minHeight: 200, paddingBottom: bottom }]}>
        <View style={[t.pY2]}>
          <Heading>Delete group chat</Heading>
        </View>
        <View style={[t.pY2]}>
          <Text2>
            Are you sure you want to leave this group chat? This is a permanent,
            and cannot be undone.
          </Text2>
        </View>
        <View
          style={[
            t.pY1,
            t.flex,
            t.flexRow,
            t.justifyBetween,
            t.itemsCenter,
            t.wFull,
            { gap: 12 },
          ]}
        >
          <View style={[t.flex1]}>
            <AtomsButton
              onPress={onCancel}
              hierarchy="overlay"
              size="l"
              style={[t.wFull]}
              disabled={submitting}
            >
              Cancel
            </AtomsButton>
          </View>
          <View style={[t.flex1]}>
            <AtomsButton
              onPress={onDelete}
              hierarchy="dangerSecondary"
              size="l"
              style={[t.wFull]}
              disabled={submitting}
            >
              Delete
            </AtomsButton>
          </View>
        </View>
      </View>
    </BottomSheetView>
  );
};

export { GroupInviteRequestDisclaimer };
