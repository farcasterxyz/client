import { ApiUser } from 'farcaster-client-data';
import {
  useAlterPlaintextDirectCastConversationCategory,
  useTrackEvent,
} from 'farcaster-client-hooks';
import { AtomsButton } from 'farcaster-expo';
import React from 'react';
import { View } from 'react-native';

import { useBottomSheetModalRef } from '~/components/BottomSheet';
import { Text2 } from '~/components/Text';
import { ReportUser } from '~/components/users/ReportUser';
import { Well } from '~/components/Well';
import { useManageDirectCastConversation } from '~/contexts/ManageDirectCastConversationProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { usePop } from '~/hooks/navigation/usePop';

type MessageRequestDisclaimersProps = {
  conversationId: string;
  counterParty: ApiUser;
  category: 'request' | 'void';
};

const MessageRequestDisclaimers: React.FC<MessageRequestDisclaimersProps> =
  React.memo(({ conversationId, counterParty, category }) => {
    const { fid: currentUserFid } = useCurrentUser_UNSAFE();
    const t = useTheme();
    const pop = usePop();
    const { trackEvent } = useTrackEvent();
    const { deleteConversation } = useManageDirectCastConversation();

    const reportUserBottomSheetRef = useBottomSheetModalRef();

    const alterConversationCategory =
      useAlterPlaintextDirectCastConversationCategory();

    const wrappedDeleteConversation = async () => {
      const { deleted } = await deleteConversation({
        conversationId,
      });

      if (deleted) {
        trackEvent({
          name: 'reject direct cast request',
          props: {
            conversationId: conversationId,
            action: 'delete',
            via: 'conversation view',
          },
        });

        pop();
      }
    };

    const onAccept = async () => {
      await alterConversationCategory({
        fid: currentUserFid,
        conversationId,
        fromCategory: category,
        toCategory: 'default',
      });
    };

    const disclaimerText =
      category === 'void'
        ? 'This message was hidden. Accept to move it to your inbox.'
        : 'Accept or reply to this request to move it to your inbox.';

    return (
      <>
        <Well style={[{ paddingHorizontal: 27 }, t.itemsCenter]}>
          <Text2 size="sm" style={[t.textCenter]}>
            {disclaimerText}
          </Text2>
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
                size="s"
                hierarchy="danger"
                onPress={wrappedDeleteConversation}
              >
                Delete
              </AtomsButton>
            </View>
            <View style={[t.flex1]}>
              <AtomsButton
                size="s"
                hierarchy="overlay"
                onPress={() => {
                  reportUserBottomSheetRef.current?.present();
                }}
              >
                Report
              </AtomsButton>
            </View>
            <View style={[t.flex1]}>
              <AtomsButton onPress={onAccept} hierarchy="primary" size="s">
                Accept
              </AtomsButton>
            </View>
          </View>
        </Well>
        <ReportUser
          ref={reportUserBottomSheetRef}
          targetUser={counterParty}
          onDismiss={() => reportUserBottomSheetRef.current?.dismiss()}
          onSubmit={wrappedDeleteConversation}
        />
      </>
    );
  });

export { MessageRequestDisclaimers };
