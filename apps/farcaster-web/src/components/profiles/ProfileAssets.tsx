import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiTokenLink, ApiUserProfile } from 'farcaster-client-data';
import {
  formatBalance,
  formatPrice,
  formatTokenName,
  getFeedSourceOn,
  useUserCastCollectibles,
  useWalletPositionsOpen,
} from 'farcaster-client-hooks';
import { CopyIcon, WalletIcon } from 'lucide-react';
import { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Cast } from '~/components/casts/Cast';
import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { FlatList } from '~/components/lists/FlatList';
import { ProfileContent } from '~/components/profiles/ProfileContent';
import { TokenIcon } from '~/components/tokens/TokenIcon';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCastsWithContext } from '~/hooks/casts/useCastsWithContext';
import { useSearchParams } from '~/hooks/navigation/useSearchParams';
import { ApiCastWithContext } from '~/types';
import { castWithContextKeyExtractor } from '~/utils/keyExtractorUtils';

type ProfileAssetsProps = {
  userProfile: ApiUserProfile;
};

type ProfileAssetTab = 'tokens' | 'collectibles';

const ProfileAssets: FC<ProfileAssetsProps> = memo(({ userProfile }) => {
  const { user } = userProfile;
  const { trackEvent } = useAnalytics();
  const withUsernameSearchParams = useSearchParams('profileAssetsWithUsername');
  const withoutUsernameSearchParams = useSearchParams(
    'profileAssetsWithoutUsername',
  );
  const sourceOn = getFeedSourceOn(
    withUsernameSearchParams.sourceOn ?? withoutUsernameSearchParams.sourceOn,
  );
  const castHash =
    withUsernameSearchParams.castHash ?? withoutUsernameSearchParams.castHash;

  const title = useMemo(
    () =>
      `${user.displayName}${
        user.username ? ` (@${user.username})` : ''
      } assets on Farcaster`,
    [user.displayName, user.username],
  );

  const trackProfileAssetTab = useCallback(
    (tab: ProfileAssetTab) => {
      trackEvent(
        tab === 'tokens'
          ? AnalyticsEvent.ViewProfileTokens
          : AnalyticsEvent.ViewProfileCollection,
        {
          ...(sourceOn ? { on: sourceOn } : {}),
          ...(castHash ? { castHash } : {}),
        },
      );
    },
    [castHash, sourceOn, trackEvent],
  );

  useEffect(() => {
    trackProfileAssetTab('tokens');
  }, [trackProfileAssetTab]);

  return (
    <ProfileContent title={title} userProfile={userProfile} focusedTab="assets">
      <ProfileAssetsContent
        userProfile={userProfile}
        onAssetTabSelect={trackProfileAssetTab}
      />
    </ProfileContent>
  );
});

ProfileAssets.displayName = 'ProfileAssets';

const ProfileAssetsContent: FC<
  ProfileAssetsProps & {
    onAssetTabSelect: (tab: ProfileAssetTab) => void;
  }
> = memo(({ userProfile, onAssetTabSelect }) => {
  const [focusedTab, setFocusedTab] = useState<ProfileAssetTab>('tokens');

  const handleAssetTabSelect = useCallback(
    (tab: ProfileAssetTab) => {
      setFocusedTab(tab);
      onAssetTabSelect(tab);
    },
    [onAssetTabSelect],
  );

  return (
    <div>
      <ProfileAssetsTabs
        focusedTab={focusedTab}
        setFocusedTab={handleAssetTabSelect}
      />
      {focusedTab === 'tokens' ? (
        <ProfileTokenPositions userProfile={userProfile} />
      ) : (
        <ProfileCollectibles userProfile={userProfile} />
      )}
    </div>
  );
});

ProfileAssetsContent.displayName = 'ProfileAssetsContent';

