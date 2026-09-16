import {
  ApiAdminReview,
  ApiAdminReviewTrendingChannel,
  ApiAdminReviewTrendingMint,
  ApiAdminReviewUserBoost,
} from 'farcaster-client-data';
import {
  formatTimeAgo,
  usePendingAdminReviews,
  useUpdatePendingAdminReview,
} from 'farcaster-client-hooks';
import React, { FC, useMemo } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { ChainImage } from '~/components/chain/ChainImage';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { Image } from '~/components/images/Image';
import { ExternalLink } from '~/components/links/ExternalLink';
import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { FlatList } from '~/components/lists/FlatList';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { dayjs } from '~/utils/dayjs';

const AdminReviewsPage: React.FC = React.memo(() => {
  const { data, onEndReached, isFetchingNextPage } = usePendingAdminReviews();

  const adminReviews = React.useMemo(
    () => data!.pages.flatMap((page) => page.result.reviews),
    [data],
  );

  return (
    <Page meta={{ title: 'Admin Reviews' }}>
      <BorderedMainContent>
        <PageHeader hideCastButton>
          <PageTitle>Admin Reviews</PageTitle>
        </PageHeader>
        <div className="flex flex-col">
          <FlatList
            data={adminReviews}
            emptyView={
              <DefaultEmptyListView message="No pending admin reviews" />
            }
            renderItem={renderItem}
            keyExtractor={(item) => item.reviewId}
            onEndReached={onEndReached}
            isFetchingNextPage={isFetchingNextPage}
          />
        </div>
      </BorderedMainContent>
    </Page>
  );
});

AdminReviewsPage.displayName = 'AdminReviewsPage';

const renderItem = ({ item }: { item: ApiAdminReview }) => (
  <AdminReviewItem item={item} />
);

interface AdminReviewItemProps {
  item: ApiAdminReview;
}

const AdminReviewItem: FC<AdminReviewItemProps> = ({ item }) => {
  const updatePendingAdminReview = useUpdatePendingAdminReview();

  const reviewComp = useMemo(() => {
    switch (item.itemType) {
      case 'trending-mint':
        return <TrendingMintReviewItem item={item} />;
      case 'trending-channel':
        return <TrendingChannelReviewItem item={item} />;
      case 'user-boost':
        return <UserBoostReviewItem item={item} />;
      default:
        // @ts-ignore-next-line
        return <div>Unsupported review type {item.itemType}</div>;
    }
  }, [item]);

  return (
    <div className="flex flex-col gap-5 border-b p-4 border-default">
      {reviewComp}
      <div className="flex flex-row items-center justify-between">
        <div>
          <div className="mb-0 text-muted">
            Review created: {formatTimeAgo(item.createdAt)} ago (
            {dayjs(item.createdAt).format('MMM D, h:mma Z')})
          </div>
          <div className="text-muted">
            Review within: {formatTimeAgo(item.validUntil)} (
            {dayjs(item.validUntil).format('MMM D, h:mma Z')})
          </div>
        </div>
        <div className="flex flex-row gap-4">
          <DefaultButton
            variant="danger"
            onClick={async (e) => {
              e.stopPropagation();

              await updatePendingAdminReview({
                reviewId: item.reviewId,
                approve: false,
              });
            }}
          >
            Reject
          </DefaultButton>
          <DefaultButton
            variant="normal"
            onClick={async (e) => {
              e.stopPropagation();

              await updatePendingAdminReview({
                reviewId: item.reviewId,
                approve: true,
              });
            }}
          >
            Approve
          </DefaultButton>
        </div>
      </div>
    </div>
  );
};

interface TrendingMintReviewItemProps {
  item: ApiAdminReviewTrendingMint;
}

const TrendingMintReviewItem: FC<TrendingMintReviewItemProps> = ({ item }) => {
  const mintUrl = React.useMemo(() => {
    return (
      item.collection?.mintUrl ||
      item.collection.externalUrl ||
      item.collection.openSeaUrl
    );
  }, [item]);

  return (
    <div>
      <div className="mb-3 font-bold">Trending mint notification</div>
      <div className="flex flex-row items-start gap-4">
        <div className="relative flex flex-row overflow-x-auto">
          <Image
            alt={'Asset image'}
            className="shadow-xs size-24 rounded-lg border object-cover border-default"
            src={item.collection.imageUrl}
          />
          <ChainImage
            chain={item.collection.chain}
            className="absolute bottom-0 mb-1 ml-1"
          />
        </div>
        <div>
          <div className="mb-1">
            <span className="font-bold">{item.collection.name}</span> on{' '}
            {item.collection.chain || 'ethereum'}
          </div>
          <div className="mb-1">
            Farcaster owners: {item.collection.farcasterOwnerCount}
          </div>
          <div className="mb-1">Total owners: {item.collection.ownerCount}</div>
          <ExternalLink title="Mint link" href={mintUrl}>
            Mint link
          </ExternalLink>
        </div>
      </div>
    </div>
  );
};

interface TrendingChannelReviewItemProps {
  item: ApiAdminReviewTrendingChannel;
}

const TrendingChannelReviewItem: FC<TrendingChannelReviewItemProps> = ({
  item,
}) => {
  return (
    <div>
      <div className="mb-3 font-bold">Trending channel notification</div>
      <div className="flex flex-row items-start gap-4">
        <div className="relative flex flex-row overflow-x-auto">
          <Image
            alt={'Asset image'}
            className="shadow-xs size-24 rounded-lg border object-cover border-default"
            src={item.channel.imageUrl!}
          />
        </div>
        <div>
          <div className="mb-1">
            <span className="font-bold">{item.channel.name}</span> (key{' '}
            {item.channel.key})
          </div>
          <div className="mb-1">Followers: {item.channel.followerCount}</div>
          <ExternalLink
            title="View channel"
            href={`https://farcaster.xyz/~/channel/${item.channel.key}`}
          >
            View channel
          </ExternalLink>
        </div>
      </div>
    </div>
  );
};

interface UserBoostReviewItemProps {
  item: ApiAdminReviewUserBoost;
}

const UserBoostReviewItem: FC<UserBoostReviewItemProps> = ({ item }) => {
  return (
    <div>
      <div className="mb-3 font-bold">User boost</div>
      <div className="flex flex-row items-start gap-4">
        {item.user.pfpUrl && (
          <div className="relative flex flex-row overflow-x-auto">
            <Image
              alt={'Asset image'}
              className="shadow-xs size-24 rounded-lg border object-cover border-default"
              src={item.user.pfpUrl}
            />
          </div>
        )}
        <div>
          <div className="mb-1">
            @{item.user.username} ({item.user.displayName})
          </div>
          <div className="mb-1">Fid: {item.user.fid}</div>
          <div className="mb-1">Followers: {item.user.fullFollowerCount}</div>
          <div className="mb-1">
            Total engagement by active high/good: {item.user.engagement}
          </div>
          <div className="mb-1">
            Active high/good followers: {item.user.followerCount}
          </div>
          <div className="mb-1">
            Root casts in last 2 days: {item.user.castCount}
          </div>
          <div className="mb-1">
            Normalized score: {item.user.score.toFixed(4)}
          </div>
          <div className="mb-1">
            Account created: {formatTimeAgo(item.user.createdAt)} ago{' '}
            <span className="text-muted">
              ({dayjs(item.user.createdAt).format('MMM D, h:mma Z')})
            </span>
          </div>
          <ExternalLink
            title="View user"
            href={`https://farcaster.xyz/~/profiles/${item.user.fid}`}
          >
            View user
          </ExternalLink>
        </div>
      </div>
    </div>
  );
};

export { AdminReviewsPage };
