import {
  renderChannelKey,
  useChannel,
  useCreateFeedFollow,
} from 'farcaster-client-hooks';
import { useRootToast } from 'farcaster-expo';
import React, { Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

import {
  BottomSheetContentContainer,
  BottomSheetModal,
  useBottomSheetModalRef,
} from '~/components/BottomSheet';
import { ButtonV2 } from '~/components/ButtonV2';
import { ConfirmBottomSheetProps } from '~/components/ConfirmActionBottomSheet';
import { LoadingIndicator } from '~/components/LoadingIndicator';
import { RemoteImage } from '~/components/RemoteImage';
import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

type FollowChannelParams = {
  key: string;
};

type FollowChannelState = FollowChannelParams & {
  resolve: (value: { followed: boolean }) => void;
  reject: (e: Error) => void;
};

export type FollowChannelContextValue = {
  followChannel: (
    params: FollowChannelParams,
  ) => Promise<{ followed: boolean }>;
};

const FollowChannelContext = React.createContext<FollowChannelContextValue>({
  followChannel: async () => {
    throw new Error('Must be called in FollowChannelContext provider');
  },
});

type FollowChannelProviderProps = {
  children: React.ReactNode;
};

export const useFollowChannel = () => React.useContext(FollowChannelContext);

export const FollowChannelProvider: React.FC<FollowChannelProviderProps> =
  React.memo(({ children }) => {
    const [params, setParams] = useState<FollowChannelState | null>(null);
    const modalRef = useBottomSheetModalRef();
    const followedRef = useRef(false);
    const followChannel = useCallback(
      async (params: FollowChannelParams) => {
        return new Promise<{ followed: boolean }>((resolve, reject) => {
          setParams({
            ...params,
            resolve,
            reject,
          });
          followedRef.current = false;
          modalRef.current?.present();
        });
      },
      [modalRef],
    );

    const handleDismiss = () => {
      params?.resolve({ followed: followedRef.current });
    };

    // TODO better error boundary and no data states
    return (
      <FollowChannelContext.Provider
        value={useMemo(() => ({ followChannel }), [followChannel])}
      >
        {children}

        <BottomSheetModal
          name="confirmFollowChannel"
          ref={modalRef}
          onDismiss={handleDismiss}
        >
          <Suspense fallback={<LoadingIndicator />}>
            {!!params && (
              <ConfirmFollowChannelBottomSheet
                key={params.key}
                channelKey={params.key}
                onCancel={() => {
                  modalRef.current?.forceClose();
                }}
                onConfirm={() => {
                  followedRef.current = true;
                  modalRef.current?.forceClose();
                }}
              />
            )}
          </Suspense>
        </BottomSheetModal>
      </FollowChannelContext.Provider>
    );
  });

function ConfirmFollowChannelBottomSheet({
  channelKey,
  onConfirm,
  ...rest
}: ConfirmBottomSheetProps<{ channelKey: string }>) {
  const t = useTheme();
  const toast = useRootToast();
  const { data: channel } = useChannel({ key: channelKey });
  const followChannel = useCreateFeedFollow();
  const [submitting, setSubmitting] = useState(false);

  const wrappedOnConfirm = useCallback(async () => {
    try {
      setSubmitting(true);
      followChannel({
        feedKey: channelKey,
        location: 'farcaster action',
      });
      onConfirm();
    } catch {
      // TODO not showing?
      toast.show('Failed to follow channel', { type: 'danger' });
      rest.onCancel();
    } finally {
      setSubmitting(false);
    }
  }, [followChannel, channelKey, onConfirm, toast, rest]);

  const memberCount = channel!.memberCount ?? 1;
  const memberLabelString = memberCount > 1 ? 'members' : 'member';
  const memberCountString = memberCount.toLocaleString();

  const followerCount = channel!.followerCount ?? 1;
  const follwerLabelString = followerCount > 1 ? 'followers' : 'follower';
  const followerCountString = followerCount.toLocaleString();

  return (
    <BottomSheetContentContainer>
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
      {channel.viewerContext.following ? (
        <View style={[t.mT4, { gap: 24 }]}>
          <Text2 size="lg" align="center">
            You are already following {renderChannelKey(channel.key)}
          </Text2>
          <ButtonV2
            title="Continue"
            variant={'primary'}
            onPress={onConfirm}
            width="full"
          />
        </View>
      ) : (
        <View style={[t.mT4, t.mB2, { gap: 24 }]}>
          <Text2 size="lg" align="center">
            Do you want to follow {renderChannelKey(channel.key)}?
          </Text2>
          <ButtonV2
            width="full"
            title={'Follow'}
            onPress={wrappedOnConfirm}
            disabled={submitting}
          />
          <TouchableOpacity
            style={[t.wFull, t.pY3, t.flexRow, t.justifyCenter]}
            onPress={rest.onCancel}
          >
            <Text2 color="secondary" weight="medium" size="sm">
              Cancel
            </Text2>
          </TouchableOpacity>
        </View>
      )}
    </BottomSheetContentContainer>
  );
}
