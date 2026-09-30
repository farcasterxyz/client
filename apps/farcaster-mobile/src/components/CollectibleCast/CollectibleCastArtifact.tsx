import { Image as ExpoImage } from 'expo-image';
import { ApiCast } from 'farcaster-client-data';
import { useTheme } from 'farcaster-expo';
import React, { memo, useMemo } from 'react';
import { Platform, View } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { imageRequestHeaders } from '~/constants/Images';
import { useShowServerSideArtifacts } from '~/hooks/data/useShowServerSideArtifacts';
import { useParallaxEffect } from '~/hooks/useParallaxEffect';

import { CollectibleCastArtifactSkia } from './CollectibleCastArtifactSkia';

const ARTIFACT_SIZE = 354;
const ARTIFACT_BORDER_RADIUS = 33.984;
const ARTIFACT_BORDER_WIDTH = 2.832;

export type CollectibleCastVariant = 'full' | 'thumbnail';

interface CollectibleCastArtifactProps {
  cast: ApiCast;
  enableParallax?: boolean;
  size: SharedValue<number> | number;
  shadowed?: boolean;
  /*
   * used to delay rendering to prevent jank from GPU contention while
   * still allowing assets to be loaded into memory
   */
  render?: boolean;
  variant?: CollectibleCastVariant;
}

const ParallaxEffect = memo(
  ({
    children,
    shadowed,
  }: {
    children: React.ReactNode;
    shadowed: boolean;
  }) => {
    // Hook is only called when this component is mounted (when parallax is enabled)
    const { rotationX, rotationY, shadowStyle, isAvailable } =
      useParallaxEffect({
        enabled: true,
      });

    // Parallax rotation style
    const parallaxStyle = useAnimatedStyle(() => {
      'worklet';

      if (!isAvailable.value) {
        return {};
      }

      // Get rotation values (already in degrees from hook)
      const rotX = rotationX.value;
      const rotY = rotationY.value;

      // Apply 3D rotations around center
      return {
        transform: [
          { perspective: 1000 },
          { rotateX: `${-rotX}deg` }, // X-axis rotation (pitch) - inverted for natural feel
          { rotateY: `${rotY}deg` }, // Y-axis rotation (roll)
          { rotateZ: `${rotX * 0.1}deg` }, // Z-axis rotation (10% of X like Swift)
        ],
        transformOrigin: 'center',
      };
    });

    return (
      <Animated.View
        style={[parallaxStyle, shadowed ? shadowStyle : undefined]}
      >
        {children}
      </Animated.View>
    );
  },
);

ParallaxEffect.displayName = 'ParallaxEffect';

const ServerSideCollectibleCastArtifact = memo(
  ({
    cast,
    size,
    enableParallax = true,
    shadowed = Platform.OS === 'ios',
    variant = 'full',
  }: CollectibleCastArtifactProps) => {
    const containerStyle = useAnimatedStyle(() => {
      const sizeValue = typeof size === 'number' ? size : size.value;
      return {
        width: sizeValue,
        height: sizeValue,
        transform: [{ scale: sizeValue / ARTIFACT_SIZE }],
        transformOrigin: 'top left',
      };
    });

    const backgroundImageUrl = useMemo(() => {
      const artifactUrl = new URL(
        'https://api.farcaster.xyz/v2/cast-collectibles/artifact',
      );
      artifactUrl.searchParams.set('castHash', cast.hash);
      artifactUrl.searchParams.set('resolution', 'md');
      const width = ARTIFACT_SIZE * 2;
      return `https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=${width},q=85/${artifactUrl.href}`;
    }, [cast.hash]);

    const artifactContent = (
      <ArtifactContainer
        shadowed={shadowed}
        variant={variant}
        backgroundColor="#FAFAFA"
      >
        {backgroundImageUrl && (
          <ExpoImage
            source={{
              uri: backgroundImageUrl,
              headers: imageRequestHeaders,
            }}
            recyclingKey={backgroundImageUrl}
            cachePolicy="memory-disk"
            priority="high"
            contentFit="cover"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: ARTIFACT_SIZE,
              height: ARTIFACT_SIZE,
              borderRadius:
                variant === 'thumbnail'
                  ? ARTIFACT_BORDER_RADIUS * 2.5
                  : ARTIFACT_BORDER_RADIUS,
            }}
            transition={100}
          />
        )}
      </ArtifactContainer>
    );

    return (
      <Animated.View style={[containerStyle]}>
        {enableParallax ? (
          <ParallaxEffect shadowed={shadowed}>{artifactContent}</ParallaxEffect>
        ) : (
          artifactContent
        )}
      </Animated.View>
    );
  },
);

export const CollectibleCastArtifact = memo(
  (props: CollectibleCastArtifactProps) => {
    const showServerSideArtifacts = useShowServerSideArtifacts();

    if (showServerSideArtifacts) {
      return <ServerSideCollectibleCastArtifact {...props} />;
    }

    return <CollectibleCastArtifactSkia {...props} />;
  },
);

const ArtifactContainer = React.memo(
  ({
    children,
    shadowed,
    variant,
    backgroundColor,
  }: {
    children: React.ReactNode;
    shadowed?: boolean;
    variant: CollectibleCastVariant;
    backgroundColor?: string;
  }) => {
    const t = useTheme();
    const containerStyle = useMemo(
      () => ({
        width: ARTIFACT_SIZE,
        height: ARTIFACT_SIZE,
        borderRadius:
          variant === 'thumbnail'
            ? ARTIFACT_BORDER_RADIUS * 2.5
            : ARTIFACT_BORDER_RADIUS,
        borderWidth: ARTIFACT_BORDER_WIDTH,
        borderColor: t.dark ? '#383838' : '#EFEFEF',
        overflow: 'hidden' as const,
        backgroundColor,
      }),
      [t.dark, variant, backgroundColor],
    );

    return (
      <View
        style={{
          ...(shadowed && {
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 0,
            },
            shadowOpacity: 0.12,
            shadowRadius: 11.24,
            elevation: 4,
          }),
        }}
      >
        <View style={containerStyle}>{children}</View>
      </View>
    );
  },
);
