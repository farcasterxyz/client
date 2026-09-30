import { Ionicons } from '@expo/vector-icons';
import { File, Paths } from 'expo-file-system';
import { Image, ImageStyle } from 'expo-image';
import * as Sharing from 'expo-sharing';
import { ApiCast, ApiMedia, ApiQuoteCastEmbed } from 'farcaster-client-data';
import { Avatar } from 'farcaster-expo';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Dimensions, Modal, View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { CapturableView, CapturableViewRef } from '~/components/CapturableView';
import { FarcasterArchIcon } from '~/components/images/FarcasterArch';
import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { useLinkifyText } from '~/hooks/useLinkifyText';

type CastImageViewerProps = {
  cast: ApiCast;
  visible: boolean;
  onClose: () => void;
};

// Upper bound on how long the capture waits for images to finish decoding
// before snapshotting anyway, so a stalled image can never hang the share.
const CAPTURE_READINESS_TIMEOUT_MS = 4000;

export const CastImageViewer: React.FC<CastImageViewerProps> = ({
  cast,
  visible,
  onClose,
}) => {
  const t = useTheme();
  const toast = useToast();
  const castImageRef = useRef<CapturableViewRef>(null);

  // Tracks each capturable image's settle (loaded or errored) state so the
  // capture only fires once the whole tree has finished decoding.
  const pendingImageKeysRef = useRef<Set<string>>(new Set());
  const readinessResolversRef = useRef<Set<() => void>>(new Set());

  const registerCapturableImage = useCallback((key: string) => {
    pendingImageKeysRef.current.add(key);
  }, []);

  const settleCapturableImage = useCallback((key: string) => {
    if (!pendingImageKeysRef.current.delete(key)) {
      return;
    }
    if (pendingImageKeysRef.current.size === 0) {
      const resolvers = Array.from(readinessResolversRef.current);
      readinessResolversRef.current.clear();
      resolvers.forEach((resolve) => resolve());
    }
  }, []);

  const waitForCapturableImages = useCallback(
    (timeoutMs: number) =>
      new Promise<void>((resolve) => {
        if (pendingImageKeysRef.current.size === 0) {
          resolve();
          return;
        }
        let settled = false;
        const onReady = () => {
          if (settled) {
            return;
          }
          settled = true;
          readinessResolversRef.current.delete(onReady);
          resolve();
        };
        readinessResolversRef.current.add(onReady);
        setTimeout(onReady, timeoutMs);
      }),
    [],
  );

  // Reset readiness tracking when the viewer is hidden so a fresh capture never
  // reuses stale settle state. Clearing only while hidden (the capturable tree
  // is unmounted) avoids stomping the registrations that mounted images add on
  // their own effects; a cast change while visible is reconciled by each
  // image's own register/settle effect re-running on its uri/pfpUrl.
  useEffect(() => {
    if (!visible) {
      pendingImageKeysRef.current.clear();
      readinessResolversRef.current.clear();
    }
  }, [visible]);

  const filename = `farcaster_cast_${cast.author.username}_${cast.hash.slice(0, 8)}.png`;

  const totalEmbedsCount = useMemo(
    () =>
      (cast.embeds?.images?.length || 0) +
      (cast.embeds?.videos?.length || 0) +
      (cast.embeds?.casts?.length || 0),
    [cast.embeds],
  );

  // Check if this cast has a mini app (frame) - check for both frameEmbedNext and frame properties
  const hasMiniApp = useMemo(() => {
    // Check first URL for frameEmbedNext
    const firstUrlHasFrameEmbedNext =
      cast.embeds?.urls &&
      cast.embeds.urls.length > 0 &&
      cast.embeds.urls[0].openGraph &&
      cast.embeds.urls[0].openGraph.frameEmbedNext;

    // Check first URL for frame
    const firstUrlHasFrame =
      cast.embeds?.urls &&
      cast.embeds.urls.length > 0 &&
      cast.embeds.urls[0].openGraph &&
      cast.embeds.urls[0].openGraph.frame;

    // Check second URL for frameEmbedNext
    const secondUrlHasFrameEmbedNext =
      cast.embeds?.urls &&
      cast.embeds.urls.length > 1 &&
      cast.embeds.urls[1].openGraph &&
      cast.embeds.urls[1].openGraph.frameEmbedNext;

    // Check second URL for frame
    const secondUrlHasFrame =
      cast.embeds?.urls &&
      cast.embeds.urls.length > 1 &&
      cast.embeds.urls[1].openGraph &&
      cast.embeds.urls[1].openGraph.frame;

    return (
      firstUrlHasFrameEmbedNext ||
      firstUrlHasFrame ||
      secondUrlHasFrameEmbedNext ||
      secondUrlHasFrame
    );
  }, [cast.embeds]);

  // Get frame data if available - check both URLs and both frame formats
  const frameData = useMemo(() => {
    if (!hasMiniApp || !cast.embeds?.urls) {
      return null;
    }

    // Check first URL for frameEmbedNext
    if (
      cast.embeds.urls.length > 0 &&
      cast.embeds.urls[0].openGraph?.frameEmbedNext
    ) {
      const frameEmbed = cast.embeds.urls[0].openGraph.frameEmbedNext;

      // Extract image URL
      const imageUrl = frameEmbed.frameEmbed?.imageUrl;

      // Extract button text - handle both forms (string or array of objects)
      let buttonText = '';
      if (frameEmbed.frameEmbed?.button) {
        if (
          typeof frameEmbed.frameEmbed.button === 'object' &&
          frameEmbed.frameEmbed.button.title
        ) {
          // First format - button has title property
          buttonText = frameEmbed.frameEmbed.button.title;
        } else if (
          Array.isArray(frameEmbed.frameEmbed.button) &&
          frameEmbed.frameEmbed.button.length > 0 &&
          frameEmbed.frameEmbed.button[0].title
        ) {
          // Second format - button is an array with title in first item
          buttonText = frameEmbed.frameEmbed.button[0].title;
        }
      }

      return { imageUrl, buttonText };
    }

    // Check first URL for frame
    if (cast.embeds.urls.length > 0 && cast.embeds.urls[0].openGraph?.frame) {
      const frame = cast.embeds.urls[0].openGraph.frame;

      // Extract image URL
      const imageUrl = frame.imageUrl;

      // Extract button text from buttons array
      let buttonText = '';
      if (
        frame.buttons &&
        Array.isArray(frame.buttons) &&
        frame.buttons.length > 0
      ) {
        // The buttons property is an array of button objects
        const firstButton = frame.buttons[0];
        if (
          firstButton &&
          typeof firstButton === 'object' &&
          firstButton.title
        ) {
          buttonText = firstButton.title;
        }
      }

      return { imageUrl, buttonText };
    }

    // Check second URL for frameEmbedNext
    if (
      cast.embeds.urls.length > 1 &&
      cast.embeds.urls[1].openGraph?.frameEmbedNext
    ) {
      const frameEmbed = cast.embeds.urls[1].openGraph.frameEmbedNext;

      // Extract image URL
      const imageUrl = frameEmbed.frameEmbed?.imageUrl;

      // Extract button text - handle both forms (string or array of objects)
      let buttonText = '';
      if (frameEmbed.frameEmbed?.button) {
        if (
          typeof frameEmbed.frameEmbed.button === 'object' &&
          frameEmbed.frameEmbed.button.title
        ) {
          // First format - button has title property
          buttonText = frameEmbed.frameEmbed.button.title;
        } else if (
          Array.isArray(frameEmbed.frameEmbed.button) &&
          frameEmbed.frameEmbed.button.length > 0 &&
          frameEmbed.frameEmbed.button[0].title
        ) {
          // Second format - button is an array with title in first item
          buttonText = frameEmbed.frameEmbed.button[0].title;
        }
      }

      return { imageUrl, buttonText };
    }

    // Check second URL for frame
    if (cast.embeds.urls.length > 1 && cast.embeds.urls[1].openGraph?.frame) {
      const frame = cast.embeds.urls[1].openGraph.frame;

      // Extract image URL
      const imageUrl = frame.imageUrl;

      // Extract button text from buttons array
      let buttonText = '';
      if (
        frame.buttons &&
        Array.isArray(frame.buttons) &&
        frame.buttons.length > 0
      ) {
        // The buttons property is an array of button objects
        const firstButton = frame.buttons[0];
        if (
          firstButton &&
          typeof firstButton === 'object' &&
          firstButton.title
        ) {
          buttonText = firstButton.title;
        }
      }

      return { imageUrl, buttonText };
    }

    return null;
  }, [cast.embeds, hasMiniApp]);

  // Function to capture the cast image
  const captureCastImage = useCallback(async () => {
    if (castImageRef.current) {
      try {
        await waitForCapturableImages(CAPTURE_READINESS_TIMEOUT_MS);
        const result = await castImageRef.current.capture({
          format: 'png',
          quality: 1.0,
        });
        return result || null;
      } catch (error) {
        return null;
      }
    }
    return null;
  }, [waitForCapturableImages]);

  // Function to share image natively
  const handleShare = useCallback(async () => {
    try {
      // Capture the image
      const base64Data = await captureCastImage();
      if (!base64Data) {
        toast.show('Failed to capture the cast image');
        return;
      }

      const file = new File(Paths.cache, filename);
      if (file.exists) {
        file.delete();
      }
      const binary = atob(base64Data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }
      file.create();
      file.write(bytes);

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        toast.show('Sharing is not available on this device');
        return;
      }

      // Share the image using expo-sharing
      await Sharing.shareAsync(file.uri, {
        mimeType: 'image/png',
        dialogTitle: `Cast by ${cast.author.username}`,
      });
    } catch (error) {
      toast.show('Failed to share image');
    } finally {
      onClose();
    }
  }, [captureCastImage, filename, cast.author.username, toast, onClose]);

  const handleShareRef = useRef(handleShare);
  useEffect(() => {
    handleShareRef.current = handleShare;
  }, [handleShare]);

  const hasTriggeredRef = useRef(false);
  useEffect(() => {
    if (!visible) {
      hasTriggeredRef.current = false;
      return;
    }
    if (hasTriggeredRef.current) {
      return;
    }
    hasTriggeredRef.current = true;
    const timer = setTimeout(() => {
      handleShareRef.current();
    }, 200);
    return () => clearTimeout(timer);
  }, [visible]);

  // expo-image-backed image that participates in capture readiness: it
  // registers itself while a source is pending and reports settled on load or
  // error. A missing source counts as already-settled so it never blocks.
  const CapturableImage = ({
    imageKey,
    uri,
    style,
    contentFit = 'cover',
  }: {
    imageKey: string;
    uri?: string;
    style: ImageStyle | ImageStyle[];
    contentFit?: 'cover' | 'contain';
  }) => {
    useEffect(() => {
      if (!uri) {
        return;
      }
      registerCapturableImage(imageKey);
      return () => settleCapturableImage(imageKey);
    }, [imageKey, uri]);

    return (
      <Image
        source={uri ? { uri } : undefined}
        style={style}
        contentFit={contentFit}
        onLoad={() => settleCapturableImage(imageKey)}
        onError={() => settleCapturableImage(imageKey)}
      />
    );
  };

  // Avatar that participates in capture readiness, mirroring CapturableImage:
  // pfps render off the Fresco main-thread path via the shared Avatar, and a
  // missing pfp counts as already-settled so it never blocks the capture.
  const CapturableAvatar = ({
    imageKey,
    pfpUrl,
    diameter,
  }: {
    imageKey: string;
    pfpUrl?: string;
    diameter: number;
  }) => {
    useEffect(() => {
      if (!pfpUrl) {
        return;
      }
      registerCapturableImage(imageKey);
      return () => settleCapturableImage(imageKey);
    }, [imageKey, pfpUrl]);

    return (
      <Avatar
        pfpUrl={pfpUrl}
        diameter={diameter}
        onLoad={() => settleCapturableImage(imageKey)}
        onError={() => settleCapturableImage(imageKey)}
      />
    );
  };

  // Video thumbnail component with play button overlay
  const VideoThumbnail = ({
    imageKey,
    url,
  }: {
    imageKey: string;
    url: string;
  }) => (
    <View
      style={[
        t.relative,
        {
          height: 128,
          width: 128,
        },
      ]}
    >
      <CapturableImage
        imageKey={imageKey}
        uri={url}
        style={[t.wFull, t.hFull, t.roundedLg, t.overflowHidden]}
      />
      <View
        style={[
          t.wFull,
          t.hFull,
          t.absolute,
          t.justifyCenter,
          t.itemsCenter,
          t.flex,
          t.flexCol,
        ]}
      >
        <View
          style={[
            t.flex,
            t.flexRow,
            t.itemsCenter,
            t.justifyCenter,
            t.directCasts.bgImagePreview,
            t.h12,
            t.w12,
            t.roundedFull,
          ]}
        >
          <Ionicons
            name="play"
            size={24}
            style={[t.texts.light, { paddingLeft: 4 }]}
          />
        </View>
      </View>
    </View>
  );

  // Media item renderer - handles both images and videos
  const MediaItem = ({
    item,
    imageKey,
  }: {
    item: {
      type: 'image' | 'video';
      url: string;
      thumbnailUrl?: string;
      media?: ApiMedia;
    };
    imageKey: string;
  }) => {
    if (item.type === 'video') {
      return (
        <View
          style={[
            t.border,
            t.borderFaint,
            t.roundedLg,
            {
              width: 128,
              height: 128,
              overflow: 'hidden',
            },
          ]}
        >
          <VideoThumbnail
            imageKey={imageKey}
            url={item.thumbnailUrl || item.url}
          />
        </View>
      );
    }

    // Render image (the 'else' is now implicit)
    return (
      <View
        style={[
          t.border,
          t.borderFaint,
          t.roundedLg,
          {
            width: 128,
            height: 128,
            overflow: 'hidden',
          },
        ]}
      >
        <CapturableImage
          imageKey={imageKey}
          uri={item.url}
          style={
            {
              height: 128,
              width: 128,
            } as ImageStyle
          }
        />
      </View>
    );
  };

  // Simple Quote Cast component for the image viewer
  const SimplifiedQuoteCast = ({
    quoteCast,
  }: {
    quoteCast: ApiQuoteCastEmbed;
  }) => {
    // Use simple text rendering for quoted cast since we don't have access to mentions
    // in the ApiQuoteCastEmbed type
    return (
      <View
        style={[
          t.border,
          t.borderFaint,
          t.roundedLg,
          t.p2,
          t.mY2,
          { maxHeight: 150 },
        ]}
      >
        {/* Author header */}
        <View style={[t.flexRow, t.itemsCenter, t.mB1]}>
          <View style={[t.mR2]}>
            <CapturableAvatar
              imageKey="quote-cast-pfp"
              pfpUrl={quoteCast.author.pfp?.url}
              diameter={24}
            />
          </View>
          <Text2 size="xs" weight="semibold">
            {quoteCast.author.username}
          </Text2>
        </View>

        {/* Cast text with 2 line limit and ellipsis */}
        <Text2 size="xs" ellipsizeMode="tail" numberOfLines={2}>
          {quoteCast.text}
        </Text2>
      </View>
    );
  };

  // Mini App component
  const MiniAppFrame = ({
    imageUrl,
    buttonText,
    hasOtherEmbeds = false,
  }: {
    imageUrl: string;
    buttonText: string;
    hasOtherEmbeds?: boolean;
  }) => (
    <View
      style={[
        t.mT2,
        // If there are other embeds, use smaller bottom margin
        hasOtherEmbeds ? t.mB1 : t.mB2,
        t.wFull,
        t.roundedLg,
        t.overflowHidden,
        t.border,
        t.borderFaint,
        { height: 150 },
      ]}
    >
      <View style={[t.relative, t.wFull, { height: 150 }]}>
        {/* Frame Image */}
        <CapturableImage
          imageKey="mini-app-frame"
          uri={imageUrl}
          style={[t.wFull, t.hFull, t.roundedLg, t.overflowHidden]}
        />

        {/* Action Button - Full Width */}
        <View style={[t.absolute, t.bottom0, t.wFull]}>
          <View style={[t.bgLightPurple, t.wFull, t.pY4, t.itemsCenter]}>
            <Text2 size="sm" style={t.directCasts.textLink} weight="semibold">
              {buttonText || 'View'}
            </Text2>
          </View>
        </View>
      </View>
    </View>
  );

  // Process cast text with formatting
  const { linkifiedText } = useLinkifyText({
    text: cast.text,
    mentions: cast.mentions
      ? (cast.mentions
          .map((mention) => mention.username)
          .filter(Boolean) as string[])
      : undefined,
    channelMentions: cast.channelMentions?.map(({ key }) => key),
  });

  // Get quoted casts from embeds
  const quotedCasts = useMemo(() => {
    return cast.embeds?.casts || [];
  }, [cast.embeds]);

  // Get all media items
  const allMedia = useMemo(() => {
    const media: Array<{
      type: 'image' | 'video';
      url: string;
      thumbnailUrl?: string;
    }> = [];

    // Add images
    if (cast.embeds?.images) {
      cast.embeds.images.forEach((image) => {
        media.push({
          type: 'image',
          url: image.url,
        });
      });
    }

    // Add videos
    if (cast.embeds?.videos) {
      cast.embeds.videos.forEach((video) => {
        media.push({
          type: 'video',
          url: video.sourceUrl,
          thumbnailUrl: video.thumbnailUrl,
        });
      });
    }

    return media;
  }, [cast.embeds]);

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: -Dimensions.get('window').width * 2,
          top: 0,
          width: Dimensions.get('window').width - 24,
        }}
      >
        <View style={[t.wFull]}>
          <View style={[t.wFull]}>
            <CapturableView
              ref={castImageRef}
              style={[t.pX3, t.pT3, t.pB2, t.bgDefault, { width: '100%' }]}
            >
              {/* Cast content with proper height handling */}
              <View style={[t.flexCol]}>
                {/* Cast author info */}
                <View style={[t.flexRow, t.justifyBetween, t.mB2]}>
                  <View style={[t.flexRow, t.itemsCenter]}>
                    <View style={[t.mR2]}>
                      <CapturableAvatar
                        imageKey="cast-author-pfp"
                        pfpUrl={cast.author.pfp?.url}
                        diameter={32}
                      />
                    </View>
                    <View>
                      <Text2 size="xs" weight="semibold">
                        {cast.author.username}
                      </Text2>
                      <Text2 size="xs" color="secondary">
                        {new Date(cast.timestamp).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text2>
                    </View>
                  </View>
                  <FarcasterArchIcon width={30} height={30} />
                </View>

                {cast.text && (
                  <Text2
                    size="sm"
                    style={[t.pY1]}
                    ellipsizeMode="tail"
                    numberOfLines={12}
                  >
                    {linkifiedText}
                  </Text2>
                )}

                {/* Media and Embeds Section */}
                <View style={[t.flexCol]}>
                  {/* Mini App Frame (if present) - shown first */}
                  {hasMiniApp && frameData && (
                    <MiniAppFrame
                      imageUrl={frameData.imageUrl || ''}
                      buttonText={frameData.buttonText || ''}
                      // Add smaller bottom margin if there are other embeds
                      hasOtherEmbeds={
                        allMedia.length > 0 || quotedCasts.length > 0
                      }
                    />
                  )}

                  {/* Single media item (image or video) */}
                  {totalEmbedsCount === 1 && allMedia.length > 0 && (
                    <View
                      style={[
                        hasMiniApp ? t.mT1 : t.mY2, // Smaller top margin if after mini app
                        t.wFull,
                      ]}
                    >
                      <MediaItem item={allMedia[0]} imageKey="media-0" />
                    </View>
                  )}

                  {/* Single quote cast */}
                  {quotedCasts.length === 1 &&
                    allMedia.length === 0 &&
                    !hasMiniApp && (
                      <SimplifiedQuoteCast quoteCast={quotedCasts[0]} />
                    )}

                  {/* Image + Quote mix */}
                  {allMedia.length === 1 &&
                    quotedCasts.length === 1 &&
                    !hasMiniApp && (
                      <View style={[t.flexCol, t.mY2]}>
                        <View style={[t.wFull]}>
                          <MediaItem item={allMedia[0]} imageKey="media-0" />
                        </View>
                        <SimplifiedQuoteCast quoteCast={quotedCasts[0]} />
                      </View>
                    )}

                  {/* Mini app + Quote cast */}
                  {hasMiniApp && frameData && quotedCasts.length === 1 && (
                    <SimplifiedQuoteCast quoteCast={quotedCasts[0]} />
                  )}

                  {/* Two media items side by side */}
                  {totalEmbedsCount === 2 &&
                    allMedia.length === 2 &&
                    quotedCasts.length === 0 &&
                    !hasMiniApp && (
                      <View
                        style={[t.mY2, t.wFull, t.flexRow, t.justifyBetween]}
                      >
                        <View
                          style={[
                            t.flex1,
                            t.mR1,
                            t.roundedLg,
                            t.border,
                            t.borderFaint,
                            t.overflowHidden,
                          ]}
                        >
                          <MediaItem item={allMedia[0]} imageKey="media-0" />
                        </View>
                        <View
                          style={[
                            t.flex1,
                            t.mL1,
                            t.roundedLg,
                            t.border,
                            t.borderFaint,
                            t.overflowHidden,
                          ]}
                        >
                          <MediaItem item={allMedia[1]} imageKey="media-1" />
                        </View>
                      </View>
                    )}
                </View>

                <View
                  style={[t.flexRow, t.justifyBetween, t.pT2, t.itemsCenter]}
                >
                  <Text2 size="xs" weight="medium" color="tertiary">
                    {(() => {
                      const parts = [];

                      // Only add like count if not zero
                      if (cast.reactions.count > 0) {
                        parts.push(
                          `${cast.reactions.count} like${cast.reactions.count === 1 ? '' : 's'}`,
                        );
                      }

                      // Only add recast count if not zero
                      if (cast.recasts.count > 0) {
                        parts.push(
                          `${cast.recasts.count} recast${cast.recasts.count === 1 ? '' : 's'}`,
                        );
                      }

                      // Only add reply count if not zero
                      if (cast.replies.count > 0) {
                        parts.push(
                          `${cast.replies.count} repl${cast.replies.count === 1 ? 'y' : 'ies'}`,
                        );
                      }

                      // Join with dots, but only if we have parts to join
                      return parts.join(' · ');
                    })()}
                  </Text2>
                  {cast.channel?.key && (
                    <Text2 size="xs" color="secondary" weight="semibold">
                      {`/${cast.channel.key}`}
                    </Text2>
                  )}
                </View>
              </View>
            </CapturableView>
          </View>
        </View>
      </View>
    </Modal>
  );
};
