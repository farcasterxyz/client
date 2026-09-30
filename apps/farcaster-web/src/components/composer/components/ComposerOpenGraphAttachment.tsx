import { XIcon } from '@primer/octicons-react';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiCast,
  ApiCastEmbeds,
  ApiFrameEmbedNextExtended,
} from 'farcaster-client-data';
import {
  buildQuoteCastUrlSet,
  DEFAULT_CAST_FID,
  DEFAULT_CAST_HASH,
  isQuoteCastUrl,
  isSnapEmbed,
  useGloballyCachedFrame,
  useNonSuspenseFrameDetails,
  useTrackEvent,
} from 'farcaster-client-hooks';
import React from 'react';

import { ArticleAttachment } from '~/components/attachments/ArticleAttachment';
import { DeprecatedFrameBanner } from '~/components/attachments/DeprecatedFrameBanner';
import { FrameEmbedAttachment } from '~/components/attachments/FrameEmbedAttachment';
import { GroupInviteAttachment } from '~/components/attachments/GroupInviteAttachment';
import { OpenGraphAttachment } from '~/components/attachments/OpenGraphAttachment';
import { QuoteCast } from '~/components/attachments/QuoteCast';
import { QuoteTweet } from '~/components/attachments/QuoteTweet';
import { SnapEmbedAttachment } from '~/components/attachments/SnapEmbedAttachment';
import {
  matchSpaceUrl,
  SpaceEmbedAttachment,
} from '~/components/attachments/SpaceEmbedAttachment';
import { TokenEmbed } from '~/components/attachments/Token';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { getOpenGraphType } from '~/hooks/openGraph/useOpenGraphType';

interface ComposerOpenGraphAttachmentProps {
  embeds: ApiCastEmbeds;
  processingEmbeds: boolean;
  removeUrlEmbedClick: ({ url }: { url: string }) => void;
  refreshable?: boolean;
  onRefreshClick?: (url: string) => void;
}

const ComposerOpenGraphAttachment: React.FC<
  ComposerOpenGraphAttachmentProps
