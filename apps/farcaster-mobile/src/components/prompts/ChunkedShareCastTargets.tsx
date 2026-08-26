import { Octicons } from '@expo/vector-icons';
import { TouchableOpacity } from '@gorhom/bottom-sheet';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiShareCastTarget,
  ApiShareCastTargetGroupConversation,
  ApiShareCastTargetUser,
} from 'farcaster-client-data';
import React from 'react';
import { View } from 'react-native';

import { Avatar } from '~/components/Avatar';
import { GroupConversationImage } from '~/components/DirectCasts/GroupConversationImage';
import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { sizes, useTheme } from '~/contexts/ThemeProvider';

type ShareCastTargetProps = {
  row: number;
  targets: ApiShareCastTarget[];
  selectedTargets: (string | number)[];
  onTargetPress: ({ target }: { target: string | number }) => void;
};

const ChunkedShareCastTargets: React.FC<ShareCastTargetProps> = React.memo(
  ({ targets, onTargetPress, selectedTargets, row }) => {
    const t = useTheme();

    const { trackEvent } = useAnalytics();

    const renderUserTarget = React.useCallback(
      ({
        target,
        index,
      }: {
        target: ApiShareCastTargetUser;
        index: number;
      }) => {
        const interested =
          selectedTargets.indexOf(target.content.user.fid) !== -1;

        const canDC =
          typeof target.content.user.viewerContext?.canSendDirectCasts ===
            'undefined' ||
          target.content.user.viewerContext?.canSendDirectCasts === true;

        return (
          <TouchableOpacity
            style={[t.flex, t.flexCol, t.itemsCenter, t.justifyEvenly, t.w17]}
            activeOpacity={0.75}
            onPress={() => {
              trackEvent(AnalyticsEvent.ShareCastSelectUser, {
                fid: target.content.user.fid,
                row,
                index,
              });

              onTargetPress({ target: target.content.user.fid });
            }}
            disabled={!canDC}
          >
            <View
              style={[t.inset0, t.wFull, t.relative, !canDC && t.opacity50]}
            >
              <Avatar
                pfpUrl={target.content.user.pfp?.url}
                diameter={sizes.s17}
                shouldFadeIn={false}
                blockAnimated={true}
              />
              {interested && (
                <View
                  style={[
                    t.bgWhite,
                    t.roundedFull,
                    t.absolute,
                    t.bottom0,
                    t.right0,
                    { padding: 1.5 },
                  ]}
                >
                  <Octicons
                    name="check-circle-fill"
                    size={18}
                    style={[{ color: t.colors.actionPrimary }]}
                  />
                </View>
              )}
            </View>
            <Text
              style={[t.textXs, t.texts.primary, t.textCenter, t.mT2, t.h8]}
              numberOfLines={1}
            >
              {target.content.user.displayName}
            </Text>
          </TouchableOpacity>
        );
      },
      [
        onTargetPress,
        row,
        selectedTargets,
        t.absolute,
        t.bgWhite,
        t.bottom0,
        t.colors.actionPrimary,
        t.flex,
        t.flexCol,
        t.h8,
        t.inset0,
        t.itemsCenter,
        t.justifyEvenly,
        t.mT2,
        t.opacity50,
        t.relative,
        t.right0,
        t.roundedFull,
        t.textCenter,
        t.texts.primary,
        t.textXs,
        t.w17,
        t.wFull,
        trackEvent,
      ],
    );

    const renderGroupConversationTarget = React.useCallback(
      ({
        target,
        index,
      }: {
        target: ApiShareCastTargetGroupConversation;
        index: number;
      }) => {
        const interested =
          selectedTargets.indexOf(
            target.content.conversation.conversationId,
          ) !== -1;

        return (
          <TouchableOpacity
            style={[t.flex, t.flexCol, t.itemsCenter, t.justifyCenter, t.w17]}
            activeOpacity={0.75}
            onPress={() => {
              trackEvent(AnalyticsEvent.ShareCastSelectGroupConvo, {
                conversationId: target.content.conversation.conversationId,
                row,
                index,
              });

              onTargetPress({
                target: target.content.conversation.conversationId,
              });
            }}
          >
            <View style={[t.inset0, t.wFull, t.relative]}>
              <GroupConversationImage
                imageURL={target.content.conversation.photoUrl}
                diameter={sizes.s17}
              />
              {interested && (
                <View
                  style={[
                    t.bgWhite,
                    t.roundedFull,
                    t.absolute,
                    t.bottom0,
                    t.right0,
                    { padding: 1.5 },
                  ]}
                >
                  <Octicons
                    name="check-circle-fill"
                    size={18}
                    style={[{ color: t.colors.feed.actionPurple }]}
                  />
                </View>
              )}
            </View>
            <Text
              style={[t.textXs, t.texts.primary, t.mT2, t.textCenter, t.h8]}
              numberOfLines={1}
            >
              {target.content.conversation.name}
            </Text>
          </TouchableOpacity>
        );
      },
      [
        onTargetPress,
        row,
        selectedTargets,
        t.absolute,
        t.bgWhite,
        t.bottom0,
        t.colors.feed.actionPurple,
        t.flex,
        t.flexCol,
        t.h8,
        t.inset0,
        t.itemsCenter,
        t.justifyCenter,
        t.mT2,
        t.relative,
        t.right0,
        t.roundedFull,
        t.textCenter,
        t.texts.primary,
        t.textXs,
        t.w17,
        t.wFull,
        trackEvent,
      ],
    );

    return (
      <>
        {targets.map((target, index) => (
          <View style={[{ width: '25%' }, t.itemsCenter]} key={index}>
            <>
              {target.type === 'user' && renderUserTarget({ target, index })}
              {target.type === 'group-conversation' &&
                renderGroupConversationTarget({ target, index })}
            </>
          </View>
        ))}
      </>
    );
  },
);

ChunkedShareCastTargets.displayName = 'ChunkedShareCastTargets';

export { ChunkedShareCastTargets };
