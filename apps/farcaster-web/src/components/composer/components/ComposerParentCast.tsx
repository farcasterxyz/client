import {
  ApiCast,
  ApiCastImageEmbed,
  ApiCastVideoEmbed,
} from 'farcaster-client-data';
import {
  formatTimeAgo,
  resolveUsername,
  useNonSuspenseThread,
} from 'farcaster-client-hooks';
import { PlayIcon } from 'lucide-react';
import React from 'react';

import {
  matchSpaceUrl,
  SpaceEmbedAttachment,
} from '~/components/attachments/SpaceEmbedAttachment';
import { Avatar } from '~/components/avatar/Avatar';
import { EmbedAvatar } from '~/components/avatar/EmbedAvatar';
import { FarcasterProBadge } from '~/components/badges/FarcasterProBadge';
import { Threadline } from '~/components/casts/Threadline';
import { Image } from '~/components/images/Image';
import { LinkToProfile } from '~/components/links/LinkToProfile';
import { useComposer } from '~/contexts/ComposerParentCastProvider';
import { useUserAppContext } from '~/contexts/UserAppContextProvider';
import { useUserLevel } from '~/hooks/data/useUserLevel';

type ComposerParentCastProps = {
  parentCastHash: string;
  parentCast?: ApiCast;
};

const ComposerParentCast: React.FC<ComposerParentCastProps> = React.memo(
  ({ parentCastHash, parentCast: parentCastFromIntent }) => {
    if (
      typeof parentCastFromIntent !== 'undefined' &&
      parentCastFromIntent.hash === parentCastHash
    ) {
      return <ComposerParentCastWithCast parentCast={parentCastFromIntent} />;
    }

    return <ComposerParentCastFetcher parentCastHash={parentCastHash} />;
  },
);

const ComposerParentCastWithCast: React.FC<{
  parentCast: ApiCast;
}> = React.memo(({ parentCast }) => {
  const { onParentCastLoad } = useComposer();

  React.useEffect(() => {
    onParentCastLoad({ parentCast });
  }, [onParentCastLoad, parentCast]);

  if (parentCast.deleted) {
    return (
      <div className="mb-4 flex flex-row text-muted">
        This cast has been deleted
      </div>
    );
  }

  return <ComposerParentCastContent parentCast={parentCast} />;
});

const ComposerParentCastFetcher: React.FC<{
  parentCastHash: string;
}> = React.memo(({ parentCastHash }) => {
  const { onParentCastLoad } = useComposer();

  const { data, isError, isLoading } = useNonSuspenseThread({
    castHash: parentCastHash,
    throwOnError: false,
  });

  const parentCast = React.useMemo(() => {
    if (!data?.pages) {
      return undefined;
    }
    return data.pages
      .flatMap((page) => page.result.casts)
      .find((cast) => cast.hash === parentCastHash);
  }, [data, parentCastHash]);

  React.useEffect(() => {
    if (typeof parentCast !== 'undefined') {
      onParentCastLoad({ parentCast });
    }
  }, [onParentCastLoad, parentCast]);

  if (isLoading) {
    return (
      <div className="mb-4 flex flex-row text-muted">
        Loading parent cast...
      </div>
    );
  }

  if (isError || typeof parentCast === 'undefined') {
    return <ReplyingToCastFallback />;
  }

  if (parentCast.deleted) {
    return (
      <div className="mb-4 flex flex-row text-muted">
        This cast has been deleted
      </div>
    );
  }

  return <ComposerParentCastContent parentCast={parentCast} />;
});

