import { FC, useMemo } from 'react';

import { OGHead } from '~/components/meta/OGHead';
import { useRequest } from '~/contexts/RequestProvider';
import { useFastOgImageWithFallback } from '~/utils/imageUtils';
import { getTokenLinkUrl } from '~/utils/tokenLinkUtils';

type TokenLinkHeadProps = {
  ticker: string;
  tickerImageUrl: string | undefined;
};

const TokenLinkHead: FC<TokenLinkHeadProps> = ({ ticker, tickerImageUrl }) => {
  const { host } = useRequest();
  const upperTicker = ticker.toUpperCase();

  const title = useMemo(() => {
    return `$${upperTicker} on Farcaster`;
  }, [upperTicker]);

  const description = useMemo(() => {
    return `See what people are saying about $${upperTicker}. Latest casts, price discussions, and community sentiment on Farcaster.`;
  }, [upperTicker]);

  const url = useMemo(() => {
    return getTokenLinkUrl({ ticker, host });
  }, [host, ticker]);

  const { imageUrl, size } = useFastOgImageWithFallback(tickerImageUrl, 256);

  return (
    <OGHead
      description={description}
      imageUrl={imageUrl}
      imageHeight={size}
      imageWidth={size}
      title={title}
      type="website"
      url={url}
    />
  );
};

TokenLinkHead.displayName = 'TokenLinkHead';

export { TokenLinkHead };
