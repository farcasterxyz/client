import { ApiTokenLink } from 'farcaster-client-data';
import { FC } from 'react';

import { TokenLinkHead } from './TokenLinkHead';

type TokenLinkProps = {
  ticker: string;
  tokens: ApiTokenLink[];
};

const TokenLink: FC<TokenLinkProps> = ({ ticker, tokens }: TokenLinkProps) => {
  const token = tokens.find((o) => o.ticker === ticker || o.ca === ticker);

  if (typeof token !== 'undefined' && token !== null) {
    return (
      <>
        <TokenLinkHead ticker={token.ticker} tickerImageUrl={token?.imageUrl} />
        <div>${token.ticker}</div>
      </>
    );
  }

  return (
    <>
      <TokenLinkHead ticker={ticker} tickerImageUrl={undefined} />
      <div>${ticker}</div>
    </>
  );
};

TokenLink.displayName = 'TokenLink';

export { TokenLink };
