import { ApiCast, ApiMediaV2 } from 'farcaster-client-data';
import { processMediasForRendering } from 'farcaster-client-hooks';
import { ImageIcon, Languages, PlayIcon, Video } from 'lucide-react';
import React, { FC, memo, MouseEvent, useMemo } from 'react';

import {
  matchSpaceUrl,
  SpaceEmbedAttachment,
} from '~/components/attachments/SpaceEmbedAttachment';
import { Image } from '~/components/images/Image';
import { useCastTranslationDisplay } from '~/hooks/casts/useCastTranslationDisplay';

type NotificationGroupCastTextProps = {
  cast: ApiCast;
};

const NotificationGroupCastText: FC<NotificationGroupCastTextProps> = memo(
  ({ cast }) => {
    const {
      displayText,
      hasTranslation,
      isTranslationPending,
      showOriginal,
      sourceLanguageName,
      toggleLabel,
      toggleTranslation,
    } = useCastTranslationDisplay(cast);

    return (
      <div className="flex flex-col gap-2">
        {(hasTranslation || isTranslationPending) && (
          <NotificationGroupCastTranslationState
            hasTranslation={hasTranslation}
            isTranslationPending={isTranslationPending}
            showOriginal={showOriginal}
            sourceLanguageName={sourceLanguageName}
            toggleLabel={toggleLabel}
            onToggle={toggleTranslation}
          />
        )}
        <div className="line-clamp-2 text-sm text-muted break-gracefully">
          {displayText}
        </div>
        <NotificationGroupCastTextEmbeds cast={cast} />
      </div>
    );
  },
);

type NotificationGroupCastTranslationStateProps = {
  hasTranslation: boolean;
  isTranslationPending: boolean;
  showOriginal: boolean;
  sourceLanguageName: string;
  toggleLabel: string;
  onToggle: () => void;
};

const NotificationGroupCastTranslationState: FC<NotificationGroupCastTranslationStateProps> =
  memo(
    ({
      hasTranslation,
      isTranslationPending,
      showOriginal,
      sourceLanguageName,
      toggleLabel,
      onToggle,
    }) => {
      const onToggleClick = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle();
      };

      if (isTranslationPending) {
        return (
          <div className="flex flex-row items-center gap-1 text-xs text-faint">
            <Languages size={12} />
            <span>translation pending...</span>
          </div>
        );
      }

      if (!hasTranslation) {
        return null;
      }

      return (
        <div className="flex flex-row items-center justify-between gap-2 text-xs text-faint">
          <div className="flex min-w-0 flex-row items-center gap-1">
            <Languages size={12} className="shrink-0" />
            <span className="truncate">
              translated from {sourceLanguageName}
            </span>
          </div>
          <button
            type="button"
            className="relative z-10 shrink-0 font-medium text-link hover:underline"
            aria-pressed={showOriginal}
            aria-label={
              showOriginal ? 'Show translated text' : 'Show original text'
            }
            onClick={onToggleClick}
          >
            {toggleLabel}
          </button>
        </div>
      );
    },
  );

const NotificationGroupCastTextEmbeds: FC<{
  cast: ApiCast;
}> = memo(({ cast }) => {
  const spaceUrl = useMemo(() => {
    const urls = cast.embeds?.urls ?? [];

    for (const urlEmbed of urls) {
      const url = urlEmbed.openGraph?.url;
      if (typeof url === 'string' && matchSpaceUrl(url)) {
        return url;
      }
    }

    return undefined;
  }, [cast.embeds?.urls]);

  const pills = useMemo(() => {
    const embeds = cast.embeds;
    if (!embeds) {
      return [];
    }

    const pills = [];
    if (embeds.images.length > 0) {
      const mediaImageEmbeds = embeds.images.map((image) => {
        if (typeof image.media !== 'undefined') {
          return image.media as ApiMediaV2;
        }

        return {
          version: '2',
          staticRaster: image.url,
          height: 1000,
          width: 1000,
        } satisfies ApiMediaV2;
      });

      const imagesToRender = processMediasForRendering({
        medias: mediaImageEmbeds,
        pixelDensity: 3,
        blockAnimated: false,
        useLowQualityImages: false,
      });

      for (const ei of imagesToRender) {
        pills.push({
          type: 'image',
          Icon: <ImageIcon size={14} className="text-muted" />,
          label: 'image',
          url: ei.thumbnail,
        });
      }
    }

    if (embeds.videos && embeds.videos.length > 0) {
      for (const vi of embeds.videos) {
        pills.push({
          type: 'video',
          Icon: <Video size={14} className="text-muted" />,
          label: 'video',
          url: vi.thumbnailUrl,
        });
      }
    }

    return pills;
  }, [cast.embeds]);

  if (pills.length === 0 && typeof spaceUrl === 'undefined') {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {pills.length > 0 && (
        <div className="flex flex-row flex-wrap gap-0.5">
          {pills.map(({ Icon, label, type, url }, index) => {
            if (type === 'image' && typeof url !== 'undefined') {
              return (
                <div key={`${label}-${index}`}>
                  <div className="relative size-32">
                    <Image
                      src={url}
                      alt={'notification cast image'}
                      width={128}
                      height={128}
                      className="aspect-square content-center rounded-[12px] border object-cover border-default"
                    />
                  </div>
                </div>
              );
            }

            if (type === 'video') {
              return (
                <div key={`${label}-${index}`}>
                  <div className="relative size-32">
                    <Image
                      src={url || ''}
                      alt={'notification cast video'}
                      width={128}
                      height={128}
                      className="aspect-square content-center rounded-[12px] border object-cover border-default"
                    />
                    <div className="absolute inset-0 flex size-full flex-col items-center justify-center">
                      <div
                        className={
                          'flex size-12 flex-row items-center justify-center rounded-full bg-black/75'
                        }
                      >
                        <PlayIcon className="text-light" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={`${label}-${index}`}
                className="flex flex-row items-center gap-0.5 rounded-full px-1.5 py-0.5 bg-elevated"
              >
                {Icon}
                <span className="text-xs font-medium text-muted">{label}</span>
              </div>
            );
          })}
        </div>
      )}
      {typeof spaceUrl === 'string' && <SpaceEmbedAttachment url={spaceUrl} />}
    </div>
  );
});

NotificationGroupCastText.displayName = 'NotificationGroupCastText';

export { NotificationGroupCastText };
