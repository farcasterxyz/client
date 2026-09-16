import { AnalyticsEvent } from 'farcaster-analytics';
import {
  type ApiReferralCodeClaims,
  formatDisplayDollars,
} from 'farcaster-client-data';
import {
  EventingProvider,
  useSuspenseReferralsList,
} from 'farcaster-client-hooks';
import React, { useCallback, useEffect } from 'react';

import { AvatarImage } from '~/components/avatar/AvatarImage';
import { BorderedMainContent } from '~/components/BorderedMainContent';
import { Typography } from '~/components/design-system/atoms/Typography';
import { FullScreenErrorBoundary } from '~/components/errors/FullScreenErrorBoundary';
import { BackButton } from '~/components/forms/buttons/BackButton';
import { FlatList } from '~/components/lists/FlatList';
import { FullScreenLoadingIndicator } from '~/components/loaders/FullScreenLoadingIndicator';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useNavigateToProfile } from '~/hooks/navigation/useNavigateToProfile';

const keyExtractor = (item: ApiReferralCodeClaims) =>
  item.claimer.fid.toString();

const ReferralsListPageContent = () => {
  const { trackEvent } = useAnalytics();
  const navigateToProfile = useNavigateToProfile();
  const { flatData: referrals, onEndReached } = useSuspenseReferralsList();

  useEffect(() => {
    trackEvent(AnalyticsEvent.ViewReferralsListScreen, {});
  }, [trackEvent]);

  const onProfileClick = useCallback(
    (referral: ApiReferralCodeClaims) => {
      trackEvent(AnalyticsEvent.ViewXPUserProfile, {
        fid: referral.claimer.fid,
      });
      navigateToProfile({ user: referral.claimer });
    },
    [navigateToProfile, trackEvent],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: unknown; index: number }) => (
      <ReferralItem
        referral={item as ApiReferralCodeClaims}
        index={index}
        onProfileClick={onProfileClick}
      />
    ),
    [onProfileClick],
  );

  return (
    <div className="flex flex-col gap-3">
      <ReferralsListHeader isEmpty={(referrals ?? []).length === 0} />
      <FlatList
        data={referrals}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        emptyView={<EmptyComponent />}
      />
    </div>
  );
};

type ReferralsListHeaderProps = {
  isEmpty: boolean;
};

function ReferralsListHeader({ isEmpty }: ReferralsListHeaderProps) {
  if (isEmpty) {
    return null;
  }

  return (
    <div
      className={`flex w-full flex-row items-center justify-between px-3 pt-2`}
    >
      <Typography label="Medium/S" color="tertiary">
        User
      </Typography>
      <Typography label="Medium/S" color="tertiary">
        Lifetime Earnings
      </Typography>
    </div>
  );
}

ReferralsListHeader.displayName = 'ReferralsListHeader';

function ReferralItem({
  referral,
  index,
  onProfileClick,
}: {
  referral: ApiReferralCodeClaims;
  index: number;
  onProfileClick: (referral: ApiReferralCodeClaims) => void;
}) {
  return (
    <div
      className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-1 ${
        index % 2 === 1 ? 'bg-surface-secondary' : ''
      }`}
      onClick={() => onProfileClick(referral)}
    >
      <div className="flex items-center gap-2">
        <AvatarImage
          imgUrl={referral.claimer?.pfp?.url}
          imgAlt={referral.claimer?.username ?? 'Unknown'}
          size="sm"
          className="border"
        />
        <div className="flex flex-col">
          <Typography color="primary" label="Semibold/Base">
            {referral.claimer?.username ?? 'Unknown'}
          </Typography>
          <Typography color="secondary" label="Medium/Base">
            Joined{' '}
            {new Date(referral.claimedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </Typography>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-sm text-gray-500">
          {formatDisplayDollars(referral.usdcEarned)}
        </div>
      </div>
    </div>
  );
}

function EmptyComponent() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="text-gray-500">No referrals yet</div>
    </div>
  );
}

export const ReferralsListPage = () => {
  return (
    <Page meta={{ title: 'Users you referred' }}>
      <BorderedMainContent>
        <PageHeader hideCastButton>
          <PageTitle>
            <BackButton />
            Users you referred
          </PageTitle>
        </PageHeader>
        <EventingProvider on="referralsList" key="referralsList">
          <React.Suspense fallback={<FullScreenLoadingIndicator />}>
            <FullScreenErrorBoundary>
              <ReferralsListPageContent />
            </FullScreenErrorBoundary>
          </React.Suspense>
        </EventingProvider>
      </BorderedMainContent>
    </Page>
  );
};
