import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUser } from 'farcaster-client-data';
import {
  useClaimReferralV2,
  useReferralCodeJoin,
} from 'farcaster-client-hooks';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import { AvatarImage } from '~/components/avatar/AvatarImage';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { Page } from '~/components/page/Page';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { toast } from '~/utils/toast';

type ReferralJoinContentProps = {
  code: string;
  vanity: boolean;
};

export const ReferralJoinContent = ({
  code,
  vanity,
}: ReferralJoinContentProps) => {
  const { data } = useReferralCodeJoin({ code: code ?? '' });
  const { mutateAsync: claimReferralCode, isPending: isClaimingReferralCode } =
    useClaimReferralV2();
  const currentUser = useCurrentUser();
  const { trackEvent } = useAnalytics();

  const navigate = useNavigate();

  const onClose = useCallback(() => {
    trackEvent(
      vanity
        ? AnalyticsEvent.DismissClaimVanityReferral
        : AnalyticsEvent.DismissClaimReferral,
      {
        referrer: data?.inviter.username,
      },
    );
    navigate({
      to: 'homeFeed',
      params: {},
    });
  }, [data?.inviter.username, navigate, trackEvent, vanity]);

  const onClaimClick = useCallback(async () => {
    if (!currentUser?.fid || !code || isClaimingReferralCode) {
      return;
    }
    trackEvent(
      vanity
        ? AnalyticsEvent.PressClaimVanityReferral
        : AnalyticsEvent.PressClaimReferral,
      {
        referrer: data?.inviter.username,
      },
    );
    try {
      await claimReferralCode({
        code,
      });
      trackEvent(
        vanity
          ? AnalyticsEvent.PressClaimVanityReferralSuccess
          : AnalyticsEvent.PressClaimReferralSuccess,
        {
          referrer: data?.inviter.username,
        },
      );
      toast({
        message: 'Successfully claimed referral bonus!',
        type: 'success',
        toastId: 'referral-claim-success',
      });
      navigate({
        to: 'homeFeed',
        params: {},
      });
    } catch (error) {
      trackEvent(
        vanity
          ? AnalyticsEvent.PressClaimVanityReferralError
          : AnalyticsEvent.PressClaimReferralError,
        {
          referrer: data?.inviter.username,
        },
      );
      toast({
        message: 'Failed to claim referral. Please try again.',
        type: 'error',
        toastId: 'referral-claim-error',
      });
      // eslint-disable-next-line no-console
      console.error('Failed to claim referral:', error);
    }
  }, [
    currentUser?.fid,
    code,
    trackEvent,
    vanity,
    data?.inviter.username,
    claimReferralCode,
    navigate,
    isClaimingReferralCode,
  ]);

  const displayCode = useMemo(() => {
    if (!code) {
      return '';
    }
    const half = Math.floor(code?.length / 2);
    return code?.slice(0, half) + '-' + code?.slice(-half);
  }, [code]);

  const trackedEvent = useRef(false);

  useEffect(() => {
    if (!data) {
      return;
    }
    if (trackedEvent.current) {
      return;
    }
    trackedEvent.current = true;
    trackEvent(
      vanity
        ? AnalyticsEvent.ViewClaimVanityReferral
        : AnalyticsEvent.ViewClaimReferral,
      {
        referrer: data.inviter.username,
      },
    );
    if (!data.currentlyJoinedCreator) {
      trackEvent(AnalyticsEvent.ViewClaimReferralAbleToClaim, {
        referrer: data.inviter.username,
      });
    } else if (data.currentlyJoinedCreator.fid === currentUser?.fid) {
      trackEvent(AnalyticsEvent.ViewClaimReferralAlreadyJoined, {
        referrer: data.inviter.username,
      });
    } else {
      trackEvent(AnalyticsEvent.ViewClaimReferralAlreadyJoinedOther, {
        referrer: data.inviter.username,
        alreadyJoinedCreator: data.currentlyJoinedCreator.username,
      });
    }
  }, [data, trackEvent, currentUser?.fid, vanity]);

  if (!code || !data) {
    return (
      <Page meta={{ title: 'Join Farcaster' }}>
        <div className="bg-default flex min-h-dvh items-center justify-center">
          <div className="rounded-lg p-6 text-secondary bg-surface-secondary">
            {!code ? 'No referral code provided.' : 'Loading...'}
          </div>
        </div>
      </Page>
    );
  }
  const inviter = data.inviter;
  const claimEnabled = inviter.fid !== currentUser?.fid;

  return (
    <Page
      meta={{
        title: `Join ${inviter.displayName} on Farcaster`,
      }}
    >
      <div className="bg-default flex min-h-dvh items-center justify-center p-4">
        {data.currentlyJoinedCreator ? (
          data.currentlyJoinedCreator.fid === data.inviter.fid ? (
            <AlreadyJoinedContent
              inviter={inviter}
              alreadyJoinedCreator={data.currentlyJoinedCreator}
              onClosePress={onClose}
            />
          ) : (
            <AlreadyJoinedOtherContent
              inviter={inviter}
              alreadyJoinedCreator={data.currentlyJoinedCreator}
              onClosePress={onClose}
            />
          )
        ) : (
          <AbleToClaimContent
            inviter={inviter}
            displayCode={displayCode}
            onClaimPress={onClaimClick}
            claimEnabled={claimEnabled}
            isClaimingReferralCode={isClaimingReferralCode}
          />
        )}
      </div>
    </Page>
  );
};

