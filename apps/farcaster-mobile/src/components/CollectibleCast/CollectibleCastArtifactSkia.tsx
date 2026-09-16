import {
  Canvas,
  Circle,
  Group,
  Image,
  ImageSVG,
  LinearGradient,
  matchFont,
  Paragraph,
  Rect,
  rect,
  RoundedRect,
  Skia,
  SkTypefaceFontProvider,
  Text,
  TileMode,
  vec,
} from '@shopify/react-native-skia';
import { Image as ExpoImage } from 'expo-image';
import { ApiCast } from 'farcaster-client-data';
import {
  ArtifactFooterRenderData,
  ArtifactRenderData,
  getRenderData,
} from 'farcaster-client-hooks';
import { getPixelDensity, useSkiaFont, useTheme } from 'farcaster-expo';
import React, { memo, useMemo } from 'react';
import { Platform, View } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { ImageAssets, useImages } from '~/components/CollectibleCast/useImage';
import { imageRequestHeaders } from '~/constants/Images';
import { useParallaxEffect } from '~/hooks/useParallaxEffect';

type ArtifactPresentation = 'text' | 'image' | 'miniapp_embed';

const ARTIFACT_SIZE = 354;
const ARTIFACT_HEIGHT = ARTIFACT_SIZE;
const ARTIFACT_WIDTH = ARTIFACT_SIZE;
const ARTIFACT_BORDER_RADIUS = 33.984;
const ARTIFACT_BORDER_WIDTH = 2.832;

const PADDING = 22.66;
const AVATAR_RADIUS = 40 / 2;
const AVATAR_BORDER_WIDTH = 1.467;

const USERNAME_FONT_SIZE = 16;
const USERNAME_LINE_HEIGHT = 20;
const POSTED_AT_FONT_SIZE = 14;
const POSTED_AT_LINE_HEIGHT = 18;

const FOOTER_CAST_TEXT_FONT_SIZE = 14;
const FOOTER_CAST_TEXT_LINE_HEIGHT = 18;
const FOOTER_CAST_TEXT_HEIGHT_MULTIPLIER =
  FOOTER_CAST_TEXT_LINE_HEIGHT / FOOTER_CAST_TEXT_FONT_SIZE;

export type CollectibleCastVariant = 'full' | 'thumbnail';

