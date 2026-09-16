import { AnalyticsEvent } from 'farcaster-analytics';
import { type ApiCast, type ApiQuoteCastEmbed } from 'farcaster-client-data';
import { CastClickType, useTrackCastClick } from 'farcaster-client-hooks';
import html2canvas from 'html2canvas';
import React, { useCallback, useMemo, useRef, useState } from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { Image as ImageCompontent } from '~/components/images/Image';
import { Logo } from '~/components/Logo';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { Modal } from '~/components/modals/Modal';
import { LinkifiedText } from '~/components/text/LinkifiedText';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { toast } from '~/utils/toast';

type CastImageViewerModalProps = {
  cast: ApiCast;
  onClose: () => void;
};

export const CastImageViewerModal: React.FC<CastImageViewerModalProps> =
  React.memo(({ cast, onClose }) => {
    const { trackEvent } = useAnalytics();
    const trackCastClick = useTrackCastClick();
    const castContentRef = useRef<HTMLDivElement>(null);
    const [isCapturing, setIsCapturing] = useState(false);

    // Function to capture cast as image and download it
    const handleCaptureImage = useCallback(async () => {
      if (!castContentRef.current) {
        return;
      }

      setIsCapturing(true);

      try {
        // Apply a temporary class to ensure proper rendering during capture
        castContentRef.current.classList.add('capturing');

        // Create a canvas that captures exactly what is displayed, at high resolution
        const canvas = await html2canvas(castContentRef.current, {
          backgroundColor: '#FFFFFF',
          scale: 8, // Even higher scale for maximum quality
          useCORS: true,
          allowTaint: true,
          logging: false,
          imageTimeout: 0,
          onclone: (clonedDoc) => {
            // Find all image elements and ensure they keep their styles
            const container = clonedDoc.querySelector('#cast-content');
            if (container) {
              // Pre-load all background images to ensure they're available during capture
              const elementsWithBgImage = container.querySelectorAll(
                '[style*="background-image"]',
              );
              elementsWithBgImage.forEach((el) => {
                // Extract the URL from background-image
                const style = window.getComputedStyle(el);
                const bgImage = style.backgroundImage;
                if (bgImage && bgImage !== 'none') {
                  const urlMatch = bgImage.match(/url\(['"]?(.*?)['"]?\)/);
                  if (urlMatch && urlMatch[1]) {
                    // Force high-quality image loading
                    const originalUrl = urlMatch[1];
                    // Add timestamp to bypass cache if needed
                    const timestamp = new Date().getTime();
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.src = originalUrl.includes('?')
                      ? `${originalUrl}&_t=${timestamp}`
                      : `${originalUrl}?_t=${timestamp}`;

                    // Replace with higher resolution version if possible
                    if (el instanceof HTMLElement) {
                      if (originalUrl.includes('&w=')) {
                        // Replace width parameter with higher value for URLs that support it
                        const highResUrl = originalUrl.replace(
                          /&w=\d+/,
                          '&w=1200',
                        );
                        el.style.backgroundImage = `url('${highResUrl}')`;
                      }
                    }
                  }
                }
              });

              // Add negative margin to username in main cast
              const mainCastUsername =
                container.querySelector('#cast-author-info');
              if (mainCastUsername) {
                (mainCastUsername as HTMLElement).style.marginTop = '-16px';
              }

              // Add negative margin to username in quote casts
              const quoteCastUsernames = container.querySelectorAll(
                '#quote-cast-author-username',
              );
              quoteCastUsernames.forEach((username) => {
                (username as HTMLElement).style.marginTop = '-16px';
              });

              // Add negative margin to text in quote casts
              const quoteCastText = container.querySelector('#quote-cast-text');
              if (quoteCastText) {
                (quoteCastText as HTMLElement).style.marginTop = '-8px';
              }

              // Add negative margin to button in mini-app
              const miniAppButton = container.querySelector('#mini-app-button');
              if (miniAppButton) {
                (miniAppButton as HTMLElement).style.marginTop = '-16px';
              }
            }
          },
        });

        // Remove temporary class
        castContentRef.current.classList.remove('capturing');

        // Crop the bottom 2 pixels from the image to eliminate border issues
        const croppedCanvas = document.createElement('canvas');
        const ctx = croppedCanvas.getContext('2d');
        if (ctx) {
          // Set dimensions for the cropped canvas (removing bottom pixels)
          const pixelsToCrop = 8;
          croppedCanvas.width = canvas.width;
          croppedCanvas.height = canvas.height - pixelsToCrop;

          // Draw the original canvas onto the cropped canvas, excluding the bottom pixels
          ctx.drawImage(
            canvas,
            0,
            0,
            canvas.width,
            canvas.height - pixelsToCrop,
            0,
            0,
            croppedCanvas.width,
            croppedCanvas.height,
          );
        }

        // Convert to highest-quality PNG and download
        const imageData = (ctx ? croppedCanvas : canvas).toDataURL(
          'image/png',
          1.0,
        );
        const link = document.createElement('a');
        link.href = imageData;
        link.download = `farcaster_cast_${cast.author.username}_${cast.hash.slice(0, 8)}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Track the event
        trackCastClick({ type: CastClickType.ShareImage });
        trackEvent(AnalyticsEvent.ClickCastShareableImage, undefined);

        toast({ message: 'Image downloaded' });
      } catch (error) {
        toast({ message: 'Failed to capture cast image', type: 'error' });
      } finally {
        setIsCapturing(false);
      }
    }, [cast.author.username, cast.hash, trackCastClick, trackEvent]);

    // Function to ensure we're using the highest quality image URL possible
    const getHighQualityImageUrl = (url: string) => {
      // Optimize image URL if it contains parameters that can be adjusted for quality
      if (!url) {
        return '';
      }

      if (url.includes('&w=') || url.includes('?w=')) {
        // Replace width parameter with higher value for better quality
        return url.replace(/([?&])w=\d+/, '$1w=1200');
      }

      // Add quality parameters for common image hosts if not already present
      if (url.includes('cloudinary.com') && !url.includes('q=')) {
        return url + (url.includes('?') ? '&q=100' : '?q=100');
      }

      return url;
    };

    // Create a component for handling avatar images properly
    const Avatar = ({
      src,
      alt,
      size = 32,
    }: {
      src: string;
      alt: string;
      size?: number;
    }) => {
      // Use the same high-quality URL approach as for embedded images
      const highQualitySrc = getHighQualityImageUrl(src || '');

      return (
        <div
          className="relative mr-2 flex items-center justify-center overflow-hidden rounded-full"
          style={{
            width: `${size}px`,
            height: `${size}px`,
          }}
        >
          <ImageCompontent
            src={highQualitySrc}
            alt={alt}
            className="size-full"
          />
        </div>
      );
    };

    // Simple Quote Cast component for the image viewer
    const SimplifiedQuoteCast = ({
      quoteCast,
    }: {
      quoteCast: ApiQuoteCastEmbed;
    }) => {
      // Truncate text to display only 2 lines
      const truncateText = (text: string) => {
        const maxCharsPerLine = 60; // Approximate characters per line
        const maxChars = maxCharsPerLine * 2; // For 2 lines

        let truncated = text;
        if (text.length > maxChars) {
          truncated = text.substring(0, maxChars).trim();
          // Ensure we don't cut in the middle of a word
          const lastSpace = truncated.lastIndexOf(' ');
          if (lastSpace > maxChars / 2) {
            truncated = truncated.substring(0, lastSpace);
          }
          truncated += '...';
        }

        return truncated;
      };

      return (
        <div className="my-2 rounded-lg border p-2 border-default">
          {/* Author header */}
          <div className="mb-1 flex items-center">
            <Avatar
              src={quoteCast.author.pfp?.url || ''}
              alt={quoteCast.author.username || 'username'}
              size={24}
            />
            <div
              id="quote-cast-author-username"
              className="text-xs font-semibold"
            >
              {quoteCast.author.username}
            </div>
          </div>

          {/* Cast text - manually truncated to avoid html2canvas issues */}
          <p
            id="quote-cast-text"
            className="text-xs"
            style={{ minHeight: '32px' }}
          >
            {truncateText(quoteCast.text)}
          </p>
        </div>
      );
    };

    // Media item renderer - handles both images and videos
    const MediaItem = ({
      item,
    }: {
      item: {
        type: 'image' | 'video';
        url: string;
        thumbnailUrl?: string;
        width: number;
        height: number;
      };
    }) => {
      const imageRatio = item.width / item.height;

      // Calculate appropriate height based on image ratio
      const imageHeight = useMemo(() => {
        return imageRatio
          ? imageRatio > 3
            ? // Very wide images (panoramas)
              85
            : // Wide images
              imageRatio > 1.5
              ? Math.max(120, 150 / imageRatio)
              : // Normal to tall images
                150
          : // Default before we know the ratio
            150;
      }, [imageRatio]);

      // Ensure we're using the highest quality image URL possible
      const optimizedImageUrl = getHighQualityImageUrl(item.url);

      if (item.type === 'video') {
        return <VideoThumbnail url={item.thumbnailUrl || item.url} />;
      }

      // For images
      return (
        <div
          className="flex w-full items-center justify-center overflow-hidden rounded-lg border border-default"
          style={{
            height: imageHeight,
          }}
        >
          <ImageCompontent
            src={optimizedImageUrl}
            alt="Embedded content"
            className="w-full"
            style={{
              imageRendering: 'crisp-edges',
            }}
          />
        </div>
      );
    };

    // Video thumbnail component with play button overlay
    const VideoThumbnail = ({ url }: { url: string }) => (
      <div
        className="relative size-full overflow-hidden rounded-lg"
        style={{ maxHeight: '150px' }}
      >
        <div
          className="bg-image-high-quality absolute inset-0"
          style={{
            backgroundImage: `url(${url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            imageRendering: 'crisp-edges' as const,
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-black p-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
    );

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
      <div
        className={`
        mt-2
        ${hasOtherEmbeds ? 'mb-1' : 'mb-2'}
        h-[150px]
        w-full
        overflow-hidden
        rounded-lg
        border
        border-default
      `}
      >
        <div className="relative h-[150px] w-full">
          {/* Frame Image - using background-image to prevent stretching */}
          <div
            className="bg-image-high-quality size-full rounded-lg"
            style={{
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative',
              imageRendering: 'crisp-edges' as const,
            }}
          />

          {/* Action Button - Full Width */}
          <div className="absolute bottom-0 w-full">
            <div className="flex w-full items-center justify-center !bg-[#F0EDFF] py-4 dark:!bg-[#342942]">
              <span
                id="mini-app-button"
                className="text-sm font-semibold !text-action-purple dark:!text-white"
              >
                {buttonText || 'View'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );

    // Process all media items (images and videos)
    const allMedia = React.useMemo(() => {
      const media: {
        type: 'image' | 'video';
        url: string;
        thumbnailUrl?: string;
        width: number;
        height: number;
      }[] = [];

      // Add images
      if (cast.embeds?.images) {
        cast.embeds.images.forEach((image) => {
          media.push({
            type: 'image',
            url: image.url,
            width: image.media?.width || 0,
            height: image.media?.height || 0,
          });
        });
      }

      // Add videos
      if (cast.embeds?.videos) {
        cast.embeds.videos.forEach((video) => {
          media.push({
            type: 'video',
            url: video.url,
            thumbnailUrl: video.thumbnailUrl,
            width: video.width || 0,
            height: video.height || 0,
          });
        });
      }

      return media;
    }, [cast.embeds]);

    // Extract quote casts for rendering
    const quotedCasts = React.useMemo(() => {
      return cast.embeds?.casts || [];
    }, [cast.embeds]);

    // Check if this cast has a mini app (frame)
    const hasMiniApp = React.useMemo(() => {
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

      return firstUrlHasFrameEmbedNext || firstUrlHasFrame;
    }, [cast.embeds]);

    // Get frame data if available
    const frameData = React.useMemo(() => {
      if (!hasMiniApp || !cast.embeds?.urls || cast.embeds.urls.length === 0) {
        return null;
      }

      const url = cast.embeds.urls[0];

      // Handle frameEmbedNext format
      if (url.openGraph?.frameEmbedNext) {
        const frameEmbed = url.openGraph.frameEmbedNext;

        // Extract image URL
        const imageUrl = frameEmbed.frameEmbed?.imageUrl;

        // Extract button text - handle both forms
        let buttonText = '';
        if (frameEmbed.frameEmbed?.button) {
          const button = frameEmbed.frameEmbed.button;
          if (
            typeof button === 'object' &&
            button &&
            'title' in button &&
            typeof button.title === 'string'
          ) {
            // First format - button has title property
            buttonText = button.title;
          } else if (
            Array.isArray(button) &&
            button.length > 0 &&
            typeof button[0] === 'object' &&
            button[0] &&
            'title' in button[0] &&
            typeof button[0].title === 'string'
          ) {
            // Second format - button is an array with title in first item
            buttonText = button[0].title;
          }
        }

        return { imageUrl, buttonText };
      }

      // Handle frame format
      if (url.openGraph?.frame) {
        const frame = url.openGraph.frame;

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
            'title' in firstButton &&
            typeof firstButton.title === 'string'
          ) {
            buttonText = firstButton.title;
          }
        }

        return { imageUrl, buttonText };
      }

      return null;
    }, [cast.embeds, hasMiniApp]);

    // Total number of embeds
    const totalEmbedsCount = React.useMemo(
      () =>
        (cast.embeds?.images?.length || 0) +
        (cast.embeds?.videos?.length || 0) +
        (cast.embeds?.casts?.length || 0),
      [cast.embeds],
    );

    // Function to truncate main cast text to 12 lines
    const truncateMainCastText = (text: string) => {
      if (!text) {
        return '';
      }

      const maxCharsPerLine = 60; // Approximate characters per line
      const maxChars = maxCharsPerLine * 12; // For 12 lines

      if (text.length <= maxChars) {
        return text;
      }

      let truncated = text.substring(0, maxChars).trim();
      // Ensure we don't cut in the middle of a word
      const lastSpace = truncated.lastIndexOf(' ');
      if (lastSpace > maxChars - 60) {
        // If last space is in the last line
        truncated = truncated.substring(0, lastSpace);
      }
      return truncated + '...';
    };

    return (
      <Modal>
        <DefaultModalContainer onClose={onClose}>
          <div className="flex size-full flex-col items-center justify-center p-4">
            <div
              className="flex h-auto w-[400px] flex-col items-start justify-center overflow-hidden rounded-lg border p-4 bg-app border-default"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <div className="w-full bg-app">
                {/* Wrapper with visual border - this is only for display purposes */}
                <div className="shadow-xs w-full overflow-hidden rounded-lg border border-default">
                  {/* Content that gets captured - has its own bg but no border */}
                  <div
                    id="cast-content"
                    ref={castContentRef}
                    className="w-full p-3 bg-app"
                  >
                    {/* Cast content with proper height handling */}
                    <div className="flex flex-col">
                      {/* Cast author info */}
                      <div className="mb-2 flex items-center justify-between">
                        <div
                          className="flex items-center"
                          style={{ alignItems: 'center' }}
                        >
                          <Avatar
                            src={cast.author.pfp?.url || ''}
                            alt={cast.author.username || 'username'}
                            size={32}
                          />
                          <div
                            id="cast-author-info"
                            style={{
                              display: 'inline-block',
                              verticalAlign: 'middle',
                              lineHeight: 1.2,
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: '14px',
                                marginBottom: '2px',
                              }}
                            >
                              {cast.author.username}
                            </div>
                            <div style={{ fontSize: '12px', color: '#8b8b8b' }}>
                              {new Date(cast.timestamp).toLocaleDateString(
                                'en-US',
                                {
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric',
                                },
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Farcaster logo - matches mobile app */}
                        <Logo />
                      </div>

                      {/* Cast text */}
                      {cast.text && (
                        <div className="whitespace-pre-wrap break-words py-1 text-sm">
                          <LinkifiedText
                            content={truncateMainCastText(cast.text)}
                            mentions={cast.mentions}
                            channelMentions={cast.channelMentions}
                            tokenMentions={undefined}
                            tokenMentionsV2={undefined}
                          />
                        </div>
                      )}

                      {/* Media and Embeds Section */}
                      <div className="flex flex-col">
                        {/* Mini App Frame (if present) - shown first */}
                        {hasMiniApp && frameData && (
                          <MiniAppFrame
                            imageUrl={frameData.imageUrl || ''}
                            buttonText={frameData.buttonText || ''}
                            hasOtherEmbeds={
                              allMedia.length > 0 || quotedCasts.length > 0
                            }
                          />
                        )}

                        {/* Single media item (image or video) */}
                        {totalEmbedsCount === 1 && allMedia.length > 0 && (
                          <div
                            className={`
                            ${hasMiniApp ? 'mt-1' : 'my-2'}
                            w-full
                            overflow-hidden
                            rounded-lg
                          `}
                            style={{ position: 'relative' }}
                          >
                            <MediaItem item={allMedia[0]} />
                          </div>
                        )}

                        {/* Single quote cast */}
                        {quotedCasts.length === 1 &&
                          allMedia.length === 0 &&
                          !hasMiniApp && (
                            <SimplifiedQuoteCast quoteCast={quotedCasts[0]} />
                          )}

                        {/* Image + Quote mix - adding support for this case */}
                        {allMedia.length === 1 &&
                          quotedCasts.length === 1 &&
                          !hasMiniApp && (
                            <div className="my-2 flex flex-col">
                              <div className="h-[150px] w-full overflow-hidden rounded-lg">
                                <MediaItem item={allMedia[0]} />
                              </div>
                              <SimplifiedQuoteCast quoteCast={quotedCasts[0]} />
                            </div>
                          )}

                        {/* Mini app + Quote cast */}
                        {hasMiniApp &&
                          frameData &&
                          quotedCasts.length === 1 && (
                            <SimplifiedQuoteCast quoteCast={quotedCasts[0]} />
                          )}

                        {/* Side by side images (2 images only) */}
                        {allMedia.length === 2 && (
                          <div className="my-2 flex w-full space-x-1">
                            <div className="h-[150px] w-1/2 overflow-hidden rounded-lg">
                              <MediaItem item={allMedia[0]} />
                            </div>
                            <div className="h-[150px] w-1/2 overflow-hidden rounded-lg">
                              <MediaItem item={allMedia[1]} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Reactions and channel row */}
                    <div className="flex flex-row justify-between pt-2">
                      <div className="text-xs font-medium text-faint">
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
                      </div>
                      {cast.channel?.key && (
                        <div className="text-xs font-semibold text-muted">
                          {`/${cast.channel.key}`}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Download button */}
              <div className="mt-2 flex w-full justify-center">
                <DefaultButton
                  variant="normal"
                  size="md"
                  isLoading={isCapturing}
                  disabled={isCapturing}
                  onClick={handleCaptureImage}
                  className="w-full !py-3"
                >
                  {isCapturing ? 'Capturing...' : 'Download image'}
                </DefaultButton>
              </div>
            </div>
          </div>
        </DefaultModalContainer>
      </Modal>
    );
  });

CastImageViewerModal.displayName = 'CastImageViewerModal';
