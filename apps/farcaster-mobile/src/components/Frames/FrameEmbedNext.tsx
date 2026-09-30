import { Octicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import {
  ApiFrameEmbedNextExtended,
  preserveQueryParams,
} from 'farcaster-client-data';
import {
  useGloballyCachedFrame,
  useNonSuspenseFrameDetails,
} from 'farcaster-client-hooks';
import { RotateCwIcon } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { GestureResponderEvent, Pressable, View } from 'react-native';

import { Text2 } from '~/components/Text';
import { imageRequestHeaders } from '~/constants/Images';
import { ConnectedWalletProvider } from '~/contexts/ConnectWalletProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useHaptics } from '~/hooks/useHaptics';
import { LaunchContext, useLaunchFrame } from '~/hooks/useLaunchFrame';
import { useViewToken } from '~/hooks/useViewToken';

const BORDER_RADIUS = 12;

type FeedFrameAttachmentProps = {
  frameEmbed: ApiFrameEmbedNextExtended;
  context: LaunchContext;
  disabled?: boolean;
  debug?: boolean;
  refreshable?: boolean;
  onRefreshPress?: () => void;
  onLaunchMiniApp?: () => void;
  height?: number;
  width?: number;
};

export const FrameEmbedNext: React.FC<FeedFrameAttachmentProps> = React.memo(
  (props) => {
    const domain = useMemo(() => {
      try {
        return new URL(props.frameEmbed.frameUrl).hostname;
      } catch {
        return '';
      }
    }, [props.frameEmbed.frameUrl]);
    const { data: frameDetailsData } = useNonSuspenseFrameDetails({
      domain,
      enabled: !!domain,
    });
    const frameDetails = useGloballyCachedFrame(frameDetailsData);

    if (frameDetails?.harmful && !props.debug) {
      return null;
    }

    if (props.disabled) {
      return <FrameEmbedShell {...props} />;
    }

    return (
      <ConnectedWalletProvider>
        <FrameEmbedNextInner {...props} harmful={frameDetails?.harmful} />
      </ConnectedWalletProvider>
    );
  },
);

const RefreshButton = ({ onRefreshPress }: { onRefreshPress: () => void }) => {
  const [refreshed, setRefreshed] = useState(false);
  const t = useTheme();
  const refresh = useCallback(
    (e: GestureResponderEvent) => {
      e.stopPropagation();
      setRefreshed(true);
      onRefreshPress();

      setTimeout(() => {
        setRefreshed(false);
      }, 2000);
    },
    [onRefreshPress],
  );

  return (
    <Pressable
      onPress={refresh}
      style={[
        t.absolute,
        t.roundedFull,
        t.bgMuted,
        t.justifyCenter,
        t.itemsCenter,
        {
          right: 4,
          top: 4,
          height: 24,
          width: 24,
        },
      ]}
    >
      {refreshed ? (
        <Octicons name="check" size={12} style={t.texts.success} />
      ) : (
        <RotateCwIcon size={12} style={t.texts.primary} />
      )}
    </Pressable>
  );
};

function FrameEmbedNextInner({
  frameEmbed: frameEmbedExtended,
  context,
  disabled,
  debug,
  harmful,
  refreshable,
  onRefreshPress,
  onLaunchMiniApp,
  height,
  width,
}: FeedFrameAttachmentProps & { harmful?: boolean }) {
  const t = useTheme();
  const launchFrame = useLaunchFrame();
  const viewToken = useViewToken();
  const { triggerImpactAsync } = useHaptics();

  const { frameUrl, frameEmbed } = frameEmbedExtended;
  const aspectRatio = 1.5;

  const handleActionPress = useCallback(() => {
    if (disabled) {
      return;
    }

    triggerImpactAsync();

    const action = frameEmbed?.button?.action;
    if (action?.type === 'launch_frame' || action?.type === 'launch_miniapp') {
      if (onLaunchMiniApp) {
        onLaunchMiniApp();
      } else {
        launchFrame({
          context,
          config: {
            ...action,
            url: action.url
              ? preserveQueryParams({
                  launchUrl: action.url,
                  sourceUrl: frameUrl,
                })
              : frameUrl,
          },
          author: frameEmbedExtended.author,
          harmful,
          debug,
        });
      }
    } else if (action?.type === 'view_token') {
      viewToken({
        url: frameUrl,
        token: action?.token,
      });
    }
  }, [
    context,
    debug,
    disabled,
    frameEmbed?.button?.action,
    frameEmbedExtended.author,
    frameUrl,
    harmful,
    launchFrame,
    onLaunchMiniApp,
    triggerImpactAsync,
    viewToken,
  ]);

  const handleImagePress = useCallback(() => {
    if (disabled) {
      return;
    }

    handleActionPress();
  }, [disabled, handleActionPress]);

  return (
    <Pressable
      style={[
        t.border,
        t.borderDesignSystemDefault,
        {
          borderRadius: BORDER_RADIUS,
          overflow: 'hidden',
          width,
        },
      ]}
      onPress={handleImagePress}
    >
      <View
        style={[
          {
            borderTopLeftRadius: BORDER_RADIUS,
            borderTopRightRadius: BORDER_RADIUS,
            borderBottomWidth: 0,
          },
        ]}
      >
        <Image
          recyclingKey={frameEmbed?.imageUrl}
          cachePolicy="memory"
          source={{
            uri: frameEmbed?.imageUrl, // todo proxy
            headers: imageRequestHeaders,
          }}
          contentFit="cover"
          contentPosition="center"
          style={[
            {
              height: typeof height !== 'undefined' ? height - 40 : undefined,
              aspectRatio,
            },
          ]}
          onError={() => {
            // report
          }}
        />
      </View>
      {refreshable && onRefreshPress && (
        <RefreshButton onRefreshPress={onRefreshPress} />
      )}
      <Pressable
        style={[
          t.bgDefault,
          t.pX3,
          t.flexRow,
          t.itemsCenter,
          t.justifyCenter,
          t.dark ? t.backgrounds.secondary : t.backgrounds.brandLight,
          disabled ? t.opacity50 : null,
          {
            height: 40,
          },
        ]}
        onPress={handleActionPress}
      >
        <Text2
          weight="semibold"
          size="sm"
          style={[
            {
              color: t.dark ? t.colors.text.primary : t.colors.text.brand,
            },
          ]}
        >
          {frameEmbed?.button?.title}
        </Text2>
      </Pressable>
    </Pressable>
  );
}

function FrameEmbedShell({
  frameEmbed: frameEmbedExtended,
  disabled,
  refreshable,
  onRefreshPress,
  height,
  width,
}: FeedFrameAttachmentProps) {
  const t = useTheme();

  const { frameEmbed } = frameEmbedExtended;

  const aspectRatio = 1.5;

  return (
    <View
      style={[
        t.border,
        t.borderDesignSystemDefault,
        {
          borderRadius: BORDER_RADIUS,
          overflow: 'hidden',
          width,
        },
      ]}
    >
      <View
        style={[
          {
            borderTopLeftRadius: BORDER_RADIUS,
            borderTopRightRadius: BORDER_RADIUS,
            borderBottomWidth: 0,
          },
        ]}
      >
        <Image
          recyclingKey={frameEmbed?.imageUrl}
          cachePolicy="memory"
          source={{
            uri: frameEmbed?.imageUrl, // todo proxy
            headers: imageRequestHeaders,
          }}
          contentFit="cover"
          contentPosition="center"
          style={[
            {
              height: typeof height !== 'undefined' ? height - 40 : undefined,
              aspectRatio,
            },
          ]}
          onError={() => {
            // report
          }}
        />
      </View>
      {refreshable && onRefreshPress && (
        <RefreshButton onRefreshPress={onRefreshPress} />
      )}
      <View
        style={[
          t.bgDefault,
          t.pX3,
          t.flexRow,
          t.itemsCenter,
          t.justifyCenter,
          t.dark ? t.backgrounds.secondary : t.backgrounds.brandLight,
          disabled ? t.opacity50 : null,
          {
            height: 40,
          },
        ]}
      >
        <Text2
          weight="semibold"
          size="sm"
          style={[
            {
              color: t.dark ? t.colors.text.primary : t.colors.text.brand,
            },
          ]}
        >
          {frameEmbed?.button?.title}
        </Text2>
      </View>
    </View>
  );
}
