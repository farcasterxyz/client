import { ApiCast } from 'farcaster-client-data';
import { resolveUsernameShort } from 'farcaster-client-hooks';
import { FC, useMemo } from 'react';

import { OGHead } from '~/components/meta/OGHead';
import { useRequest } from '~/contexts/RequestProvider';
import { getConversationUrl } from '~/utils/conversationUtils';

type ConversationHeadProps = {
  casts: ApiCast[];
  focusedCast: ApiCast;
};

const ConversationHead: FC<ConversationHeadProps> = ({
  casts,
  focusedCast,
}) => {
  const { host } = useRequest();

  const mostRecentCast = casts
    .slice()
    .sort((a, b) => b.timestamp - a.timestamp)[0]!;

  const resolvedUsername = resolveUsernameShort({
    fid: focusedCast.author.fid,
    username: focusedCast.author.username,
  });

  const truncatedText = useMemo(() => {
    const text = focusedCast.text || '';
    if (text.length <= 30) return text;
    return text.substring(0, 30) + '...';
  }, [focusedCast.text]);

  const title = truncatedText
    ? `@${resolvedUsername} on Farcaster: "${truncatedText}"`
    : `@${resolvedUsername} on Farcaster`;

  const imageEmbed = useMemo(() => {
    if (
      typeof focusedCast.embeds === 'undefined' ||
      focusedCast.embeds.images.length === 0 ||
      typeof focusedCast.embeds.images[0].media === 'undefined'
    ) {
      return undefined;
    }

    const [primaryImage] = focusedCast.embeds.images;

    if (typeof primaryImage.media === 'undefined') {
      return undefined;
    }

    return {
      url: primaryImage.sourceUrl,
      width: primaryImage.media.width,
      height: primaryImage.media.height,
    };
  }, [focusedCast.embeds]);

  const description = useMemo(() => {
    const processedCastText = focusedCast.embeds?.processedCastText;
    const imageEmbeds =
      typeof imageEmbed !== 'undefined'
        ? []
        : focusedCast.embeds?.images.map((image) => image.sourceUrl) || [];
    const urlEmbeds =
      focusedCast.embeds?.urls.map((url) => url.openGraph.url) || [];
    const allEmbeds = [...imageEmbeds, ...urlEmbeds];
    const castText = [
      allEmbeds.length === 0 ? focusedCast.text : processedCastText,
      ...allEmbeds,
    ]
      .filter((castText) => typeof castText !== 'undefined' && castText !== '')
      .join(' ');

    return castText;
  }, [
    focusedCast.embeds?.images,
    focusedCast.embeds?.processedCastText,
    focusedCast.embeds?.urls,
    focusedCast.text,
    imageEmbed,
  ]);

  return (
    <OGHead
      description={description}
      imageUrl={imageEmbed?.url}
      imageWidth={imageEmbed?.width}
      imageHeight={imageEmbed?.height}
      modifiedAt={mostRecentCast.timestamp}
      publishedAt={focusedCast.timestamp}
      title={title}
      type="article"
      twitterCard={'summary_large_image'}
      url={getConversationUrl({ cast: focusedCast, host })}
    />
  );
};

ConversationHead.displayName = 'ConversationHead';

export { ConversationHead };