function ProfileAssetsTabs({
  focusedTab,
  setFocusedTab,
}: {
  focusedTab: ProfileAssetTab;
  setFocusedTab: (tab: ProfileAssetTab) => void;
}) {
  const tabs: Array<[ProfileAssetTab, string]> = [
    ['tokens', 'Wallet'],
    ['collectibles', 'Collectibles'],
  ];

  return (
    <div
      role="tablist"
      className="flex items-center gap-6 border-b px-4 py-3 border-default"
    >
      {tabs.map(([tab, label]) => {
        const selected = focusedTab === tab;

        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={selected}
            className={`text-sm font-semibold ${
              selected ? 'text-primary' : 'text-muted'
            }`}
            onClick={() => setFocusedTab(tab)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function formatWalletAddress(address: string) {
  if (address.length <= 12) {
    return address;
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const ProfileTokenPositions: FC<ProfileAssetsProps> = memo(
  ({ userProfile }) => {
    const { user } = userProfile;
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending } =
      useWalletPositionsOpen({ fid: user.fid });

    const tokens = useMemo(
      () => data?.pages.flatMap((page) => page.tokens) ?? [],
      [data],
    );

    const totalBalanceUsd = data?.pages[0]?.totalBalanceUsd ?? 0;
    const walletAddress =
      userProfile.extras.ethWallets?.[0] ?? userProfile.extras.custodyAddress;

    return (
      <div className="fade-in">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-4 border-default">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-muted">
              <WalletIcon size={18} />
              <span className="text-sm font-semibold">Wallet</span>
            </div>
            <button
              type="button"
              title="Copy wallet address"
              className="group mt-1 flex max-w-full items-center gap-1 text-left text-sm text-muted hover:text-primary"
              onClick={() => navigator.clipboard.writeText(walletAddress)}
            >
              <span className="truncate">
                {formatWalletAddress(walletAddress)}
              </span>
              <CopyIcon
                aria-hidden="true"
                size={14}
                className="opacity-0 transition-opacity group-hover:opacity-100"
              />
            </button>
          </div>
          <div className="text-lg font-semibold">
            {formatPrice(totalBalanceUsd)}
          </div>
        </div>
        {isPending ? (
          <div className="px-4 py-6 text-center text-muted">
            Loading assets...
          </div>
        ) : tokens.length === 0 ? (
          <DefaultEmptyListView
            message={`${user.displayName} doesn't have any tokens yet.`}
          />
        ) : (
          <>
            {tokens.map((token) => (
              <ProfileTokenPosition
                key={`${token.chain}:${token.ca}`}
                token={token}
              />
            ))}
            {hasNextPage && (
              <button
                type="button"
                className="w-full border-t px-4 py-4 text-sm font-semibold text-muted border-default"
                disabled={isFetchingNextPage}
                onClick={() => fetchNextPage()}
              >
                {isFetchingNextPage ? 'Loading...' : 'Show more'}
              </button>
            )}
          </>
        )}
      </div>
    );
  },
);

ProfileTokenPositions.displayName = 'ProfileTokenPositions';

function ProfileTokenPosition({ token }: { token: ApiTokenLink }) {
  const walletContext = token.walletContext;
  if (!walletContext) {
    return null;
  }

  const quantity = walletContext.position.quantity.float;
  const valueUsd = walletContext.position.valueUsd ?? 0;

  return (
    <div className="flex items-center gap-3 border-b px-4 py-3 border-default">
      <TokenIcon
        iconUrl={token.imageUrl}
        symbol={token.ticker}
        diameter={40}
        chain={token.chain}
        chainImageSize={14}
        imageBordered
      />
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold">
          {formatTokenName(token.name, token.ca, token.chain)}
        </div>
        <div className="truncate text-sm text-muted">
          {formatBalance(quantity ?? 0)} {token.ticker ?? token.name}
        </div>
      </div>
      <div className="text-sm font-semibold">{formatPrice(valueUsd)}</div>
    </div>
  );
}

const ProfileCollectibles: FC<ProfileAssetsProps> = memo(({ userProfile }) => {
  const { user } = userProfile;
  const { data, isPending } = useUserCastCollectibles({ fid: user.fid });

  const casts = useMemo(() => {
    const owned = [...(data?.owned ?? [])];
    const bids = [...(data?.bids ?? [])];

    return [
      ...bids.sort((a, b) => {
        const aEnd =
          a.collectible?.state === 'auction-active'
            ? a.collectible.auction.end
            : 0;
        const bEnd =
          b.collectible?.state === 'auction-active'
            ? b.collectible.auction.end
            : 0;
        return bEnd - aEnd;
      }),
      ...owned.sort((a, b) => b.timestamp - a.timestamp),
    ];
  }, [data]);

  const castsWithContext = useCastsWithContext(casts, {
    forceThreadPosition: 'start_and_end',
  });

  if (isPending) {
    return (
      <div className="px-4 py-6 text-center text-muted">
        Loading collectibles...
      </div>
    );
  }

  return (
    <FlatList
      data={castsWithContext}
      renderItem={renderCollectible}
      keyExtractor={castWithContextKeyExtractor}
      emptyView={
        <DefaultEmptyListView
          message={`${user.displayName} doesn't have any collectibles yet.`}
        />
      }
    />
  );
});

ProfileCollectibles.displayName = 'ProfileCollectibles';

const renderCollectible = ({ item }: { item: ApiCastWithContext }) => (
  <Cast castWithContext={item} />
);

export { ProfileAssets };
