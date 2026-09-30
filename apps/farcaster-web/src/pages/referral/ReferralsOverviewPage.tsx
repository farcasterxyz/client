import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiXPReward,
  ApiXPRewardStatus,
  formatDisplayDollars,
} from 'farcaster-client-data';
import {
  EventingProvider,
  getNotionLinkTarget,
  useClaimReferralRewards,
  useNonSuspenseGetOrCreateReferralCode,
  useSuspenseXPRewards,
  useTimeAgo,
  useXPClaimableSummary,
} from 'farcaster-client-hooks';
import {
  BanIcon,
  CalendarOffIcon,
  CheckIcon,
  ChevronRightIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  CopyIcon,
  InfoIcon,
  TimerIcon,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { AvatarImage } from '~/components/avatar/AvatarImage';
import { BorderedMainContent } from '~/components/BorderedMainContent';
import { Card } from '~/components/design-system/atoms/Card';
import { Typography } from '~/components/design-system/atoms/Typography';
import { FullScreenErrorBoundary } from '~/components/errors/FullScreenErrorBoundary';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { ExternalLink } from '~/components/links/ExternalLink';
import { Link } from '~/components/links/Link';
import { FlatList } from '~/components/lists/FlatList';
import { FullScreenLoadingIndicator } from '~/components/loaders/FullScreenLoadingIndicator';
import { ReferralIntroModal } from '~/components/modals/ReferralIntroModal';
import { XpRewardDetailsModal } from '~/components/modals/XpRewardDetails';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useXPNewEntrypoint } from '~/hooks/xp/useXPNewEntrypoint';
import { toast } from '~/utils/toast';

const getReferralLink = ({ code }: { code: string }) => {
  return `https://farcaster.xyz/~/code/${code}`;
};

