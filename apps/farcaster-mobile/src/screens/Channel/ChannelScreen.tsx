import { Octicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ApiChannel } from 'farcaster-client-data';
import {
  EventingProvider,
  useChannel,
  useGloballyCachedChannel,
} from 'farcaster-client-hooks';
import React, { Suspense, useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { RetryableErrorBoundary } from '~/components/RetryableErrorBoundary';
import { buildScreen } from '~/components/Screen';
import { hitSlop } from '~/constants/Pressable';
import {
  ChannelMenuProvider,
  useChannelMenu,
} from '~/contexts/ChannelMenuProvider';
import { useOpenComposer } from '~/contexts/CreateCastComposerProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useHaptics } from '~/hooks/useHaptics';
import { ChannelScreenContent } from '~/screens/Channel/ChannelScreenContent';
import { ChannelScreenParams, HomeStackParamList } from '~/types';
import { createCastParamsWithIntent } from '~/utils/CastComposerIntentUtils';

import { ChannelHeader, StickyChannelHeader } from './ChannelHeader';

type ChannelScreenProps = NativeStackScreenProps<HomeStackParamList, 'Channel'>;

const ChannelScreen = buildScreen<ChannelScreenProps>(
  { name: 'Channel', insetTop: false },
  ({
    route: {
      params: { channelKey },
    },
  }) => {
    return (
      <EventingProvider on="channel" channel={channelKey}>
        <ChannelScreenInnerWrapped channelKey={channelKey} />
      </EventingProvider>
    );
  },
);

ChannelScreen.displayName = 'ChannelScreen';

function ChannelScreenInnerWrapped({ channelKey }: ChannelScreenParams) {
  // channel will always be present because we are suspending, ignore the type
  const { data: fetchedChannel } = useChannel({ key: channelKey });
  const channel = useGloballyCachedChannel({
    fallback: fetchedChannel as ApiChannel,
  });

  return (
    <ChannelMenuProvider channel={channel}>
      <ChannelScreenInner channel={channel} />
    </ChannelMenuProvider>
  );
}

function ChannelScreenInner({ channel }: { channel: ApiChannel }) {
  const t = useTheme();
  const openComposer = useOpenComposer();
  const { triggerImpactAsync } = useHaptics();

  const { openMenu } = useChannelMenu();
  const openFullMenu = useCallback(() => {
    openMenu('full');
  }, [openMenu]);

  const openRelationMenu = useCallback(() => {
    openMenu('relation');
  }, [openMenu]);

  const canCast =
    channel.viewerContext.isMember || Boolean(channel.publicCasting);

  const scrollOffset = useSharedValue(0);
  const fixedHeaderHeight = useSharedValue(0); // initial estimate
  const stickyHeaderHeight = useSharedValue(0); // initial estimate

  return (
    <>
      <View style={[t.hFull, t.relative]}>
        <RetryableErrorBoundary>
          <Suspense
            fallback={<FullScreenLoadingIndicator debugName="ChannelScreen" />}
          >
            <StickyChannelHeader
              channel={channel}
              openMenu={openFullMenu}
              scrollOffset={scrollOffset}
              headerHeight={stickyHeaderHeight}
            />
            <ChannelScreenContent
              feedKey={channel.key}
              feeds={channel?.feeds}
              showCastSourceLabels={channel?.showCastSourceLabels || false}
              offsetToContent={channel?.viewerContext?.following}
              scrollOffset={scrollOffset}
              stickyHeaderHeight={stickyHeaderHeight}
              fixedHeaderHeight={fixedHeaderHeight}
              Header={
                <ChannelHeader
                  channel={channel}
                  openMenu={openRelationMenu}
                  headerHeight={fixedHeaderHeight}
                />
              }
            />
          </Suspense>
        </RetryableErrorBoundary>
        {canCast && (
          <Pressable
            style={[
              t.absolute,
              t.bottom0,
              t.right0,
              t.mB3,
              t.mR2,
              t.bgAction,
              t.roundedFull,
              t.justifyCenter,
              t.itemsCenter,
              { width: 56, height: 56 },
              {
                shadowColor: '#000',
                shadowOpacity: 0.3,
                shadowOffset: { width: 1, height: 1 },
                shadowRadius: 2,
              },
            ]}
            hitSlop={hitSlop}
            onPress={() => {
              triggerImpactAsync();

              if (channel?.type === 'channel') {
                openComposer(
                  createCastParamsWithIntent({
                    channelKey: channel.key,
                  }),
                );
              } else {
                openComposer({});
              }
            }}
          >
            <Octicons name="pencil" size={24} style={[t.texts.light]} />
          </Pressable>
        )}
      </View>
    </>
  );
}

export { ChannelScreen, ChannelScreenInner };
