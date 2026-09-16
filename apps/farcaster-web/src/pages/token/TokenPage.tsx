import { LinkExternalIcon } from '@primer/octicons-react';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiCoinLink } from 'farcaster-client-data';
import {
  getNotionLinkTarget,
  useSearchCasts,
  useTokenLinks,
} from 'farcaster-client-hooks';
import uniqBy from 'lodash/uniqBy';
import React from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { Cast } from '~/components/casts/Cast';
import { NFT_IMAGE_UNAVAILABLE_URL } from '~/components/collections/CollectionNameWithImage';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { Image } from '~/components/images/Image';
import { ExternalLink } from '~/components/links/ExternalLink';
import { FlatList } from '~/components/lists/FlatList';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { AppStoreRedirectsModal } from '~/components/modals/AppStoreRedirectsModal';
import { Page } from '~/components/page/Page';
import { TokenSummary } from '~/components/tokens/TokenSummary';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCastsWithContext } from '~/hooks/casts/useCastsWithContext';
import { useCachedCurrentUser } from '~/hooks/data/useCachedCurrentUser';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { useExternalNavigate } from '~/hooks/navigation/useExternalNavigate';
import { useParams } from '~/hooks/navigation/useParams';
import { useSearchParams } from '~/hooks/navigation/useSearchParams';
import { ApiCastWithContext } from '~/types';
import { applyCloudflarePath } from '~/utils/images';
import { castWithContextKeyExtractor } from '~/utils/keyExtractorUtils';

import { TokenPageHeader } from './TokenPageHeader';

const TokenPage = React.memo(() => {
  const { ticker: encodedTokenTicker } = useParams('token');
  const { from } = useSearchParams('token');

  const ticker = decodeURI(encodedTokenTicker).toLowerCase();
  const fromFid = typeof from === 'string' ? Number(from) : NaN;
  const castAuthorFid =
    Number.isFinite(fromFid) && fromFid > 0 ? fromFid : undefined;

  return <TokenPageInner ticker={ticker} castAuthorFid={castAuthorFid} />;
});

TokenPage.displayName = 'TokenPage';

