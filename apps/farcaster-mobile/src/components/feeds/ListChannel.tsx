import { Ionicons, Octicons } from '@expo/vector-icons';
import { ApiChannel } from 'farcaster-client-data';
import {
  formatShorthandNumber,
  useGloballyCachedChannel,
} from 'farcaster-client-hooks';
import React, { FC, memo, useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';

import { ListChannelDescription } from '~/components/channels/ListChannelDescription';
import { FeedImage } from '~/components/FeedImage';
import { FeedFollowButton } from '~/components/feeds/FeedFollowButton';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';

type ListChannelProps = {
  channel: ApiChannel;
  pressable?: boolean;
  onPressCallback?: () => void;
  onPressOverride?: () => void;
  actionComponent: React.ReactElement | 'follow-button' | null;
  style?: 'default' | 'notification' | 'notification-vertical';
  onFollowCallback?: (followed: boolean) => void;
  showDescription?: boolean;
  iconStyle?: 'outline' | 'filled';
};

const ListChannel: FC<ListChannelProps> = memo(
  ({
    channel: fallbackChannel,
    pressable = true,
    onPressCallback,
    onPressOverride,
    actionComponent,
    style = 'default',
    onFollowCallback,
    showDescription = true,
    iconStyle = 'outline',
  }) => {
    const t = useTheme();
    const navigate = useNavigate();

    const channel = useGloballyCachedChannel({ fallback: fallbackChannel });

    const nameKeyFollowers = useMemo(
      () => (
        <View style={[t.flexCol, t.wFull]}>
          <View style={[t.flex, t.flexRow, t.itemsCenter]}>
            <Text
              style={[t.texts.primary, t.fontBold]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {channel.name}
            </Text>
          </View>
          {style !== 'notification-vertical' && (
            <View style={[t.flexRow, t.itemsCenter, { paddingTop: 2 }]}>
              <Text
                style={[t.texts.secondary, t.flexShrink]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                /{channel.key}
              </Text>
              <Text style={[t.texts.secondary, t.textBase, t.mX1]}>·</Text>
              {iconStyle === 'outline' ? (
                <Ionicons
                  name={'person-outline'}
                  size={12}
                  style={[t.texts.secondary, t.mR1]}
                />
              ) : (
                <Octicons
                  name={'person-fill'}
                  size={14}
                  style={[t.texts.secondary, t.mR1]}
                />
              )}
              <Text style={[t.texts.secondary, t.textBase, t.flexShrink0]}>
                {formatShorthandNumber(channel.followerCount || 0)}
              </Text>
            </View>
          )}
        </View>
      ),
      [channel, t, style, iconStyle],
    );

    const description = useMemo(() => {
      if (showDescription && channel.description) {
        return (
          <ListChannelDescription
            description={channel.description}
            descriptionMentionedUsernames={
              channel.descriptionMentionedUsernames
            }
            style={style}
          />
        );
      } else {
        return null;
      }
    }, [
      channel.description,
      channel.descriptionMentionedUsernames,
      showDescription,
      style,
    ]);

    const actionComp = useMemo(() => {
      if (actionComponent === 'follow-button') {
        return (
          <FeedFollowButton
            channel={channel}
            location="list channel"
            isViewerFollowing={channel.viewerContext.following}
            variant={style === 'notification' ? 'icon' : 'default'}
            onClickCallback={onFollowCallback}
          />
        );
      }

      return actionComponent;
    }, [channel, onFollowCallback, actionComponent, style]);

    const row = (
      <View
        style={[
          style === 'default' && [
            t.pX4,
            t.borderDefault,
            t.borderBHairline,
            t.pY3,
          ],
        ]}
      >
        <View
          style={[
            t.flexRow,
            t.justifyBetween,
            showDescription ? t.itemsStart : t.itemsCenter,
          ]}
        >
          <FeedImage
            size={style === 'notification' ? 32 : 48}
            imageUrl={channel.imageUrl}
          />
          {style === 'notification-vertical' ? (
            // There is something weird in the layout engine, without flexGrow and flexShrink,
            // on some channel (irrespective of description length) the box becomes too wide
            // and goes out of screen
            <View
              style={[t.flexCol, t.flexGrow, t.flexShrink, t.itemsStart, t.pL2]}
            >
              {nameKeyFollowers}
              {description}
              {actionComp && <View style={[t.pT2]}>{actionComp}</View>}
            </View>
          ) : (
            <View style={[t.flex1, t.flexCol, t.pL2]}>
              {actionComp ? (
                <View style={[t.flexRow, t.wFull]}>
                  <View style={[t.flex1]}>{nameKeyFollowers}</View>
                  <View style={[t.pL2]}>{actionComp}</View>
                </View>
              ) : (
                nameKeyFollowers
              )}
              {description}
            </View>
          )}
        </View>
      </View>
    );

    return pressable ? (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => {
          if (onPressOverride) {
            onPressOverride();
            return;
          }
          if (onPressCallback) {
            onPressCallback();
          }
          navigate('Channel', {
            channelKey: channel.key,
          });
        }}
      >
        {row}
      </TouchableOpacity>
    ) : (
      row
    );
  },
);

ListChannel.displayName = 'ListFeed';

export { ListChannel };
