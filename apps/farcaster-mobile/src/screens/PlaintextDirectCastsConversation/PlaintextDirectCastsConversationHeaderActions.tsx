import { AnalyticsEvent } from 'farcaster-analytics';
import { useDirectCastConversation } from 'farcaster-client-hooks';
import React from 'react';
import { Keyboard, TouchableOpacity, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';

import { AddMembersIcon } from '~/components/DirectCasts/AddMembersIcon';
import { directCastInvitePromptKey } from '~/constants/Storage';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';
import { useHaptics } from '~/hooks/useHaptics';

const ConversationInfoIcon: React.FC = React.memo(() => {
  const t = useTheme();

  return (
    <Svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <Path
        d="M14.083 8.125C14.083 8.72331 13.598 9.20833 12.9997 9.20833C12.4014 9.20833 11.9163 8.72331 11.9163 8.125C11.9163 7.52669 12.4014 7.04167 12.9997 7.04167C13.598 7.04167 14.083 7.52669 14.083 8.125Z"
        fill={t.colors.text.primary}
      />
      <Path
        d="M10.833 12.1875C10.833 11.7388 11.1968 11.375 11.6455 11.375H13.2705C13.7192 11.375 14.083 11.7388 14.083 12.1875V16.7917H14.8955C15.3442 16.7917 15.708 17.1554 15.708 17.6042C15.708 18.0529 15.3442 18.4167 14.8955 18.4167H11.6455C11.1968 18.4167 10.833 18.0529 10.833 17.6042C10.833 17.1554 11.1968 16.7917 11.6455 16.7917H12.458V13H11.6455C11.1968 13 10.833 12.6362 10.833 12.1875Z"
        fill={t.colors.text.primary}
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.9997 1.08333C6.41828 1.08333 1.08301 6.41861 1.08301 13C1.08301 19.5814 6.41828 24.9167 12.9997 24.9167C19.5811 24.9167 24.9163 19.5814 24.9163 13C24.9163 6.41861 19.5811 1.08333 12.9997 1.08333ZM2.70801 13C2.70801 7.31607 7.31574 2.70833 12.9997 2.70833C18.6836 2.70833 23.2913 7.31607 23.2913 13C23.2913 18.6839 18.6836 23.2917 12.9997 23.2917C7.31574 23.2917 2.70801 18.6839 2.70801 13Z"
        fill={t.colors.text.primary}
      />
    </Svg>
  );
});

const PlaintextDirectCastsConversationHeaderActions = React.memo(
  ({
    conversationId,
    viewerCanInviteToGroup,
  }: {
    conversationId: string;
    viewerCanInviteToGroup: boolean;
  }) => {
    const t = useTheme();
    const push = usePush();
    const { trackEvent } = useAnalytics();
    const { showGlobalPrompt } = useGlobalPrompts();
    const { triggerImpactAsync } = useHaptics();
    const { data: conversation } = useDirectCastConversation({
      conversationId,
    });
    const conversationIsGroup = conversation?.isGroup;

    const onPressDetails = React.useCallback(() => {
      triggerImpactAsync();

      push('DirectCastsConversationDetailsScreen', {
        conversationId: conversationId,
      });
    }, [conversationId, push, triggerImpactAsync]);

    const onPressInvite = React.useCallback(() => {
      triggerImpactAsync();

      trackEvent(AnalyticsEvent.PressDirectCastsInviteButton, undefined);

      // hide keyboard before showing prompt
      Keyboard.dismiss();

      showGlobalPrompt({
        key: directCastInvitePromptKey,
        globalPromptData: { directCastInvite: { conversationId } },
      });
    }, [conversationId, showGlobalPrompt, trackEvent, triggerImpactAsync]);

    if (conversationIsGroup && viewerCanInviteToGroup) {
      return (
        <View style={[t.flex, t.flexRow, t.itemsCenter, { gap: 16 }]}>
          <TouchableOpacity
            style={[
              t.relative,
              t.roundedLg,
              t.flex,
              t.itemsCenter,
              t.justifyCenter,
              {
                width: 28,
                height: 28,
              },
            ]}
            hitSlop={{ bottom: 12, top: 12, right: 12, left: 8 }}
            activeOpacity={0.5}
            onPress={onPressInvite}
          >
            <AddMembersIcon size={26} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              t.relative,
              t.roundedLg,
              t.flex,
              t.itemsCenter,
              t.justifyCenter,
              {
                width: 28,
                height: 28,
              },
            ]}
            hitSlop={{ bottom: 12, top: 12, right: 12, left: 8 }}
            activeOpacity={0.5}
            onPress={onPressDetails}
          >
            <ConversationInfoIcon />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={[t.flex, t.flexRow, t.itemsCenter, { gap: 16 }]}>
        <TouchableOpacity
          style={[
            t.relative,
            t.roundedLg,
            t.flex,
            t.itemsCenter,
            t.justifyCenter,
            {
              width: 28,
              height: 28,
            },
          ]}
          hitSlop={{ bottom: 12, top: 12, right: 12, left: 8 }}
          activeOpacity={0.5}
          onPress={onPressDetails}
        >
          <ConversationInfoIcon />
        </TouchableOpacity>
      </View>
    );
  },
);

PlaintextDirectCastsConversationHeaderActions.displayName =
  'PlaintextDirectCastsConversationHeaderActions';

export { PlaintextDirectCastsConversationHeaderActions };
