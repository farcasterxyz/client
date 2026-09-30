import { Ionicons } from '@expo/vector-icons';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiWalletActivityNotificationGroup } from 'farcaster-client-data';
import {
  formatTimeAgo,
  resolveUsernameShort,
  useTrackEvent,
} from 'farcaster-client-hooks';
import React, { FC, memo, useCallback, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { formatUnits } from 'viem';

import { Avatar } from '~/components/Avatar';
import { Text2 } from '~/components/Text';
import { TextWithPress } from '~/components/TextWithPress';
import { hitSlop } from '~/constants/Pressable';
import { useTheme } from '~/contexts/ThemeProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';

import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';

type WalletActivityNotificationGroupProps = {
  group: ApiWalletActivityNotificationGroup;
};

const WalletActivityNotificationGroup: FC<WalletActivityNotificationGroupProps> =
  memo(({ group }) => {
    const t = useTheme();

    const pushToUserProfile = usePushToUserProfile();
    const navigate = useNavigate();
    const { trackEvent } = useTrackEvent();

    const user = useMemo(() => {
      for (const item of group.previewItems) {
        if ('fromUser' in item.content && item.content.fromUser) {
          return item.content.fromUser;
        }
      }
      return null;
    }, [group.previewItems]);

    const handlePress = useCallback(() => {
      navigate('WalletActivity', {});
    }, [navigate]);

    const message = useMemo(() => {
      const item = group.previewItems[0];
      switch (item.content.type) {
        case 'mint':
          return (
            <Text2 numberOfLines={1}>
              <Text2>You minted </Text2>
              <Text2 weight="semibold">{item.content.token.name}</Text2>
            </Text2>
          );
        case 'receive': {
          const address =
            item.content.fromAddress.substring(0, 6) +
            '...' +
            item.content.fromAddress.substring(
              item.content.fromAddress.length - 4,
            );

          const amount = parseFloat(
            formatUnits(
              BigInt(item.content.amount),
              item.content.token.decimals ?? 18,
            ),
          );

          let amountDisplay = amount.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          });
          if (amount < 0.01) {
            amountDisplay = amount.toFixed(6);
          } else if (amount < 1) {
            amountDisplay = amount.toFixed(4);
          } else if (amount < 100) {
            amountDisplay = amount.toFixed(2);
          }

          return (
            <Text2 numberOfLines={1}>
              {user ? (
                <TextWithPress
                  style={[t.texts.primary, t.fontBold]}
                  onPress={() => {
                    trackEvent(AnalyticsEvent.ClickNotification, {
                      type: group.id,
                      action: 'actor',
                    });

                    pushToUserProfile({ fid: user.fid });
                  }}
                >
                  {resolveUsernameShort(user)}
                </TextWithPress>
              ) : (
                <Text2 weight="semibold">{address}</Text2>
              )}
              <Text2> sent you </Text2>
              <Text2 weight="bold">{`${amountDisplay} ${item.content.token.ticker}`}</Text2>
            </Text2>
          );
        }
      }
    }, [
      group.id,
      group.previewItems,
      pushToUserProfile,
      t.fontBold,
      t.texts.primary,
      trackEvent,
      user,
    ]);

    const viewUser = useCallback(() => {
      if (user) {
        pushToUserProfile({ fid: user.fid });
      }
    }, [pushToUserProfile, user]);

    return (
      <NotificationGroupOuterContainer group={group} onPress={handlePress}>
        <Pressable onPress={viewUser} hitSlop={hitSlop}>
          {user?.pfp?.url ? (
            <View>
              <Avatar
                pfpUrl={user?.pfp?.url}
                shouldFadeIn={true}
                isHighlighted={true}
              />
              <View
                style={[
                  t.absolute,
                  t.bottom0,
                  t.right0,
                  t.roundedFull,
                  t.borderBackground,
                  {
                    borderWidth: 2,
                    marginRight: -2,
                    marginBottom: -2,
                  },
                ]}
              >
                <View
                  style={[
                    t.roundedFull,
                    t.bgFaint,
                    {
                      width: 16,
                      height: 16,
                      paddingTop: 2,
                      paddingLeft: 2,
                      backgroundColor: t.colors.feed.actionPurpleMuted,
                    },
                  ]}
                >
                  <Ionicons
                    name="wallet-outline"
                    size={12}
                    color={t.colors.feed.actionPurple}
                  />
                </View>
              </View>
            </View>
          ) : (
            <View
              style={[
                t.flexRow,
                t.itemsCenter,
                t.justifyCenter,
                t.roundedFull,
                t.bgFaint,
                { width: 40, height: 40 },
              ]}
            >
              <Ionicons
                name="wallet-outline"
                size={20}
                color={t.colors.text.secondary}
              />
            </View>
          )}
        </Pressable>
        <NotificationGroupInnerContainer>
          <View style={[t.flexCol, { gap: 2 }]}>
            <View style={[t.flexRow, t.justifyBetween, t.itemsStart, t.wFull]}>
              <View style={[t.flexShrink]}>{message}</View>
              <Text2 color="tertiary">
                {formatTimeAgo(group.previewItems[0].timestamp, 'floor')}
              </Text2>
            </View>
            <Text2 color="secondary">View funds in your Farcaster wallet</Text2>
          </View>
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  });

WalletActivityNotificationGroup.displayName = 'WalletActivityNotificationGroup';

export { WalletActivityNotificationGroup };