interface CollectibleCastArtifactSkiaProps {
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

export const CollectibleCastArtifactSkia = memo(
  ({
    cast,
    size,
    enableParallax = true,
    shadowed = Platform.OS === 'ios',
    variant = 'full',
  }: CollectibleCastArtifactSkiaProps) => {
    const containerStyle = useAnimatedStyle(() => {
      const sizeValue = typeof size === 'number' ? size : size.value;
      return {
        width: sizeValue,
        height: sizeValue,
        transform: [{ scale: sizeValue / ARTIFACT_SIZE }],
        transformOrigin: 'top left',
      };
    });

    const { fontManager } = useSkiaFont();

    const presentation = useMemo(() => {
      return getRenderData({
        cast,
        pixelDensity: getPixelDensity(),
      });
    }, [cast]);

    const backgroundImageUrl = useMemo(() => {
      if (presentation.type === 'text') {
        return undefined;
      }

      if (variant === 'thumbnail') {
        return presentation.imageUrl;
      }

      return cast.collectible?.backgroundImageUrl ?? presentation.imageUrl;
    }, [cast.collectible?.backgroundImageUrl, presentation, variant]);

    const images = useMemo(() => {
      const imgs: Record<string, string> = {};

      if (backgroundImageUrl) {
        imgs['background'] = backgroundImageUrl;
      }

      imgs['pfp'] = presentation.footer.pfpImageUrl;

      if (presentation.footer.rightSection.type === 'embeds') {
        for (const [index, url] of Object.entries(
          presentation.footer.rightSection.imageUrls,
        )) {
          imgs[`embed${index}`] = url;
        }
      }

      return imgs;
    }, [presentation, backgroundImageUrl]);

    const { imageAssets } = useImages({ images });

    const artifactContent = (
      <ArtifactContainer
        shadowed={shadowed}
        variant={variant}
        backgroundColor={backgroundImageUrl ? '#FAFAFA' : '#FFFFFF'}
      >
        {backgroundImageUrl && (
          <ExpoImage
            source={{
              uri: backgroundImageUrl,
              headers: imageRequestHeaders,
            }}
            recyclingKey={backgroundImageUrl}
            cachePolicy="memory-disk"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: ARTIFACT_SIZE,
              height: ARTIFACT_SIZE,
            }}
            transition={200}
          />
        )}
        {imageAssets &&
          fontManager &&
          // We don't need footer for thumbnail variant on images
          (variant === 'full' || presentation.type === 'text') && (
            <ArtifactContent
              presentation={presentation}
              fontManager={fontManager}
              imageAssets={imageAssets}
              variant={variant}
              backgroundColor={backgroundImageUrl ? undefined : '#FFFFFF'}
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

const ArtifactContent = React.memo(
  ({
    presentation,
    variant,
    fontManager,
    imageAssets,
    backgroundColor,
  }: {
    presentation: ArtifactRenderData;
    variant: CollectibleCastVariant;
    fontManager: SkTypefaceFontProvider;
    imageAssets: ImageAssets;
    backgroundColor?: string;
  }) => {
    const footer = useFooter({
      presentation: presentation.type,
      data: presentation.footer,
      fontManager,
      imageAssets,
      dark:
        presentation.type === 'image' || presentation.type === 'miniapp_embed',
      bgGradient: presentation.type === 'text',
    });

    return (
      <Canvas
        style={{
          height: ARTIFACT_HEIGHT,
          width: ARTIFACT_WIDTH,
          backgroundColor: backgroundColor ?? 'transparent',
        }}
      >
        {presentation.type === 'text' && (
          <ArtifactTextContent
            text={presentation.text}
            variant={variant}
            fontManager={fontManager}
          />
        )}
        {variant === 'full' && footer.content}
      </Canvas>
    );
  },
);

function ArtifactTextContent({
  text,
  dark,
  variant,
  fontManager,
}: {
  text: string;
  dark?: boolean;
  variant: CollectibleCastVariant;
  fontManager: SkTypefaceFontProvider;
}) {
  const padding = variant === 'thumbnail' ? PADDING * 1.5 : PADDING;
  const skiaColors = useMemo(() => {
    return {
      textGradientStart: dark
        ? Skia.Color('rgba(224, 224, 224, 0.90)')
        : Skia.Color('rgba(0, 0, 0, 0.90)'),
      textGradientEnd: dark
        ? Skia.Color('#111111F2')
        : Skia.Color('rgba(224, 224, 224, 0.90)'),
    };
  }, [dark]);

  const paragraph = useMemo(() => {
    const foregroundPaint = Skia.Paint();
    foregroundPaint.setShader(
      Skia.Shader.MakeLinearGradient(
        { x: 0, y: 0 },
        { x: 0, y: 251 },
        [skiaColors.textGradientStart, skiaColors.textGradientEnd],
        null,
        TileMode.Clamp,
      ),
    );

    const textStyle = {
      color: Skia.Color('black'),
      fontSize: variant === 'full' ? 16.992 : 16.992 * 2,
      heightMultiplier: 1.667,
      fontFamilies: ['Inter'],
      fontStyle: {
        weight: 500,
      },
      letterSpacing: -0.212,
    };

    // Create paragraph style
    const paragraphStyle = {
      maxLines: variant === 'thumbnail' ? 5 : 8,
      ellipsis: '...',
      textAlign: 0, // Left align
    };

    const renderText =
      variant === 'thumbnail' ? text.replaceAll(/\n\s*\n/g, '\n') : text;

    // Build paragraph
    const builder = Skia.ParagraphBuilder.Make(paragraphStyle, fontManager!)
      .pushStyle(textStyle, foregroundPaint)
      .addText(renderText);

    const para = builder.build();

    para.layout(ARTIFACT_WIDTH - padding * 2);

    return para;
  }, [
    skiaColors.textGradientStart,
    skiaColors.textGradientEnd,
    padding,
    fontManager,
    text,
    variant,
  ]);

  const rct = (() => {
    switch (variant) {
      case 'full':
        return rect(
          padding,
          padding,
          ARTIFACT_WIDTH - padding * 2,
          ARTIFACT_HEIGHT - padding,
        );
      case 'thumbnail':
        return rect(padding, padding, ARTIFACT_WIDTH, ARTIFACT_HEIGHT);
    }
  })();

  return (
    <Group clip={rct}>
      <Paragraph
        paragraph={paragraph}
        x={padding}
        y={padding}
        width={ARTIFACT_WIDTH - padding * 2}
      >
        <LinearGradient
          start={vec(0, 0)}
          end={vec(256, 256)}
          colors={[
            Skia.Color('rgba(0, 0, 0, 0.90)'),
            Skia.Color('rgba(224, 224, 224, 0.90)'),
          ]}
        />
      </Paragraph>
    </Group>
  );
}

const useFooter = ({
  presentation,
  data: { username, postedAt, castText, quotedCasts, rightSection },
  fontManager,
  imageAssets,
  dark,
  bgGradient,
}: {
  presentation: ArtifactPresentation;
  data: ArtifactFooterRenderData;
  dark: boolean;
  bgGradient: boolean;
  fontManager: SkTypefaceFontProvider;
  imageAssets: ImageAssets;
}) => {
  const skiaColors = useMemo(() => {
    return {
      textGradientStart: dark
        ? Skia.Color('rgba(224, 224, 224, 0.90)')
        : Skia.Color('rgba(0, 0, 0, 0.90)'),
      textGradientEnd: dark
        ? Skia.Color('#111111F2')
        : Skia.Color('rgba(224, 224, 224, 0.90)'),
      username: dark
        ? Skia.Color('rgba(255, 255, 255, 0.90)')
        : Skia.Color('rgba(0, 0, 0, 0.50)'),
      postedAt: dark
        ? Skia.Color('rgba(255, 255, 255, 0.50)')
        : Skia.Color('rgba(56, 56, 56, 0.50)'),
    };
  }, [dark]);

  const { paragraph: castTextParagraph, height: castTextParagraphHeight } =
    useFooterCastText({
      text: castText,
      lines: quotedCasts.length ? 1 : 2,
      fontManager,
    });

  const footerVerticalGap = castText ? 8 : 12;

  const quotedCastHeight =
    quotedCasts.length > 0 ? QUOTED_CAST_HEIGHT + footerVerticalGap : 0;

  const castTextHeight = castTextParagraph
    ? castTextParagraphHeight + footerVerticalGap
    : 0;

  const avatarCenterX = PADDING + AVATAR_RADIUS + AVATAR_BORDER_WIDTH;
  const avatarCenterY =
    ARTIFACT_HEIGHT -
    PADDING -
    AVATAR_RADIUS -
    AVATAR_BORDER_WIDTH -
    castTextHeight -
    quotedCastHeight;

  const embedImageUrls = useMemo(() => {
    return rightSection.type === 'embeds' ? rightSection.imageUrls : [];
  }, [rightSection]);

  const image = imageAssets['pfp'];
  const embedImage1 = imageAssets['embed1'];
  const embedImage2 = imageAssets['embed2'];
  const embedImage3 = imageAssets['embed2'];

  const circlePath = useMemo(() => {
    const path = Skia.Path.Make();
    path.addCircle(avatarCenterX, avatarCenterY, AVATAR_RADIUS);
    return path;
  }, [avatarCenterX, avatarCenterY]);

  const usernameFont = useMemo(() => {
    return matchFont(
      {
        fontFamily: 'Inter',
        fontSize: USERNAME_FONT_SIZE,
        fontWeight: '600',
      },
      fontManager!,
    );
  }, [fontManager]);

  const postedAtFont = useMemo(() => {
    return matchFont(
      {
        fontFamily: 'Inter',
        fontSize: POSTED_AT_FONT_SIZE,
        fontWeight: '600',
      },
      fontManager!,
    );
  }, [fontManager]);

  const iconSvg = useMemo(() => {
    if (rightSection.type === 'icon') {
      if (rightSection.icon === 'video') {
        const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 7.75a.75.75 0 0 1 1.142-.638l3.664 2.249a.75.75 0 0 1 0 1.278l-3.664 2.25a.75.75 0 0 1-1.142-.64z"/><path d="M7 21h10"/><rect width="20" height="14" x="2" y="3" rx="2"/></svg>`;

        return Skia.SVG.MakeFromString(svgString);
      }

      if (rightSection.icon === 'miniapp') {
        const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>`;

        return Skia.SVG.MakeFromString(svgString);
      }
    }
  }, [rightSection]);

  const footerHeight =
    AVATAR_RADIUS * 2 +
    AVATAR_BORDER_WIDTH * 2 +
    PADDING * 2 +
    castTextHeight +
    quotedCastHeight;
  const footerY = ARTIFACT_HEIGHT - footerHeight;

  const content = useMemo(() => {
    const embedImages = [embedImage1, embedImage2, embedImage3];

    return (
      <>
        {bgGradient && (
          <Rect x={0} y={footerY} width={ARTIFACT_WIDTH} height={footerHeight}>
            <LinearGradient
              start={vec(0, footerY)}
              end={vec(0, ARTIFACT_HEIGHT)}
              colors={[
                'rgba(255, 255, 255, 0.02)',
                'rgba(238, 233, 255, 0.02)',
              ]}
              positions={[0.2569, 1]}
            />
          </Rect>
        )}

        <Circle
          cx={avatarCenterX}
          cy={avatarCenterY}
          r={AVATAR_RADIUS + AVATAR_BORDER_WIDTH}
          color="#7C65C1"
        />

        <Group clip={circlePath}>
          <Image
            image={image}
            fit="cover"
            x={avatarCenterX - AVATAR_RADIUS}
            y={avatarCenterY - AVATAR_RADIUS}
            width={AVATAR_RADIUS * 2}
            height={AVATAR_RADIUS * 2}
          />
        </Group>
        <Text
          x={avatarCenterX + AVATAR_RADIUS + 10}
          y={
            avatarCenterY - (USERNAME_LINE_HEIGHT - USERNAME_FONT_SIZE) / 2 - 3
          }
          text={username}
          font={usernameFont}
          color={skiaColors.username}
        />
        <Text
          x={avatarCenterX + AVATAR_RADIUS + 10}
          y={
            avatarCenterY +
            POSTED_AT_FONT_SIZE +
            (POSTED_AT_LINE_HEIGHT - POSTED_AT_FONT_SIZE) / 2
          }
          text={postedAt}
          font={postedAtFont}
          color={skiaColors.postedAt}
        />

        {(() => {
          const EMBED_TYPE_ICON_SIZE = 21.6;

          const xPosition = ARTIFACT_WIDTH - PADDING - EMBED_TYPE_ICON_SIZE;
          const yPosition = avatarCenterY - EMBED_TYPE_ICON_SIZE / 2 + 1;

          switch (rightSection.type) {
            case 'icon': {
              return (
                <ImageSVG
                  svg={iconSvg!}
                  x={xPosition}
                  y={yPosition}
                  width={EMBED_TYPE_ICON_SIZE}
                  height={EMBED_TYPE_ICON_SIZE}
                />
              );
            }
            case 'embeds': {
              return (
                <>
                  {[...rightSection.imageUrls.slice(0, 3)]
                    .reverse()
                    .map((url, reversedIndex) => {
                      // Get the original index for accessing embedImages
                      const index =
                        embedImageUrls.slice(0, 3).length - 1 - reversedIndex;
                      const embedImage = embedImages[index];
                      if (!embedImage || !url) {
                        return null;
                      }

                      const ARTIFACT_EMBED_WIDTH = 36.517;
                      const ARTIFACT_EMBED_HEIGHT = 44.311;
                      const ARTIFACT_EMBED_SPACING = 14; // Positive 14px offset to the right
                      const ARTIFACT_EMBED_BORDER_RADIUS = 4.896;
                      const ARTIFACT_EMBED_BORDER_WIDTH = 1.224;
                      const rotation = 15; // degrees
                      const totalEmbeds = Math.min(embedImageUrls.length, 3);

                      // Position from right edge, with each image offset to the right
                      const baseX =
                        ARTIFACT_WIDTH -
                        PADDING -
                        ARTIFACT_EMBED_WIDTH -
                        ARTIFACT_EMBED_SPACING * (totalEmbeds - 1) -
                        10;
                      const xPosition = baseX + ARTIFACT_EMBED_SPACING * index;
                      const yPosition =
                        avatarCenterY - ARTIFACT_EMBED_HEIGHT / 2;

                      // Create rounded rect path for clipping the inner image
                      const innerClipPath = (() => {
                        const path = Skia.Path.Make();
                        const innerRadius = Math.max(
                          0,
                          ARTIFACT_EMBED_BORDER_RADIUS -
                            ARTIFACT_EMBED_BORDER_WIDTH,
                        );
                        const rrect = Skia.RRectXY(
                          Skia.XYWHRect(
                            ARTIFACT_EMBED_BORDER_WIDTH,
                            ARTIFACT_EMBED_BORDER_WIDTH,
                            ARTIFACT_EMBED_WIDTH -
                              ARTIFACT_EMBED_BORDER_WIDTH * 2,
                            ARTIFACT_EMBED_HEIGHT -
                              ARTIFACT_EMBED_BORDER_WIDTH * 2,
                          ),
                          innerRadius,
                          innerRadius,
                        );
                        path.addRRect(rrect);
                        return path;
                      })();

                      return (
                        <Group
                          key={url}
                          transform={[
                            {
                              translateX: xPosition + ARTIFACT_EMBED_WIDTH / 2,
                            },
                            {
                              translateY: yPosition + ARTIFACT_EMBED_HEIGHT / 2,
                            },
                            { rotate: (rotation * Math.PI) / 180 },
                            { translateX: -(ARTIFACT_EMBED_WIDTH / 2) },
                            { translateY: -(ARTIFACT_EMBED_HEIGHT / 2) },
                          ]}
                        >
                          {/* White border background */}
                          <RoundedRect
                            x={0}
                            y={0}
                            width={ARTIFACT_EMBED_WIDTH}
                            height={ARTIFACT_EMBED_HEIGHT}
                            r={ARTIFACT_EMBED_BORDER_RADIUS}
                            color="white"
                          />

                          {/* Image clipped to inner rounded rect */}
                          <Group clip={innerClipPath}>
                            <Image
                              image={embedImage}
                              fit="cover"
                              x={ARTIFACT_EMBED_BORDER_WIDTH}
                              y={ARTIFACT_EMBED_BORDER_WIDTH}
                              width={
                                ARTIFACT_EMBED_WIDTH -
                                ARTIFACT_EMBED_BORDER_WIDTH * 2
                              }
                              height={
                                ARTIFACT_EMBED_HEIGHT -
                                ARTIFACT_EMBED_BORDER_WIDTH * 2
                              }
                            />
                          </Group>
                        </Group>
                      );
                    })}
                </>
              );
            }
          }
        })()}

        {castTextParagraph && (
          <Paragraph
            paragraph={castTextParagraph}
            x={PADDING}
            y={
              ARTIFACT_HEIGHT -
              PADDING -
              castTextHeight -
              quotedCastHeight +
              footerVerticalGap
            }
            width={ARTIFACT_WIDTH - PADDING * 2}
          />
        )}

        {quotedCasts.length > 0 && (
          <QuotedCast
            username={quotedCasts[0].authorUsername}
            x={PADDING}
            y={ARTIFACT_HEIGHT - PADDING - quotedCastHeight + footerVerticalGap}
            fontManager={fontManager}
            presentation={presentation}
            dark={dark}
          />
        )}
      </>
    );
  }, [
    avatarCenterX,
    avatarCenterY,
    dark,
    bgGradient,
    castTextHeight,
    castTextParagraph,
    circlePath,
    embedImage1,
    embedImage2,
    embedImage3,
    embedImageUrls,
    fontManager,
    footerHeight,
    footerVerticalGap,
    footerY,
    iconSvg,
    image,
    postedAt,
    postedAtFont,
    presentation,
    quotedCastHeight,
    quotedCasts,
    rightSection,
    skiaColors.postedAt,
    skiaColors.username,
    username,
    usernameFont,
  ]);

  return {
    measurements: {
      footerHeight,
      footerY,
      avatarCenterX,
      avatarCenterY,
    },
    content,
  };
};

const useFooterCastText = ({
  text,
  lines,
  fontManager,
}: {
  text?: string;
  lines: 1 | 2;
  fontManager: SkTypefaceFontProvider;
}) => {
  const paragraph = useMemo(() => {
    if (text) {
      const paragraphStyle = {
        maxLines: lines,
        ellipsis: '...',
        textAlign: 0, // Left align
      };

      const textStyle = {
        color: Skia.Color('rgba(255, 255, 255, 0.90)'),
        fontSize: FOOTER_CAST_TEXT_FONT_SIZE,
        heightMultiplier: FOOTER_CAST_TEXT_HEIGHT_MULTIPLIER,
        fontFamilies: ['Inter'],
        fontStyle: {
          weight: 500,
        },
        letterSpacing: -0.212,
      };

      const builder = Skia.ParagraphBuilder.Make(paragraphStyle, fontManager!)
        .pushStyle(textStyle)
        .addText(text);

      const para = builder.build();

      para.layout(ARTIFACT_WIDTH - PADDING * 2);

      return para;
    }
  }, [lines, text, fontManager]);

  const height = paragraph ? paragraph.getHeight() : 0;

  return {
    paragraph,
    height,
  };
};

const QUOTED_CAST_HEIGHT = 20;
const QUOTED_CAST_PADDING_HORIZONTAL = 6;
const QUOTED_CAST_ICON_SIZE = 12;
const QUOTED_CAST_FONT_SIZE = 12;

function QuotedCast({
  username,
  x,
  y,
  presentation,
  fontManager,
  dark,
}: {
  username: string;
  x: number;
  y: number;
  presentation: ArtifactPresentation;
  fontManager: SkTypefaceFontProvider;
  dark: boolean;
}) {
  const bgColor = useMemo(() => {
    // For text presentation, use dark mode if explicitly dark
    if (presentation === 'text' && dark) {
      return 'rgba(255, 255, 255, 0.10)';
    }

    switch (presentation) {
      case 'text':
        return 'rgba(136, 136, 136, 0.10)';
      case 'image':
      case 'miniapp_embed':
        return 'rgba(255, 255, 255, 0.10)';
    }
  }, [presentation, dark]);

  const textColor = useMemo(() => {
    // For text presentation, use dark mode if explicitly dark
    if (presentation === 'text' && dark) {
      return 'rgba(255, 255, 255, 0.50)';
    }

    switch (presentation) {
      case 'text':
        return 'rgba(56, 56, 56, 0.40)';
      case 'image':
      case 'miniapp_embed':
        return 'rgba(255, 255, 255, 0.50)';
    }
  }, [presentation, dark]);

  const font = useMemo(() => {
    return matchFont(
      {
        fontFamily: 'Inter',
        fontSize: QUOTED_CAST_FONT_SIZE,
        fontWeight: '600',
      },
      fontManager,
    );
  }, [fontManager]);

  const { width: textWidth } = useMemo(() => {
    if (!font) {
      return { width: 0 };
    }

    return font.measureText(username);
  }, [font, username]);

  const badgeWidth =
    QUOTED_CAST_PADDING_HORIZONTAL +
    QUOTED_CAST_ICON_SIZE +
    QUOTED_CAST_PADDING_HORIZONTAL + // space between icon and text
    textWidth +
    QUOTED_CAST_PADDING_HORIZONTAL;

  const quoteSvg = useMemo(() => {
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 11 11" fill="none">
      <path d="M9.40991 6.58984C9.40991 6.81086 9.32211 7.02282 9.16583 7.1791C9.00955 7.33538 8.79759 7.42318 8.57658 7.42318H3.57658L1.90991 9.08984V2.42318C1.90991 2.20216 1.99771 1.9902 2.15399 1.83392C2.31027 1.67764 2.52223 1.58984 2.74325 1.58984H8.57658C8.79759 1.58984 9.00955 1.67764 9.16583 1.83392C9.32211 1.9902 9.40991 2.20216 9.40991 2.42318V6.58984Z" stroke="${textColor}" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M3.99316 5.34049C4.21418 5.34049 4.42614 5.2527 4.58242 5.09642C4.7387 4.94014 4.8265 4.72818 4.8265 4.50716V3.67383H3.99316" stroke="${textColor}" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M6.49316 5.34049C6.71418 5.34049 6.92614 5.2527 7.08242 5.09642C7.2387 4.94014 7.3265 4.72818 7.3265 4.50716V3.67383H6.49316" stroke="${textColor}" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

    return Skia.SVG.MakeFromString(svgString);
  }, [textColor]);

  return (
    <>
      {/* Background pill */}
      <RoundedRect
        x={x}
        y={y}
        width={badgeWidth}
        height={QUOTED_CAST_HEIGHT}
        r={QUOTED_CAST_HEIGHT / 2}
        color={bgColor}
      />

      {/* Quote icon */}
      {quoteSvg && (
        <ImageSVG
          svg={quoteSvg}
          x={x + QUOTED_CAST_PADDING_HORIZONTAL}
          y={y + (QUOTED_CAST_HEIGHT - 11) / 2} // 11 is the SVG height
          width={11}
          height={11}
        />
      )}

      {/* Username text */}
      <Text
        x={
          x +
          QUOTED_CAST_PADDING_HORIZONTAL +
          QUOTED_CAST_ICON_SIZE +
          QUOTED_CAST_PADDING_HORIZONTAL // space between icon and text
        }
        y={y + QUOTED_CAST_HEIGHT / 2 + QUOTED_CAST_FONT_SIZE / 3}
        text={username}
        font={font}
        color={textColor}
      />
    </>
  );
}
