import { BottomSheetView, useBottomSheetModal } from '@gorhom/bottom-sheet';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUser } from 'farcaster-client-data';
import {
  getNotionLinkTarget,
  useMarkInvisible,
  useTrackEvent,
} from 'farcaster-client-hooks';
import { useRootToast } from 'farcaster-expo';
import React, { useCallback, useRef, useState } from 'react';
import { Linking, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BottomSheetModal,
  useBottomSheetModalRef,
} from '~/components/BottomSheet';
import { ButtonV2 } from '~/components/ButtonV2';
import { Text } from '~/components/Text';
import { TextWithPress } from '~/components/TextWithPress';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { trackError } from '~/utils/ErrorUtils';

import { sizes, useTheme } from './ThemeProvider';

type MuteUserParams = {
  targetFid: number;
  username: string;
  source: 'direct-cast-request' | 'cast' | 'profile';
  block?: boolean;
};

export type MuteUserContextValue = {
  muteUser: (params: MuteUserParams) => Promise<{ muted: boolean }>;
};

const MuteUserContext = React.createContext<MuteUserContextValue>({
  muteUser: async () => {
    throw new Error('Must be called in MuteUserContext provider');
  },
});

type MuteUserProviderProps = {
  children: React.ReactNode;
};

export const useMuteUser = () => React.useContext(MuteUserContext);

export const MuteUserProvider: React.FC<MuteUserProviderProps> = React.memo(
  ({ children }) => {
    // Note this is used outside of auth the user may be undefined
    const user = useCurrentUser_UNSAFE();
    const [params, setParams] = useState<MuteUserParams | null>(null);
    const [muted, setMuted] = useState(false);
    const resolveRef = useRef<(value: { muted: boolean }) => void>(undefined);

    const { dismissAll } = useBottomSheetModal();
    const modalRef = useBottomSheetModalRef();
    const muteUser = useCallback(
      async (params: MuteUserParams) => {
        setParams(params);
        setMuted(false);
        modalRef.current?.present();
        return new Promise<{ muted: boolean }>((resolve) => {
          resolveRef.current = resolve;
        });
      },
      [modalRef],
    );

    const handleDismiss = () => {
      if (resolveRef.current) {
        resolveRef.current({ muted });
        resolveRef.current = undefined;
      }
    };

    return (
      <MuteUserContext.Provider value={{ muteUser }}>
        {children}

        <BottomSheetModal
          name="muteUser"
          ref={modalRef}
          onDismiss={handleDismiss}
        >
          {!!params && !!user && (
            <MuteUserBottomSheet
              key={params.targetFid}
              {...params}
              user={user}
              onCancel={() => {
                modalRef.current?.dismiss();
              }}
              onMute={() => {
                setMuted(true);
                dismissAll(); // close all modals
              }}
            />
          )}
        </BottomSheetModal>
      </MuteUserContext.Provider>
    );
  },
);

function MuteUserBottomSheet({
  user,
  targetFid,
  username,
  source,
  block,
  onCancel,
  onMute,
}: {
  user: ApiUser;
  targetFid: number;
  username: string;
  source: string;
  block?: boolean;
  onCancel: () => void;
  onMute: () => void;
}) {
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const markInvisible = useMarkInvisible();
  const [submitting, setSubmitting] = useState(false);
  const toast = useRootToast();
  const { trackEvent } = useTrackEvent();

  const mute = async () => {
    try {
      setSubmitting(true);
      await markInvisible({
        targetFid,
        viewerFid: user.fid,
        block: block ?? false,
      });
      toast.show(`${username} ${block ? 'blocked' : 'muted'}`, {
        type: 'generic',
      });
      if (block) {
        trackEvent(AnalyticsEvent.ClickBlock, {
          source,
        });
      } else {
        trackEvent(AnalyticsEvent.ClickMute, {
          source,
        });
      }
      onMute();
    } catch (e) {
      trackError(e);
      toast.show(`Failed to ${block ? 'block' : 'mute'} ${username}`, {
        type: 'danger',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheetView>
      <View
        style={[
          t.flex,
          t.flexCol,
          t.itemsStart,
          t.justifyBetween,
          t.p4,
          { paddingBottom: insets.bottom + sizes.s4 },
          // This is a quirk of dynamically sized bottom sheet views with flex displays
          { minHeight: 100 },
        ]}
      >
        <Text style={[t.texts.primary, t.fontSemibold, t.text2xl, t.mB4]}>
          {block ? 'Block' : 'Mute'} {username}?
        </Text>
        <Text style={[t.texts.secondary, t.texts.primary, t.textBase, t.mB3]}>
          {block ? (
            <>
              They won't appear in your feed and won't be able to reply, quote
              or mention you.{' '}
              <TextWithPress
                style={[t.texts.brand]}
                onPress={() => {
                  Linking.openURL(getNotionLinkTarget({ to: 'user-blocking' }));
                }}
              >
                Learn more
              </TextWithPress>
              .
            </>
          ) : (
            "They won't appear in your feed."
          )}
        </Text>
        <Text style={[t.texts.secondary, t.texts.primary, t.textBase, t.mB5]}>
          Changes may take a few minutes to be reflected.
        </Text>
        <View
          style={[
            t.flex,
            t.flexRow,
            t.justifyBetween,
            t.itemsCenter,
            t.wFull,
            { gap: 16 },
          ]}
        >
          <ButtonV2
            onPress={onCancel}
            variant="tertiary"
            title="Cancel"
            disabled={submitting}
            width="flex1"
          />
          <ButtonV2
            onPress={mute}
            variant="destructive"
            title={block ? 'Block' : 'Mute'}
            disabled={submitting}
            width="flex1"
          />
        </View>
      </View>
    </BottomSheetView>
  );
}