export function TokenPageInner({
  ticker,
  castAuthorFid,
}: {
  ticker: string;
  castAuthorFid?: number;
}) {
  const isSignedIn = useIsSignedIn();
  const viewerFid = useCachedCurrentUser()?.fid;

  const { trackEvent } = useAnalytics();

  const { data } = useTokenLinks({
    ticker,
    intent: 'submit',
    contextFid: castAuthorFid ?? viewerFid,
  });

  const tokens = React.useMemo(() => {
    return data.tokens.slice(0, 3);
  }, [data.tokens]);

  const coins = React.useMemo(() => {
    return data.coins;
  }, [data.coins]);

  const tokenDeeplinkUri = `farcaster://~/tokens/${ticker}`;
  const tokenUrl = `https://farcaster.xyz/~/tokens/${ticker}`;

  React.useEffect(() => {
    trackEvent(AnalyticsEvent.ViewToken, {
      isSignedIn,
      ticker,
    });
  }, [isSignedIn, ticker, trackEvent]);

  const [appStoreRedirectModalVisible, setAppStoreRedirectModalVisible] =
    React.useState<boolean>(false);

  const externalNavigate = useExternalNavigate();

  const userIsLikelyOnMobile = React.useMemo(() => {
    const userAgent = navigator.userAgent || navigator.vendor;
    return /android/i.test(userAgent) || /iPad|iPhone|iPod/.test(userAgent);
  }, []);

  const onClickOpenWarpcast = React.useCallback(
    (e: React.SyntheticEvent<HTMLButtonElement>) => {
      trackEvent(AnalyticsEvent.ClickOpenWarpcastToken, { ticker });

      e.preventDefault();
      e.stopPropagation();

      const to = userIsLikelyOnMobile ? tokenDeeplinkUri : tokenUrl;

      externalNavigate({
        to: to,
        openInNewTab: true,
      });
    },
    [
      externalNavigate,
      ticker,
      tokenDeeplinkUri,
      tokenUrl,
      trackEvent,
      userIsLikelyOnMobile,
    ],
  );

  // Build SEO metadata for token (consistent with SSR TokenLinkHead)
  const tokenDescription = React.useMemo(() => {
    const upperTicker = ticker.toUpperCase();
    return `See what people are saying about $${upperTicker}. Latest casts, price discussions, and community sentiment on Farcaster.`;
  }, [ticker]);

  if (!isSignedIn) {
    return (
      <Page
        meta={{
          title: `$${ticker.toUpperCase()} on Farcaster`,
          description: tokenDescription,
          twitterCard: 'summary',
        }}
      >
        <BorderedMainContent className="mt-2 flex !min-h-dvh flex-col items-center gap-12 md:justify-start">
          <div className="md:-auto m-2 flex size-full flex-col items-center justify-center space-y-10">
            {(tokens.length !== 0 || coins.length !== 0) && (
              <div className="relative mx-4 w-full rounded-lg">
                <div className="flex flex-col space-y-4 p-4">
                  {coins.map((coin, index) => (
                    <Coin key={index} coin={coin} />
                  ))}
                  {tokens.map((token, index) => (
                    <TokenSummary key={index} token={token} />
                  ))}
                </div>
              </div>
            )}
            <div className="mx-auto w-full text-center">
              Read most recent casts about ${ticker} on Farcaster!
            </div>
            <div className="flex w-full flex-col items-center justify-center space-y-2 px-6">
              <DefaultButton
                variant="normal"
                size="lg"
                className="!w-full !py-[12px]"
                onClick={onClickOpenWarpcast}
              >
                Open Farcaster
              </DefaultButton>
              <DefaultButton
                variant="link"
                className="text-sm !font-normal !text-faint md:w-40"
                onClick={() => setAppStoreRedirectModalVisible(true)}
                size={'sm'}
              >
                Download
              </DefaultButton>
            </div>
            {appStoreRedirectModalVisible && window.innerWidth < 720 && (
              <AppStoreRedirectsModal
                onClose={() => setAppStoreRedirectModalVisible(false)}
              />
            )}
          </div>
        </BorderedMainContent>
      </Page>
    );
  }

  return (
    <Page
      meta={{
        title: `$${ticker.toUpperCase()} on Farcaster`,
        description: tokenDescription,
        twitterCard: 'summary',
      }}
    >
      <TokenPageHeader ticker={ticker} />
      <BorderedMainContent className="flex flex-col">
        <div>
          <div className="mx-3 flex flex-row items-center justify-between border-b px-1 py-4 text-muted border-default">
            <div className="font-semibold">Tokens</div>
          </div>
          <div className="flex flex-col space-y-4 p-4">
            {coins.length === 0 && tokens.length === 0 && (
              <NoTokensFound ticker={ticker} />
            )}
            {coins.map((coin, index) => (
              <Coin key={index} coin={coin} />
            ))}
            {tokens.map((token, index) => (
              <TokenSummary key={index} token={token} />
            ))}
          </div>
        </div>
        <div className="mx-3 flex flex-row items-center justify-between border-b px-1 py-4 text-muted border-default">
          <div className="font-semibold">Casts</div>
          <div className="text-sm">Sorted by most recent</div>
        </div>
        <React.Suspense
          fallback={<LoadingIndicator containerClassName="m-auto mt-4" />}
        >
          <TokenMentioningCasts ticker={ticker} />
        </React.Suspense>
      </BorderedMainContent>
    </Page>
  );
}