> = ({
  embeds,
  processingEmbeds,
  removeUrlEmbedClick,
  refreshable,
  onRefreshClick,
}) => {
  const { trackEvent } = useTrackEvent();

  // Track when a studio-generated mini app is embedded in a cast
  React.useEffect(() => {
    for (const urlEmbed of embeds.urls ?? []) {
      if (
        urlEmbed.openGraph?.frameEmbedNext?.frameEmbed &&
        urlEmbed.openGraph.url
      ) {
        try {
          const hostname = new URL(urlEmbed.openGraph.url).hostname;
          if (hostname.endsWith('.neynar.app')) {
            trackEvent(AnalyticsEvent.StudioGeneratedAppSharedInCast, {
              frameDomain: hostname,
              frameUrl: urlEmbed.openGraph.url,
            });
          }
        } catch {
          // ignore invalid URLs
        }
      }
    }
  }, [embeds.urls, trackEvent]);

  const defaultCast = React.useMemo<ApiCast>(
    () => ({
      author: {
        fid: DEFAULT_CAST_FID,
        username: '',
        displayName: '',
        profile: { bio: { text: '', mentions: [] } },
        followerCount: 0,
        followingCount: 0,
      },
      hash: DEFAULT_CAST_HASH,
      threadHash: DEFAULT_CAST_HASH,
      timestamp: Date.now(),
      text: '',
      embeds,
      replies: { count: 0 },
      reactions: { count: 0 },
      recasts: { count: 0 },
      watches: { count: 0 },
    }),
    [embeds],
  );

  return React.useMemo(() => {
    if (processingEmbeds) {
      return (
        <div className="flex w-full flex-row justify-center py-1">
          <LoadingIndicator size="md" />
        </div>
      );
    }

    const quotes =
      typeof embeds !== 'undefined' && typeof embeds.casts !== 'undefined'
        ? embeds.casts
        : [];

    const quoteCastUrls = buildQuoteCastUrlSet({ quotes });

    const groupInvites =
      typeof embeds !== 'undefined' &&
      typeof embeds.groupInvites !== 'undefined'
        ? embeds.groupInvites
        : [];

    const urlEmbeds = embeds.urls ?? [];

    const tokenV2Embeds = urlEmbeds
      .filter((o) => typeof o.tokenV2 !== 'undefined')
      .map((o) => o);

    const newsEmbeds = urlEmbeds
      .filter((o) => getOpenGraphType({ urlEmbed: o.openGraph }) === 'news')
      .map((o) => o);

    const newsEmbedUrls = new Set(newsEmbeds.map((o) => o.openGraph.url));

    const urls = urlEmbeds.filter(
      (url) =>
        typeof url.tokenV2 === 'undefined' &&
        !newsEmbedUrls.has(url.openGraph.url) &&
        !isQuoteCastUrl({
          url: url.openGraph.url,
          sourceUrl: url.openGraph.sourceUrl,
          quoteCastUrls,
        }),
    );

    const images = embeds.images ?? [];

    return (
      <>
        {images.map((image) => (
          <div className="relative py-1" key={image.sourceUrl}>
            <div
              className="absolute right-0 top-0 z-10 mr-2 mt-2 flex cursor-pointer justify-center rounded-full p-0.5 bg-overlay-heavy"
              onClick={() => {
                removeUrlEmbedClick({ url: image.sourceUrl });
              }}
            >
              <XIcon size={20} className="font-semibold text-white" />
            </div>
            <img
              className="h-auto w-full rounded-lg border object-contain border-default"
              src={image.url}
              alt={image.alt || image.sourceUrl}
              loading="lazy"
            />
          </div>
        ))}
        {urls.map((embed, index) => {
          if (
            embed.openGraph &&
            embed.openGraph.frameEmbedNext &&
            embed.openGraph.frameEmbedNext.frameEmbed
          ) {
            return (
              <ComposerFrameEmbed
                key={embed.openGraph.url}
                cast={defaultCast}
                frameEmbed={embed.openGraph.frameEmbedNext}
                refreshable={refreshable}
                onRefreshClick={
                  onRefreshClick
                    ? () => onRefreshClick(embed.openGraph.url)
                    : undefined
                }
                removeUrlEmbedClick={removeUrlEmbedClick}
                url={embed.openGraph.url}
              />
            );
          }

          if (
            embed.openGraph &&
            embed.openGraph.image &&
            embed.openGraph.domain &&
            embed.openGraph.frame
          ) {
            return (
              <div className="py-1" key={index}>
                <DeprecatedFrameBanner />
              </div>
            );
          }

          if (embed.openGraph && embed && typeof embed.tweet !== 'undefined') {
            return (
              <div className="relative py-1" key={index}>
                <div
                  className="absolute right-0 top-0 z-10 mr-2 mt-3 flex cursor-pointer justify-center rounded-full p-0.5 bg-overlay-heavy"
                  onClick={() => {
                    removeUrlEmbedClick({
                      url: embed.openGraph.url,
                    });
                  }}
                >
                  <XIcon size={20} className="font-semibold text-white" />
                </div>
                <QuoteTweet
                  embed={embed}
                  url={embed.openGraph.url}
                  title={embed.openGraph.title || ''}
                  tweet={embed.openGraph.description || ''}
                  skipWrapperStyles={false}
                />
              </div>
            );
          }

          if (matchSpaceUrl(embed.openGraph.url)) {
            return (
              <div className="relative py-1" key={embed.openGraph.url}>
                <button
                  type="button"
                  aria-label="Remove attachment"
                  className="absolute right-0 top-0 z-10 mr-2 mt-4 flex cursor-pointer justify-center rounded-full p-0.5 bg-overlay-heavy"
                  onClick={() => {
                    removeUrlEmbedClick({
                      url: embed.openGraph.url,
                    });
                  }}
                >
                  <XIcon size={20} className="font-semibold text-white" />
                </button>
                <SpaceEmbedAttachment url={embed.openGraph.url} />
              </div>
            );
          }

          return (
            <div className="relative py-1" key={embed.openGraph.url}>
              <div
                className="absolute right-0 top-0 z-10 mr-2 mt-4 flex cursor-pointer justify-center rounded-full p-0.5 bg-overlay-heavy"
                onClick={() => {
                  removeUrlEmbedClick({
                    url: embed.openGraph.url,
                  });
                }}
              >
                <XIcon size={20} className="font-semibold text-white" />
              </div>
              {isSnapEmbed(embed) ? (
                <SnapEmbedAttachment embed={embed} cast={defaultCast} />
              ) : (
                <OpenGraphAttachment
                  embed={embed}
                  attachment={embed.openGraph}
                  disabled
                />
              )}
            </div>
          );
        })}
        {quotes.map((cast, index) => (
          <span key={index}>
            <QuoteCast cast={cast} disabled={true} />
          </span>
        ))}
        {groupInvites.length > 0 && (
          <div className="flex flex-col space-y-1">
            {groupInvites.map((groupInvite) => (
              <span key={groupInvite.inviteCode}>
                <GroupInviteAttachment
                  groupInvite={groupInvite}
                  disabled={true}
                />
              </span>
            ))}
          </div>
        )}
        {tokenV2Embeds.length > 0 &&
          tokenV2Embeds.map((embed) => {
            if (typeof embed.tokenV2 !== 'undefined') {
              return (
                <div className="relative py-1" key={embed.openGraph.url}>
                  <div
                    className="absolute right-0 top-0 z-10 mr-2 mt-4 flex cursor-pointer justify-center rounded-full p-0.5 bg-overlay-heavy"
                    onClick={() => {
                      removeUrlEmbedClick({ url: embed.openGraph.url });
                    }}
                  >
                    <XIcon size={20} className="font-semibold text-white" />
                  </div>
                  <TokenEmbed token={embed.tokenV2} disabled={true} />
                </div>
              );
            }
          })}
        {newsEmbeds.length > 0 &&
          newsEmbeds.map((embed) => {
            return (
              <div className="relative py-1" key={embed.openGraph.url}>
                <div
                  className="absolute right-0 top-0 z-10 mr-2 mt-4 flex cursor-pointer justify-center rounded-full p-0.5 bg-overlay-heavy"
                  onClick={() => {
                    removeUrlEmbedClick({ url: embed.openGraph.url });
                  }}
                >
                  <XIcon size={20} className="font-semibold text-white" />
                </div>
                <ArticleAttachment og={embed.openGraph} disabled={true} />
              </div>
            );
          })}
      </>
    );
  }, [
    embeds,
    processingEmbeds,
    removeUrlEmbedClick,
    refreshable,
    onRefreshClick,
    defaultCast,
  ]);
};

function ComposerFrameEmbed({
  cast,
  frameEmbed,
  refreshable,
  onRefreshClick,
  removeUrlEmbedClick,
  url,
}: {
  cast: ApiCast;
  frameEmbed: ApiFrameEmbedNextExtended;
  refreshable?: boolean;
  onRefreshClick?: () => void;
  removeUrlEmbedClick: ({ url }: { url: string }) => void;
  url: string;
}) {
  const domain = React.useMemo(() => {
    try {
      return new URL(frameEmbed.frameUrl).hostname;
    } catch {
      return '';
    }
  }, [frameEmbed.frameUrl]);

  const { data } = useNonSuspenseFrameDetails({ domain, enabled: !!domain });
  const frame = useGloballyCachedFrame(data);

  React.useEffect(() => {
    if (frame?.harmful) {
      removeUrlEmbedClick({ url });
    }
  }, [frame?.harmful, removeUrlEmbedClick, url]);

  if (frame?.harmful) {
    return null;
  }

  return (
    <FrameEmbedAttachment
      cast={cast}
      frameEmbed={frameEmbed}
      disabled
      refreshable={refreshable}
      onRefreshClick={onRefreshClick}
    />
  );
}

export { ComposerOpenGraphAttachment };
