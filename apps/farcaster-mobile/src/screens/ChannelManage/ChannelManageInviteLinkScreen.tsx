import { Octicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import { AnalyticsEvent } from 'farcaster-analytics';
import { getWarpcastInviteUrl } from 'farcaster-client-data';
import {
  useChannel,
  useResetChannelInviteCode,
  useTrackEvent,
} from 'farcaster-client-hooks';
import { useRootToast } from 'farcaster-expo';
import React, { useState } from 'react';
import { Pressable, ScrollView, TouchableOpacity, View } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { CommonStackParamList } from '~/types';
import { trackError } from '~/utils/ErrorUtils';

type ChannelManageInviteLinkScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'ChannelManageInviteLink'
>;

const ChannelManageInviteLinkScreen =
  buildScreen<ChannelManageInviteLinkScreenProps>(
    { name: 'ChannelManageInviteLink', insetTop: false, avoidKeyboard: true },
    ({
      route: {
        params: { channelKey },
      },
    }) => {
      const t = useTheme();
      const toast = useRootToast();
      const { trackEvent } = useTrackEvent();

      const { data: channel } = useChannel({ key: channelKey });
      const resetChannelInviteCode = useResetChannelInviteCode();

      const [resetting, setResetting] = useState(false);
      const inviteUrl = getWarpcastInviteUrl({
        channelKey: channel!.key,
        inviteCode: channel!.inviteCode ?? '',
      });

      const copy = async () => {
        trackEvent(AnalyticsEvent.CopyChannelInviteLink, { channelKey });
        await Clipboard.setStringAsync(inviteUrl);
        toast.show('Link copied to clipboard');
      };

      const resetInviteCode = async () => {
        try {
          setResetting(true);
          await resetChannelInviteCode({ channelKey });
          toast.show('Invite link was reset');
        } catch (e) {
          trackError(new Error('Failed to update invite code', { cause: e }));
          toast.show('Failed to reset link', {
            type: 'danger',
          });
        } finally {
          setResetting(false);
        }
      };

      // temporary disable, will revisit the bottom sheet later
      const enableShare = false;

      return (
        <ScrollView style={[t.hFull]}>
          <View
            style={[
              t.mX4,
              t.mT3,
              t.border,
              t.borderDesignSystemDefault,
              t.roundedLg,
            ]}
          >
            <TouchableOpacity
              style={[
                t.flexRow,
                t.itemsCenter,
                t.justifyBetween,
                t.pY2,
                t.pX3,
                { gap: 8 },
              ]}
              activeOpacity={0.5}
              onPress={copy}
            >
              <View style={[t.flexShrink]}>
                <Text2 weight="medium" size="sm">
                  Share invite link
                </Text2>
                <Text2 color="secondary" size="xs" style={{ marginTop: 2 }}>
                  Share with people you trust. Avoid posting publicly.
                </Text2>
              </View>
              <View>
                <Octicons name="copy" size={17} color={t.colors.text.primary} />
              </View>
            </TouchableOpacity>
          </View>
          <View style={[t.p4]}>
            {enableShare && (
              <TouchableOpacity style={[t.borderDefault, { gap: 8 }]}>
                <View style={[t.flexRow, t.itemsCenter, { gap: 8 }, t.pY2]}>
                  <View
                    style={[
                      t.justifyCenter,
                      t.itemsCenter,
                      t.bgElevated,
                      t.roundedFull,
                      { height: 40, width: 40 },
                    ]}
                  >
                    <Octicons
                      name="share"
                      size={20}
                      color={t.colors.text.primary}
                    />
                  </View>
                  <Text2 weight="medium">Share</Text2>
                </View>
              </TouchableOpacity>
            )}
            <Pressable
              style={({ pressed }) => [
                t.borderDefault,
                {
                  gap: 8,
                  opacity: resetting || pressed ? 0.3 : 1,
                },
              ]}
              onPress={resetInviteCode}
              disabled={resetting}
            >
              <View style={[t.flexRow, t.itemsCenter, { gap: 8 }, t.pY2]}>
                <View
                  style={[
                    t.justifyCenter,
                    t.itemsCenter,
                    t.bgElevated,
                    t.roundedFull,
                    { height: 40, width: 40 },
                  ]}
                >
                  <Octicons
                    name="sync"
                    size={20}
                    color={t.colors.text.primary}
                  />
                </View>
                <Text2 weight="medium">Reset link</Text2>
              </View>
            </Pressable>
          </View>
        </ScrollView>
      );
    },
  );

ChannelManageInviteLinkScreen.displayName = 'ChannelManageInviteLinkScreen';

export { ChannelManageInviteLinkScreen };
