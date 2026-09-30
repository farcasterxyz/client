import classNames from 'classnames';
import { ApiCastUrlEmbed } from 'farcaster-client-data';
import { formatTimeAgo } from 'farcaster-client-hooks';
import { PlayIcon } from 'lucide-react';
import React from 'react';

import { AvatarImage } from '~/components/avatar/AvatarImage';
import { XTopHatIcon } from '~/components/casts/actions/icons/XTopHatIcon';
import { Image } from '~/components/images/Image';
import { applyCloudflarePath } from '~/utils/images';

interface QuoteTweetProps {
  embed: ApiCastUrlEmbed;
  url: string;
  title: string;
  tweet: string;
  skipWrapperStyles: boolean;
}

function QuoteTweetV1({ title, tweet, skipWrapperStyles }: QuoteTweetProps) {
  const titleFormatted = React.useMemo(() => {
    return title.indexOf('on Twitter') !== -1
      ? title.split('on Twitter')[0]
      : title.split('on X')[0];
  }, [title]);

  const displayNameFromTitleFormatted = React.useMemo(() => {
    return titleFormatted.indexOf(' (@') !== -1
      ? titleFormatted.split(' (@')[0]
      : titleFormatted;
  }, [titleFormatted]);

  const usernameFromTitleFormatted = React.useMemo(() => {
    return titleFormatted.indexOf(' (@') !== -1
      ? titleFormatted.split(' (@')[1].split(')')[0]
      : undefined;
  }, [titleFormatted]);

  return (
    <div
      className={classNames(
        skipWrapperStyles
          ? ''
          : 'border border-default hover:bg-[#0000000d] dark:hover:bg-[#ffffff0d]',
        'flex w-full flex-col rounded-[12px] p-3 pt-2',
      )}
    >
      <div className="flex max-w-sm flex-row items-center space-x-1 truncate">
        <span className="text-inherit opacity-75">
          <XTopHatIcon />
        </span>
        <div className="max-w-sm truncate font-semibold text-inherit">
          {displayNameFromTitleFormatted}
        </div>
        {typeof usernameFromTitleFormatted !== 'undefined' && (
          <div className="text-inherit opacity-75">
            @{usernameFromTitleFormatted}
          </div>
        )}
      </div>
      <div className="mt-1 line-clamp-5 text-base leading-5 tracking-normal break-gracefully">
        {tweet}
      </div>
    </div>
  );
}

function QuoteTweetV2({
  tweet,
  skipWrapperStyles,
}: {
  tweet: ParsedTweetPayload;
  skipWrapperStyles: boolean;
}) {
  return (
    <div
      className={classNames(
        skipWrapperStyles
          ? ''
          : 'border border-default hover:bg-[#0000000d] dark:hover:bg-[#ffffff0d]',
        'flex w-full flex-col rounded-[12px] py-2',
      )}
    >
      <div className="flex flex-row items-center justify-between px-3">
        <div className="-ml-px flex flex-row items-center gap-1.5 overflow-hidden">
          <AvatarImage
            size={'xs'}
            imgUrl={tweet.avatar}
            imgAlt={`${tweet.displayName} avatar`}
          />
          <div className="text-base font-semibold text-inherit">
            {tweet.displayName}
          </div>
          <div className="text-base font-normal text-faint">
            @{tweet.username}
          </div>
          <div className="text-base font-normal text-faint">
            {tweet.createdAtDisplay}
          </div>
        </div>
        <XTopHatIcon size={12} />
      </div>
      {tweet.text.length !== 0 && (
        <div className="line-clamp-feed mt-1 px-3">{tweet.text}</div>
      )}
      {tweet.attachments.length !== 0 && (
        <div className="scrollbar-hide m-3 flex flex-row gap-2 overflow-x-auto">
          {tweet.attachments
            .filter((o) => o.type === 'video')
            .map((video, index) => (
              <QuoteTweetVideoEmbed key={index} video={video} />
            ))}
          {tweet.attachments
            .filter((o) => o.type === 'photo')
            .map((image, index) => (
              <QuoteTweetImageEmbed key={index} image={image} />
            ))}
        </div>
      )}
    </div>
  );
}

