import { ApiTokenLink } from 'farcaster-client-data';
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

import { TokenLink } from '~/components/tokenLinks/TokenLink';
import { apiClient } from '~/utils/ApiClient';

type PageParams = {
  ticker: string;
};

type TokenPageProps = {
  ticker: string;
  tokens: ApiTokenLink[];
};

export async function getServerSideProps(
  context: GetServerSidePropsContext<PageParams>,
): Promise<GetServerSidePropsResult<TokenPageProps>> {
  const ticker = context.params?.ticker || '';
  const fromRaw = context.query.from;
  const fromString = Array.isArray(fromRaw)
    ? fromRaw[0]
    : typeof fromRaw === 'string'
      ? fromRaw
      : undefined;
  const fromParsed = fromString !== undefined ? Number(fromString) : NaN;
  const contextFid =
    Number.isInteger(fromParsed) &&
    fromParsed > 0 &&
    fromParsed <= Number.MAX_SAFE_INTEGER
      ? fromParsed
      : undefined;

  const {
    data: {
      result: { tokens },
    },
  } = await apiClient.getTokenLinks({
    ticker,
    intent: 'submit',
    contextFid,
  });

  return {
    props: { ticker, tokens },
  };
}

export default function TokenPage({
  ticker: tokenTicker,
  tokens,
}: TokenPageProps) {
  const ticker = tokenTicker.toLowerCase();

  return <TokenLink ticker={ticker} tokens={tokens} />;
}
