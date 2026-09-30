import { ApiDirectCastConversationInfoV3 } from 'farcaster-client-data';
import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { Dimensions, TouchableOpacity, View } from 'react-native';

import { useTopBar } from '~/components/TopBar';
import { useTheme } from '~/contexts/ThemeProvider';
import { useGoBack } from '~/hooks/navigation/useGoBack';

import { PlaintextDirectCastsConversationHeader } from './PlaintextDirectCastsConversationHeader';
import { PlaintextDirectCastsConversationHeaderActions } from './PlaintextDirectCastsConversationHeaderActions';

type ConversationScreenHeaderProps = {
  conversation?: ApiDirectCastConversationInfoV3;
  viewerCanInviteToGroup: boolean;
};

const ConversationScreenHeader: React.FC<ConversationScreenHeaderProps> = ({
  conversation,
  viewerCanInviteToGroup,
}) => {
  const t = useTheme();
  const goBack = useGoBack();

  const conversationIsNotARequest =
    conversation?.viewerContext.category !== 'request';

  const { topBar } = useTopBar({
    leftIcon: (
      <View style={[t.flexRow, t.itemsCenter]}>
        <TouchableOpacity
          onPress={goBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={[
            {
              marginLeft: -8,
              paddingHorizontal: 4,
              zIndex: 2,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={24} color={t.colors.text.primary} />
        </TouchableOpacity>
        <View
          // allow touches to pass through this view to the back button below
          pointerEvents={'box-none'}
          style={[
            {
              position: 'absolute',
              // negative alignment here counters topBar padding
              // TODO: fix this in the TopBar component
              left: -16,
              // 30 padding is the icon edge aligned to the back button, gutter of 16
              paddingLeft: 30 + 16,
              top: 0,
              bottom: 0,
              width: Dimensions.get('window').width,
              justifyContent: 'center',
            },
            t.itemsCenter,
          ]}
        >
          {conversation && (
            <PlaintextDirectCastsConversationHeader
              conversationActiveParticipantsCount={
                conversation.activeParticipantsCount ?? 0
              }
              conversationCounterParty={conversation.viewerContext.counterParty}
              conversationId={conversation.conversationId}
              conversationIsGroup={conversation.isGroup ?? false}
              conversationIsMuted={conversation.viewerContext.muted ?? false}
              conversationName={conversation.name}
              conversationPhotoUrl={conversation.photoUrl}
            />
          )}
        </View>
      </View>
    ),
    // bit of a hack to make the TopBar component work with our left aligned content
    // TODO: fix this in the TopBar component
    title: <View />,
    rightIcon:
      conversation && conversationIsNotARequest ? (
        <PlaintextDirectCastsConversationHeaderActions
          conversationId={conversation.conversationId}
          viewerCanInviteToGroup={viewerCanInviteToGroup}
        />
      ) : undefined,
  });

  return topBar;
};

export { ConversationScreenHeader };