const ComposerParentCastContent: React.FC<{
  parentCast: ApiCast;
}> = React.memo(({ parentCast }) => {
  const { regularCastByteLimit } = useUserAppContext();

  const parentCastSpaceEmbedUrls = React.useMemo(() => {
    return (parentCast.embeds?.urls ?? [])
      .map((urlEmbed) => urlEmbed.openGraph.url)
      .filter((url) => !!matchSpaceUrl(url));
  }, [parentCast.embeds?.urls]);

  const truncatedCastText = React.useMemo(() => {
    let text = parentCast.text;

    while (true) {
      const trailingSpaceUrl = parentCastSpaceEmbedUrls.find((spaceUrl) =>
        text.endsWith(spaceUrl),
      );

      if (typeof trailingSpaceUrl === 'undefined') {
        break;
      }

      text = text.slice(0, -trailingSpaceUrl.length).trimEnd();
    }

    if (text.length <= regularCastByteLimit) {
      return text;
    }

    return text.slice(0, regularCastByteLimit);
  }, [parentCast.text, parentCastSpaceEmbedUrls, regularCastByteLimit]);

  const parentCastAuthorIsProUser = useUserLevel(parentCast.author) === 'pro';

  const imageEmbeds = React.useMemo(() => {
    return parentCast.embeds?.images || [];
  }, [parentCast.embeds?.images]);

  const videoEmbeds = React.useMemo(() => {
    return parentCast.embeds?.videos || [];
  }, [parentCast.embeds?.videos]);

  return (
    <div className="relative pb-3">
      <Threadline threadPosition="composer_start" />
      <div className="relative flex flex-col">
        <div className="relative flex">
          {parentCast.castType === 'root-embed' ? (
            <EmbedAvatar user={parentCast.author} className="relative mr-2" />
          ) : (
            <Avatar
              user={parentCast.author}
              className="relative mr-2"
              disabled={true}
            />
          )}
          <div className="relative w-full min-w-0">
            {parentCast.castType === 'root-embed' ? (
              <div className="text-base font-semibold text-default">
                {parentCast.author.displayName}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <div className="relative truncate text-base font-semibold text-default">
                  {parentCast.author.displayName}
                </div>
                <div className="relative text-muted">
                  {resolveUsername({
                    username: parentCast.author.username,
                    fid: parentCast.author.fid,
                  })}
                </div>
                {parentCastAuthorIsProUser && <FarcasterProBadge size={18} />}
                <div className="text-muted">·</div>
                <div className="text-muted">
                  {formatTimeAgo(parentCast.timestamp)}
                </div>
              </div>
            )}
            {parentCast.parentAuthor && (
              <div className="pt-1 text-xs text-muted">
                Replying to{' '}
                <LinkToProfile
                  title={parentCast.parentAuthor.displayName}
                  user={parentCast.parentAuthor}
                  className="relative hover:underline"
                >
                  {resolveUsername({
                    username: parentCast.parentAuthor.username,
                    fid: parentCast.parentAuthor.fid,
                  })}
                </LinkToProfile>
              </div>
            )}
            <div className="line-clamp-feed flex flex-col whitespace-pre-wrap break-words text-base">
              <div className="line-clamp-5">{truncatedCastText}</div>
              {(imageEmbeds.length !== 0 || videoEmbeds.length !== 0) && (
                <div className="scrollbar-hide mt-3 flex flex-row gap-2 overflow-x-auto">
                  {(parentCast.embeds?.videos || []).map((video, index) => (
                    <QuoteCastVideoEmbed key={index} video={video} />
                  ))}
                  {parentCast.embeds?.images.map((image, index) => (
                    <QuoteCastImageEmbed key={index} image={image} />
                  ))}
                </div>
              )}
              {parentCastSpaceEmbedUrls.length > 0 && (
                <div className="mt-3 flex w-full flex-col gap-2">
                  {parentCastSpaceEmbedUrls.map((spaceUrl) => (
                    <SpaceEmbedAttachment key={spaceUrl} url={spaceUrl} />
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-row items-center gap-1 pt-3 text-sm text-muted">
              Replying to{' '}
              {parentCast.castType === 'root-embed' ? (
                <span>external content</span>
              ) : (
                <>
                  <LinkToProfile
                    title={parentCast.author.displayName}
                    user={parentCast.author}
                    className="relative hover:underline"
                  >
                    {resolveUsername({
                      username: parentCast.author.username,
                      fid: parentCast.author.fid,
                    })}
                  </LinkToProfile>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

function QuoteCastVideoEmbed({ video }: { video: ApiCastVideoEmbed }) {
  return (
    <div className="relative size-32">
      <Image
        src={video.thumbnailUrl || ''}
        alt={'quote video'}
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
  );
}

function QuoteCastImageEmbed({ image }: { image: ApiCastImageEmbed }) {
  return (
    <div className="relative size-32">
      <Image
        src={image.url}
        alt={'quote image'}
        width={128}
        height={128}
        className="aspect-square content-center rounded-[12px] border object-cover border-default"
      />
    </div>
  );
}

function ReplyingToCastFallback() {
  return (
    <div className="mb-4 flex flex-row text-muted">
      Replying to cast (preview unavailable). You can still send your reply.
    </div>
  );
}

export { ComposerParentCast };