type AbleToClaimModalContentProps = {
  inviter: ApiUser;
  displayCode: string;
  onClaimPress: () => void;
  claimEnabled: boolean;
  isClaimingReferralCode: boolean;
};

const AbleToClaimContent = ({
  inviter,
  displayCode,
  onClaimPress,
  claimEnabled,
  isClaimingReferralCode,
}: AbleToClaimModalContentProps) => {
  return (
    <div className="w-full max-w-sm">
      <div className="bg-default w-full rounded-3xl border px-8 py-6 shadow-lg border-surface-secondary dark:border-surface-secondary">
        <div className="flex flex-col items-center gap-5">
          {/* Avatar */}
          <AvatarImage
            imgUrl={inviter.pfp?.url}
            imgAlt={`${inviter.username} avatar`}
            size="lg"
            className="!border-surface-secondary"
          />

          <h2 className="text-center text-lg font-semibold text-primary">
            {`🎉 Get 20% off trading fees with ${inviter.username}'s referral`}
          </h2>
          <p className="text-center text-2xl font-semibold tracking-[0.02em] text-brand">
            {displayCode}
          </p>
        </div>
        {/* Subtitle */}
        <p className="pt-3 text-center text-xs text-tertiary">
          Referral cannot be changed later.
        </p>
      </div>

      {/* Claim Button */}
      <div className="mt-5">
        <DefaultButton
          variant="normal"
          size="lg"
          className="w-full"
          onClick={onClaimPress}
          disabled={!claimEnabled}
          isLoading={isClaimingReferralCode}
        >
          Claim
        </DefaultButton>
      </div>
    </div>
  );
};

AbleToClaimContent.displayName = 'AbleToClaimContent';

type AlreadyJoinedOtherModalContentProps = {
  inviter: ApiUser;
  alreadyJoinedCreator: ApiUser;
  onClosePress: () => void;
};

const AlreadyJoinedContent = ({
  inviter,
  alreadyJoinedCreator,
  onClosePress,
}: AlreadyJoinedOtherModalContentProps) => {
  return (
    <div className="w-full max-w-sm">
      <div className="bg-default w-full rounded-3xl border px-8 py-6 shadow-lg border-surface-secondary dark:border-surface-secondary">
        <div className="flex flex-col items-center gap-5">
          {/* Avatar */}
          <AvatarImage
            imgUrl={inviter.pfp?.url}
            imgAlt={`${inviter.username} avatar`}
            size="lg"
            className="!border-surface-secondary"
          />

          <h2 className="text-center text-lg font-semibold text-primary">
            You've already claimed {alreadyJoinedCreator.username}'s referral.
            You cannot claim another one.
          </h2>
        </div>
      </div>

      {/* Claim Button */}
      <div className="mt-5">
        <DefaultButton
          variant="muted"
          size="lg"
          className="w-full !rounded-lg"
          onClick={onClosePress}
        >
          Close
        </DefaultButton>
      </div>
    </div>
  );
};

AlreadyJoinedContent.displayName = 'AlreadyJoinedContent';

type AlreadyJoinedModalContentProps = {
  alreadyJoinedCreator: ApiUser;
  inviter: ApiUser;
  onClosePress: () => void;
};

const AlreadyJoinedOtherContent = ({
  alreadyJoinedCreator,
  inviter,
  onClosePress,
}: AlreadyJoinedModalContentProps) => {
  return (
    <div className="w-full max-w-sm">
      <div className="bg-default w-full rounded-3xl border px-8 py-6 shadow-lg border-surface-secondary dark:border-surface-secondary">
        <div className="flex flex-col items-center gap-5">
          {/* Avatar */}
          <div className="flex flex-row items-center">
            <AvatarImage
              imgUrl={inviter.pfp?.url}
              imgAlt={`${inviter.username} avatar`}
              size="lg"
              className="mr-[-12px] !border-surface-secondary"
            />
            <AvatarImage
              imgUrl={alreadyJoinedCreator.pfp?.url}
              imgAlt={`${alreadyJoinedCreator.username} avatar`}
              size="lg"
              className="ml-[-12px] !border-surface-secondary"
            />
          </div>

          <h2 className="text-center text-lg font-semibold text-primary">
            {`You've already claimed ${alreadyJoinedCreator.username}'s referral`}
          </h2>
        </div>
      </div>

      {/* Claim Button */}
      <div className="mt-5">
        <DefaultButton
          variant="muted"
          size="lg"
          className="w-full !rounded-lg"
          onClick={onClosePress}
        >
          Close
        </DefaultButton>
      </div>
    </div>
  );
};

AlreadyJoinedOtherContent.displayName = 'AlreadyJoinedOtherContent';