const ShareButton = ({ link }: { link: string }) => {
  const { trackEvent } = useAnalytics();

  const [copied, setCopied] = React.useState(false);

  const onCopy = React.useCallback(() => {
    if (!link) {
      return;
    }
    trackEvent(AnalyticsEvent.CopyReferralLink, {
      link,
    });
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [link, trackEvent]);
  return (
    <div
      className="flex cursor-pointer items-center justify-center rounded-full px-8 py-2 bg-brand text-light"
      style={{ height: 42 }}
      onClick={onCopy}
    >
      {copied ? (
        <CheckIcon size={20} className="text-light" />
      ) : (
        <CopyIcon size={20} className="text-light" />
      )}
    </div>
  );
};

const MiniCard = ({
  children,
  onPress,
}: {
  children: React.ReactNode;
  onPress?: () => void;
}) => {
  const handlePress = useCallback(() => {
    onPress?.();
  }, [onPress]);

  return (
    <div
      className={`flex flex-1 flex-col overflow-hidden ${onPress ? 'cursor-pointer' : ''}`}
      onClick={handlePress}
    >
      <div className="flex flex-1 flex-col gap-1 rounded-2xl p-3">
        {children}
      </div>
    </div>
  );
};

const ReferralsOverviewPageContent = () => {
  const {
    flatData: xpRewards,
    totalUsdc,
    totalReferrals,
    onEndReached,
  } = useSuspenseXPRewards();
  const { data: claimableSummary } = useXPClaimableSummary();
  const { shouldShowIntro, setShouldShowIntro } = useXPNewEntrypoint();
  const [selectedXpReward, setSelectedXpReward] = useState<ApiXPReward | null>(
    null,
  );

  const { trackEvent } = useAnalytics();

  useEffect(() => {
    trackEvent(AnalyticsEvent.ViewReferralsOverviewScreen, {});
  }, [trackEvent]);

  const onItemClick = useCallback(
    (item: ApiXPReward) => {
      trackEvent(AnalyticsEvent.ViewXpRewardDetails, {});
      setSelectedXpReward(item);
    },
    [trackEvent],
  );

  const renderReward = React.useCallback(
    ({ item, index }: { item: ApiXPReward; index: number }) => (
      <Row item={item} index={index} onItemClick={onItemClick} />
    ),
    [onItemClick],
  );

  return (
    <div className="flex min-h-[90vh] flex-col">
      <div className="flex flex-1 flex-col gap-3 px-3 py-6">
        <Header
          totalUSDC={totalUsdc || 0}
          totalReferrals={totalReferrals || 0}
          displayEmpty={(xpRewards?.length || 0) === 0}
          ableToClaim={claimableSummary?.eligibleToClaim || false}
          claimableUsdc={claimableSummary?.totalClaimableUsdc || 0}
        />

        <FlatList
          data={xpRewards}
          containerClassName="flex flex-col gap-[6px]"
          renderItem={renderReward}
          keyExtractor={(item) => item.id.toString()}
          onEndReached={onEndReached}
          emptyView={<></>}
        />
      </div>
      {shouldShowIntro && <ReferralIntroModal onClose={setShouldShowIntro} />}
      {selectedXpReward && (
        <XpRewardDetailsModal
          onClose={() => setSelectedXpReward(null)}
          xpReward={selectedXpReward}
        />
      )}
    </div>
  );
};

ReferralsOverviewPageContent.displayName = 'ReferralsOverviewPageContent';

const InfoButton = () => {
  const { trackEvent } = useAnalytics();

  const handleInfoPress = useCallback(() => {
    trackEvent(AnalyticsEvent.ViewReferralsInfo, {});
  }, [trackEvent]);

  return (
    <ExternalLink
      href={getNotionLinkTarget({ to: 'referrals' })}
      onClick={handleInfoPress}
      className="text-primary"
      title="Learn more about referrals"
    >
      <InfoIcon className="size-4" />
    </ExternalLink>
  );
};

export const ReferralsOverviewPage = () => {
  return (
    <Page meta={{ title: 'Referrals' }}>
      <BorderedMainContent>
        <PageHeader hideCastButton iconRight={<InfoButton />}>
          <PageTitle>Referrals</PageTitle>
        </PageHeader>
        <EventingProvider on="referrals" key="referrals">
          <React.Suspense fallback={<FullScreenLoadingIndicator />}>
            <FullScreenErrorBoundary>
              <ReferralsOverviewPageContent />
            </FullScreenErrorBoundary>
          </React.Suspense>
        </EventingProvider>
      </BorderedMainContent>
    </Page>
  );
};

ReferralsOverviewPage.displayName = 'ReferralsOverviewPage';

function CurrencyDisplay({ amount }: { amount: number }) {
  const formattedAmount = formatDisplayDollars(amount);
  const numericAmount = formattedAmount.replace('$', '');
  const dollars = numericAmount.split('.')[0];
  const cents = numericAmount.split('.')[1];

  return (
    <div
      className="flex-shrink-1 flex flex-row items-baseline"
      style={{ height: 50 }}
    >
      <span className="self-start text-2xl font-semibold text-primary">$</span>
      <span className="text-5xl font-semibold text-primary">{dollars}</span>
      <span className="text-5xl font-semibold text-tertiary">.{cents}</span>
    </div>
  );
}

function EmptyCurrencyDisplay() {
  return (
    <div
      className="flex-shrink-1 flex flex-row items-baseline"
      style={{ height: 50 }}
    >
      <span className="self-start text-2xl font-semibold text-primary">$</span>
      <span className="text-5xl font-semibold text-primary">0</span>
      <span className="text-5xl font-semibold text-tertiary">.00</span>
    </div>
  );
}

export function getXpRewardStatusColor(status: ApiXPRewardStatus) {
  switch (status) {
    case 'earned':
      return 'text-secondary' as const;
    case 'pending':
      return 'text-brand' as const;
    case 'error':
      return 'text-danger' as const;
    default:
      return 'text-secondary' as const;
  }
}
function XpRewardStatusIcon({ status }: { status: ApiXPRewardStatus }) {
  switch (status) {
    case 'earned':
      return (
        <CircleCheckIcon size={16} className={getXpRewardStatusColor(status)} />
      );
    case 'pending':
      return (
        <CircleDashedIcon
          size={16}
          className={getXpRewardStatusColor(status)}
        />
      );
    case 'expired':
      return (
        <CalendarOffIcon size={16} className={getXpRewardStatusColor(status)} />
      );
    case 'claiming':
      return <TimerIcon size={16} className={getXpRewardStatusColor(status)} />;
    case 'error':
      return <BanIcon size={16} className={getXpRewardStatusColor(status)} />;
  }
}

XpRewardStatusIcon.displayName = 'XpRewardStatusIcon';

type ShareCardProps = {
  displayCode: string;
  link: string;
};

function ShareCard({ displayCode, link }: ShareCardProps) {
  return (
    <Card variant="primary-gradient">
      <div className="flex flex-col gap-2 rounded-2xl">
        <Typography label="Medium/L" color="primary">
          Invite your friends and earn
        </Typography>
        <Typography label="Medium/S" color="secondary">
          Get 20% of trading fees from anyone who signs up with your referral
          code.
        </Typography>
        <div className="flex flex-1 flex-row items-center  rounded-full border bg-app border-surface-secondary">
          <div
            className="leading-base flex flex-1 items-center justify-center text-center text-xl text-xl font-semibold tracking-wide"
            style={{ letterSpacing: 2 }}
          >
            {displayCode}
          </div>
          <ShareButton link={link} />
        </div>
      </div>
    </Card>
  );
}

ShareCard.displayName = 'ShareCard';

const useHandleClaimXPRewards = (claimableUsdc: number) => {
  const { trackEvent } = useAnalytics();
  const currentUser = useCurrentUser();
  const { mutateAsync: claimXPReward, isPending: isClaimingXPReward } =
    useClaimReferralRewards();

  const handleClaim = useCallback(async () => {
    if (!currentUser?.fid || claimableUsdc === 0) {
      return;
    }
    const formattedClaimableUsdc = formatDisplayDollars(claimableUsdc);

    try {
      trackEvent(AnalyticsEvent.ClaimXPReward, {
        usdc: claimableUsdc,
      });
      // Claim the XP reward (using a mock rewardId for now)
      await claimXPReward();
      trackEvent(AnalyticsEvent.ClaimXPRewardSuccess, {
        usdc: claimableUsdc,
      });
      toast({
        message: `${formattedClaimableUsdc} claimed!`,
      });

      // The query will automatically refresh due to invalidation
    } catch (error) {
      trackEvent(AnalyticsEvent.ClaimXPRewardError, {
        usdc: claimableUsdc,
      });
      toast({
        message: 'Failed to claim rewards',
        type: 'error',
        toastId: 'referral-claim-error',
      });
    }
  }, [currentUser?.fid, claimableUsdc, trackEvent, claimXPReward]);

  return { handleClaim, isClaimingXPReward };
};

function Header({
  totalUSDC,
  totalReferrals,
  displayEmpty,
  ableToClaim,
  claimableUsdc,
}: {
  totalUSDC: number;
  totalReferrals: number;
  displayEmpty: boolean;
  ableToClaim: boolean;
  claimableUsdc: number;
}) {
  const currentUser = useCurrentUser();
  const { trackEvent } = useAnalytics();

  const { handleClaim } = useHandleClaimXPRewards(totalUSDC);

  const handleReferralsListPress = useCallback(() => {
    trackEvent(AnalyticsEvent.ViewReferralsListPressed, {});
  }, [trackEvent]);

  const formattedClaimableUsdc = formatDisplayDollars(claimableUsdc);

  const { data: referralData } = useNonSuspenseGetOrCreateReferralCode({
    fid: currentUser?.fid || 0,
  });
  const code = referralData?.code ?? null;
  const link = code ? getReferralLink({ code }) : '';
  const displayCode = useMemo(() => {
    if (!code) {
      return '';
    }
    const half = Math.floor(code.length / 2);
    return code.slice(0, half) + '-' + code.slice(-half);
  }, [code]);

  return (
    <div>
      <div className="m-1 flex flex-col justify-start gap-1 px-3 pb-3">
        <Typography label="Body/Small/Strong" color="tertiary">
          Total earned
        </Typography>
        {totalUSDC ? (
          <CurrencyDisplay amount={totalUSDC} />
        ) : (
          <EmptyCurrencyDisplay />
        )}
      </div>
      <div className="mb-[14px] flex flex-row items-center gap-3 border-b border-surface-secondary">
        <Link
          to="referralsList"
          params={{}}
          searchParams={{}}
          title="View referrals"
          className="flex flex-1"
        >
          <MiniCard onPress={handleReferralsListPress}>
            <div className="flex flex-row items-center gap-10">
              <Typography label="Body/ExtraSmall/Strong" color="tertiary">
                Total referrals
              </Typography>
              <ChevronRightIcon size={20} className="text-tertiary" />
            </div>
            <Typography label="Body/Large/Strong" color="primary">
              {totalReferrals}
            </Typography>
          </MiniCard>
        </Link>

        <div className="flex flex-1">
          <MiniCard>
            <Typography label="Body/ExtraSmall/Strong" color="tertiary">
              Available to claim
            </Typography>
            <div className="flex flex-row items-center gap-3">
              <Typography label="Body/Large/Strong" color="primary">
                {formattedClaimableUsdc}
              </Typography>
              {ableToClaim ? (
                <DefaultButton onClick={handleClaim} size="sm">
                  Claim
                </DefaultButton>
              ) : null}
            </div>
          </MiniCard>
        </div>
      </div>
      <ShareCard displayCode={displayCode} link={link} />
      {displayEmpty ? null : (
        <div className="flex flex-row justify-between px-3 pb-2 pt-5">
          <Typography label="Medium/S" color="tertiary">
            User
          </Typography>
          <Typography label="Medium/S" color="tertiary">
            Reward
          </Typography>
        </div>
      )}
    </div>
  );
}

Header.displayName = 'Header';

function Row({
  item,
  index,
  onItemClick,
}: {
  item: ApiXPReward;
  index: number;
  onItemClick: (item: ApiXPReward) => void;
}) {
  const formattedUSDC = formatDisplayDollars(item.usdc);

  const onClick = useCallback(() => {
    onItemClick(item);
  }, [item, onItemClick]);

  const timeAgo = useTimeAgo({ timestamp: item.timestamp });
  const { status } = item;

  return (
    <div
      onClick={onClick}
      className={`flex cursor-pointer flex-row justify-between px-3 ${
        index % 2 === 1 ? 'bg-surface-secondary' : ''
      } ${status === 'error' ? '!opacity-50' : ''}`}
    >
      <div className="flex flex-row items-center gap-2">
        <AvatarImage
          imgUrl={item.user.pfp?.url}
          imgAlt={item.user.username || ''}
          size="sm"
        />
        <span className="text-base font-medium text-default">
          {item.user.username}
        </span>
        <span className="text-xs font-medium text-quaternary">{timeAgo}</span>
      </div>
      <div className="flex flex-row items-center gap-2">
        <span className={'text-xs font-medium text-secondary'}>
          +{formattedUSDC}
        </span>
        <XpRewardStatusIcon status={status} />
      </div>
    </div>
  );
}

Row.displayName = 'Row';
