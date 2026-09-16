import { ApiCast, ApiCastCollectibleAuctionBid } from 'farcaster-client-data';
import {
  sleep,
  useCastCollectible,
  useCastCollectibleBidHistory,
  useGloballyCachedCast,
} from 'farcaster-client-hooks';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { trackError } from '~/utils/ErrorUtils';

export type LocalBid = {
  state: 'pending' | 'succeeded';
  bid: ApiCastCollectibleAuctionBid;
};

export function useCollectCast({ cast: fallbackCast }: { cast: ApiCast }) {
  const [localBid, setLocalBid] = useState<LocalBid | undefined>();
  const [forceUpdating, setForceUpdating] = useState<boolean>(false);

  const [watchingForBid, setWatchingForBid] = useState<
    ApiCastCollectibleAuctionBid | undefined
  >();
  const cast = useGloballyCachedCast({ fallback: fallbackCast });
  const collectibleQueryResult = useCastCollectible(
    {
      cast,
      refresh: !!watchingForBid,
    },
    {
      refetchInterval: watchingForBid ? 250 : 5000,
    },
  );

  const bidHistoryQueryResult = useCastCollectibleBidHistory(
    {
      castHash: cast.hash,
    },
    {
      refetchInterval: 5000,
    },
  );

  const { data: bidHistory, refetch: refetchBidHistory } =
    bidHistoryQueryResult;
  const { refetch: refetchCollectible } = collectibleQueryResult;

  // Rather than maintaining a separate global cache for collectibles we use the globablly cached cast as the
  // source of truth and always keep it updated.
  const collectible = cast.collectible;
  const auction =
    collectible && 'auction' in collectible ? collectible.auction : undefined;
  const auctionTopBid = (() => {
    if (auction && 'topBid' in auction) {
      return auction.topBid as ApiCastCollectibleAuctionBid;
    }
  })();

  const localTopBid = (() => {
    if (localBid) {
      if (!auctionTopBid || localBid.bid.amount > auctionTopBid.amount) {
        return localBid.bid;
      }

      return auctionTopBid;
    }

    return auctionTopBid;
  })();

  const localAuction = useMemo(() => {
    if (auction) {
      // avoid adding the topBid property if undefined
      if (localTopBid) {
        return {
          ...auction,
          topBid: localTopBid,
        };
      }

      return auction;
    }
  }, [auction, localTopBid]);

  const localBidHistory = useMemo(() => {
    const allBids = [...(bidHistory ?? [])];

    if (
      localBid &&
      !allBids.some(
        (bid) =>
          bid.bidder.fid === localBid.bid.bidder.fid &&
          bid.amount === localBid.bid.amount,
      )
    ) {
      allBids.unshift(localBid.bid);
    }

    if (
      auctionTopBid &&
      !allBids.some(
        (bid) =>
          bid.bidder.fid === auctionTopBid.bidder.fid &&
          bid.amount === auctionTopBid.amount,
      )
    ) {
      allBids.unshift(auctionTopBid);
    }

    return allBids.sort((a, b) => b.value - a.value);
  }, [bidHistory, localBid, auctionTopBid]);

  const watchForBid = useCallback((bid: ApiCastCollectibleAuctionBid) => {
    setWatchingForBid(bid);
  }, []);

  useEffect(() => {
    if (collectible && watchingForBid) {
      if (
        collectible.state === 'auction-active' ||
        collectible.state === 'auction-ended' ||
        collectible.state === 'minted'
      ) {
        if (collectible.auction.topBid.value >= watchingForBid.value) {
          void refetchBidHistory();
          setWatchingForBid(undefined);
        }

        return;
      }

      if (collectible.state === 'auction-cancelled') {
        setWatchingForBid(undefined);
        return;
      }
    }
  }, [collectible, refetchBidHistory, watchingForBid]);

  const wrappedSetLocalBid = useCallback(
    (bid: LocalBid | undefined) => {
      if (bid?.state === 'succeeded') {
        watchForBid(bid.bid);
      }

      setLocalBid(bid);
    },
    [watchForBid],
  );

  const forceUpdateAuction = useCallback(async () => {
    try {
      setForceUpdating(true);
      await Promise.allSettled([
        refetchBidHistory(),
        refetchCollectible(),
        await sleep(666),
      ]);
    } catch (e) {
      trackError(e);
    } finally {
      setForceUpdating(false);
    }
  }, [refetchBidHistory, refetchCollectible]);

  return {
    collectible,
    auction: localAuction,
    localBid,
    setLocalBid: wrappedSetLocalBid,
    refetchCollectible,
    forceUpdateAuction,
    forceUpdating,
    bidHistory: localBidHistory,
    isBidPending: localBid?.state === 'pending',
  };
}

export type UseCollectCastResult = ReturnType<typeof useCollectCast>;
