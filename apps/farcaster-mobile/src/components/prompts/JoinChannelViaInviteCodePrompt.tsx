import { BottomSheetView, useBottomSheet } from '@gorhom/bottom-sheet';
import {
  getFirstApiErrorBody,
  isHandledFetchError,
} from 'farcaster-client-data';
import { useChannel, useJoinChannelViaCode } from 'farcaster-client-hooks';
import { useRootToast } from 'farcaster-expo';
import React, { memo, useCallback, useState } from 'react';
import { View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ButtonV2 } from '~/components/ButtonV2';
import { RemoteImage } from '~/components/RemoteImage';
import { Text2 } from '~/components/Text';
import {
  joinChannelViaInviteCodePrompt,
  joinChannelViaInviteCodeRestrictedPrompt,
} from '~/constants/Storage';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { trackError } from '~/utils/ErrorUtils';

import { Prompt } from './Prompt';

const JoinChannelViaInviteCodePrompt = memo(() => {
  const { activePromptKey, hideGlobalPrompt, globalData } = useGlobalPrompts();
  const shouldPresent = useCallback(
    () => activePromptKey === joinChannelViaInviteCodePrompt,
    [activePromptKey],
  );

  return (
    <Prompt
      shouldPresent={shouldPresent}
      height={'100%'}
      storageKey={joinChannelViaInviteCodePrompt}
      onBackdropPress={hideGlobalPrompt}
      onCloseCallback={hideGlobalPrompt}
      enableDynamicSizing={true}
      enableTouchThrough={false}
      withExtraShadow={false}
    >
      <React.Suspense>
        <JoinChannelViaInviteCodePromptContent
          channelKey={globalData.joinChannelViaInviteCode?.channelKey ?? '90s'}
          inviteCode={globalData.joinChannelViaInviteCode?.inviteCode ?? ''}
        />
      </React.Suspense>
    </Prompt>
  );
});

JoinChannelViaInviteCodePrompt.displayName = 'JoinChannelViaInviteCodePrompt';

const JoinChannelViaInviteCodePromptContent = memo(
  ({ channelKey, inviteCode }: { channelKey: string; inviteCode: string }) => {
    const t = useTheme();
    const insets = useSafeAreaInsets();
    const { forceClose } = useBottomSheet();
    const { hideGlobalPrompt, showGlobalPrompt } = useGlobalPrompts();
    const toast = useRootToast();
    const navigate = useNavigate();

    const currentUser = useCurrentUser_UNSAFE();
    const joinChannelViaInviteCode = useJoinChannelViaCode();
    const { data: channel } = useChannel({
      key: channelKey,
    });

    const [submitting, setSubmitting] = useState(false);

    const accept = async () => {
      try {
        setSubmitting(true);
        await joinChannelViaInviteCode({
          channelKey,
          inviteCode,
          fid: currentUser.fid,
        });

        hideGlobalPrompt();
        forceClose();
        toast.show(`You've joined ${channel?.name}`, { type: 'success' });
        navigate('Channel', { channelKey });
      } catch (e) {
        const apiError = getFirstApiErrorBody(e);
        if (apiError && apiError.reason === 'invalid_invite_code') {
          toast.show('Invite code is no longer valid', { type: 'danger' });
          return;
        }

        if (apiError && apiError.reason === 'banned_from_channel') {
          // hack to get one global prompt to open another
          forceClose();
          hideGlobalPrompt();
          setTimeout(() => {
            showGlobalPrompt({
              key: joinChannelViaInviteCodeRestrictedPrompt,
              globalPromptData: {
                joinChannelViaInviteCode: {
                  channelKey,
                  inviteCode,
                },
              },
            });
          }, 500);
          return;
        }

        if (isHandledFetchError(e)) {
          return;
        }

        trackError(e);
      } finally {
        setSubmitting(false);
      }
    };

    const dismiss = () => {
      hideGlobalPrompt();
      forceClose();
    };

    const memberCount = channel!.memberCount ?? 1;
    const memberLabelString = memberCount > 1 ? 'members' : 'member';
    const memberCountString = memberCount.toLocaleString();

    const followerCount = channel!.followerCount ?? 1;
    const follwerLabelString = followerCount > 1 ? 'followers' : 'follower';
    const followerCountString = followerCount.toLocaleString();

    return (
      <BottomSheetView>
        <View
          style={[
            t.pX4,
            {
              minHeight: 200,
              paddingBottom: insets.bottom,
            },
          ]}
        >
          <View
            style={[
              t.pY2,
              t.pX4,
              t.flex,
              t.flexCol,
              t.itemsCenter,
              t.justifyCenter,
              { gap: 8 },
            ]}
          >
            <RemoteImage
              uri={channel!.imageUrl}
              style={[{ height: 80, width: 80 }, t.roundedFull]}
            />
            <Text2 weight="semibold" size="2xl">
              {channel!.name}
            </Text2>
            <View>
              <Text2 color="tertiary" size="sm">
                {memberCountString} {memberLabelString}
                <> · </>
                {followerCountString} {follwerLabelString}
              </Text2>
            </View>
            {channel?.description && (
              <Text2 color="secondary" align="center">
                {channel.description}
              </Text2>
            )}
          </View>
          <View style={[t.mT4, t.mB2, { gap: 8 }]}>
            <ButtonV2
              width="full"
              title={submitting ? 'Joining' : 'Join channel'}
              onPress={accept}
              disabled={submitting}
            />
            <TouchableOpacity
              style={[t.wFull, t.pY3, t.flexRow, t.justifyCenter]}
              onPress={dismiss}
            >
              <Text2 color="secondary" weight="medium" size="sm">
                Not now
              </Text2>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheetView>
    );
  },
);

export { JoinChannelViaInviteCodePrompt };