function NoTokensFound({ ticker }: { ticker: string }) {
  const { trackEvent } = useAnalytics();

  const onLearnMoreClick = React.useCallback(() => {
    trackEvent(AnalyticsEvent.PressNoTokensFoundLearnMore, { ticker });
  }, [ticker, trackEvent]);

  React.useEffect(() => {
    trackEvent(AnalyticsEvent.NoTokensFound, { ticker });
  }, [ticker, trackEvent]);

  return (
    <div className="flex h-[72px] flex-row items-center justify-start space-x-2 rounded-2xl p-3 bg-faint">
      <div className="relative flex size-[52px] items-center justify-center">
        <div
          className={
            'aspect-cover flex shrink-0 items-center justify-center rounded-full border bg-elevated border-default'
          }
          style={{
            width: 48,
            height: 48,
            minWidth: 48,
            minHeight: 48,
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M14 14C14.5304 14 15.0391 14.2107 15.4142 14.5858C15.7893 14.9609 16 15.4696 16 16V20C16 20.5304 15.7893 21.0391 15.4142 21.4142C15.0391 21.7893 14.5304 22 14 22"
              stroke="#546473"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14 4C14 3.46957 14.2107 2.96086 14.5858 2.58579C14.9609 2.21071 15.4696 2 16 2"
              stroke="#546473"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16 10C15.4696 10 14.9609 9.78929 14.5858 9.41421C14.2107 9.03914 14 8.53043 14 8"
              stroke="#546473"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M20 14C20.5304 14 21.0391 14.2107 21.4142 14.5858C21.7893 14.9609 22 15.4696 22 16V20C22 20.5304 21.7893 21.0391 21.4142 21.4142C21.0391 21.7893 20.5304 22 20 22"
              stroke="#546473"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M20 2C20.5304 2 21.0391 2.21071 21.4142 2.58579C21.7893 2.96086 22 3.46957 22 4"
              stroke="#546473"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M22 8C22 8.53043 21.7893 9.03914 21.4142 9.41421C21.0391 9.78929 20.5304 10 20 10"
              stroke="#546473"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M3 7L6 10L9 7"
              stroke="#546473"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M6 10V5C6 4.20435 6.31607 3.44129 6.87868 2.87868C7.44129 2.31607 8.20435 2 9 2H10"
              stroke="#546473"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8 14H4C2.89543 14 2 14.8954 2 16V20C2 21.1046 2.89543 22 4 22H8C9.10457 22 10 21.1046 10 20V16C10 14.8954 9.10457 14 8 14Z"
              stroke="#546473"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      <div className="text-base text-muted">
        Still gathering data — check back later.{' '}
        <ExternalLink
          href={getNotionLinkTarget({ to: 'token-links' })}
          title="Learn more"
          onClick={onLearnMoreClick}
        >
          Learn more
        </ExternalLink>
      </div>
    </div>
  );
}

function Coin({ coin }: { coin: ApiCoinLink }) {
  const { trackEvent } = useAnalytics();

  const navigate = useExternalNavigate();

  const onExternalNavigatePress = React.useCallback(() => {
    trackEvent(AnalyticsEvent.PressOpenCoinGecko, {
      tikcer: coin.ticker,
      url: coin.url,
    });

    navigate({ to: coin.url, openInNewTab: true });
  }, [coin.ticker, coin.url, navigate, trackEvent]);

  return (
    <div className="flex h-[72px] flex-row items-center justify-between rounded-2xl p-3 bg-faint">
      <div className="flex flex-row items-center space-x-4">
        <div className="relative flex size-[52px] items-center justify-center">
          <Image
            src={applyCloudflarePath(coin.imageUrl, 48)}
            className={
              'aspect-cover shrink-0 rounded-full border bg-app border-default'
            }
            style={{
              width: 48,
              height: 48,
              minWidth: 48,
              minHeight: 48,
            }}
            alt={`Image`}
            fallback={NFT_IMAGE_UNAVAILABLE_URL}
          />
        </div>
        <div className="flex flex-col space-y-0.5">
          <div className="font-semibold">${coin.ticker}</div>
        </div>
      </div>
      <div
        className="group flex cursor-pointer flex-row items-center space-x-2"
        onClick={onExternalNavigatePress}
      >
        <div className="flex size-[30px] items-center justify-center rounded-full border text-muted bg-elevated border-default">
          <LinkExternalIcon />
        </div>
      </div>
    </div>
  );
}

function TokenMentioningCasts({ ticker }: { ticker: string }) {
  const { data, onEndReached, isLoading } = useSearchCasts({
    q: `ticker:${ticker} sort:recent`,
    limit: 15,
  });

  const casts = React.useMemo(() => {
    return data.pages.flatMap((page) => page.result.casts);
  }, [data.pages]);

  const castsWithContext = useCastsWithContext(casts, {
    forceThreadPosition: 'start_and_end',
    forceCastHeaderLabelHidden: true,
  });

  const uniqueCastsWithContext = React.useMemo(
    () => uniqBy(castsWithContext, castWithContextKeyExtractor),
    [castsWithContext],
  );

  return (
    <FlatList
      itemClassName="w-full cursor-pointer hover:bg-overlay-light"
      data={uniqueCastsWithContext}
      renderItem={renderCast}
      keyExtractor={castWithContextKeyExtractor}
      emptyView={<></>}
      isFetchingNextPage={isLoading}
      onEndReached={onEndReached}
    />
  );
}
function renderCast({ item }: { item: ApiCastWithContext }) {
  return <Cast castWithContext={item} />;
}

export { TokenPage };