function QuoteTweetVideoEmbed({ video }: { video: Attachment }) {
  const src = React.useMemo(() => {
    return applyCloudflarePath(video.url, 128);
  }, [video.url]);

  return (
    <div className="relative size-32">
      <Image
        src={src}
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

function QuoteTweetImageEmbed({ image }: { image: Attachment }) {
  const src = React.useMemo(() => {
    return applyCloudflarePath(image.url, 128);
  }, [image.url]);

  return (
    <div className="relative size-32">
      <Image
        src={src}
        alt={'quote image'}
        width={128}
        height={128}
        className="aspect-square content-center rounded-[12px] border object-cover object-left-top border-default"
      />
    </div>
  );
}

const QuoteTweet: React.FC<QuoteTweetProps> = React.memo(
  ({ embed, url, title, tweet, skipWrapperStyles }) => {
    if (
      typeof embed.tweet !== 'undefined' &&
      typeof embed.tweet.payloadV2 !== 'undefined' &&
      embed.tweet.payloadV2 !== ''
    ) {
      const convertedTweet = convertTweet(embed.tweet.payloadV2);

      if (convertedTweet !== null) {
        return (
          <QuoteTweetV2
            tweet={convertedTweet}
            skipWrapperStyles={skipWrapperStyles}
          />
        );
      }
    }

    return (
      <QuoteTweetV1
        embed={embed}
        title={title}
        tweet={tweet}
        skipWrapperStyles={skipWrapperStyles}
        url={url}
      />
    );
  },
);

QuoteTweet.displayName = 'QuoteTweet';

export { QuoteTweet };

type MediaType = 'photo' | 'video' | 'animated_gif';

interface RawMedia {
  media_url_https?: string;
  url?: string;
  type?: MediaType;
  original_info?: { width?: number; height?: number };
}

interface RawTweetUser {
  name: string;
  screen_name: string;
  profile_image_url_https: string;
}

interface RawTweet {
  id_str: string;
  text: string;
  created_at: string;
  user: RawTweetUser;
  mediaDetails?: RawMedia[];
  extended_entities?: { media?: RawMedia[] };
  entities?: { media?: RawMedia[] };
}

export interface Attachment {
  url: string;
  type: MediaType;
  width?: number;
  height?: number;
}

export interface ParsedTweetPayload {
  id: string;
  text: string;
  displayName: string;
  username: string;
  avatar: string;
  createdAtDisplay: string;
  attachments: Attachment[];
}

const htmlDecode = (s: string): string =>
  s.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (_, e) => {
    if (e[0] === '#') {
      const code =
        e[1].toLowerCase() === 'x'
          ? parseInt(e.slice(2), 16)
          : parseInt(e.slice(1), 10);
      return String.fromCharCode(code);
    }
    const map: Record<string, string> = {
      amp: '&',
      lt: '<',
      gt: '>',
      quot: '"',
      apos: "'",
      nbsp: '\u00A0',
    };
    return map[e] ?? _;
  });

const isRawTweet = (o: unknown): o is RawTweet => {
  if (typeof o !== 'object' || !o) {
    return false;
  }
  const t = o as Partial<RawTweet>;
  return (
    typeof t.id_str === 'string' &&
    typeof t.text === 'string' &&
    t.user !== undefined &&
    typeof t.user.name === 'string' &&
    typeof t.user.screen_name === 'string' &&
    typeof t.user.profile_image_url_https === 'string'
  );
};

const convertTweet = (input: string | unknown): ParsedTweetPayload | null => {
  const raw: unknown = typeof input === 'string' ? JSON.parse(input) : input;
  if (!isRawTweet(raw)) {
    return null;
  }

  const attachments: Attachment[] = [];
  const collect = (arr?: RawMedia[]) => {
    if (!arr) {
      return;
    }
    for (const m of arr) {
      if (
        typeof m.original_info?.width !== 'undefined' &&
        typeof m.original_info?.height !== 'undefined' &&
        m.type !== 'animated_gif'
      ) {
        attachments.push({
          url: m.media_url_https ?? m.url ?? '',
          type: m.type ?? 'photo',
          width: m.original_info?.width,
          height: m.original_info?.height,
        });
      }
    }
  };

  collect(raw.mediaDetails);
  collect(raw.extended_entities?.media);
  collect(raw.entities?.media);

  const created = new Date(raw.created_at).getTime();

  return {
    id: raw.id_str,
    text: htmlDecode(raw.text),
    displayName: raw.user.name,
    username: raw.user.screen_name,
    avatar: raw.user.profile_image_url_https.replace('_normal', ''),
    createdAtDisplay: formatTimeAgo(created),
    attachments,
  };
};
