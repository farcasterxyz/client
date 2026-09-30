import { useNavigation } from '@react-navigation/native';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUser } from 'farcaster-client-data';
import {
  useClaimReferralV2,
  useReferralCodeJoin,
} from 'farcaster-client-hooks';
import {
  Avatar,
  BottomSheetContentContainer,
  BottomSheetModal,
  ButtonV2,
  Text,
  Typography,
  useBottomSheetModalRef,
  useCurrentUser,
  useHaptics,
  useRootToast,
  useTheme,
} from 'farcaster-expo';
import { Check } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';

import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useUserAppContextGate } from '~/hooks/useUserAppContextGate';
import { trackError } from '~/utils/ErrorUtils';

export function ReferralsJoinScreenContent({
  referralCode,
  vanity,
}: {
  referralCode: string | undefined;
  vanity: boolean;
}) {
  const t = useTheme();
  const { goBack } = useNavigation();
  const { triggerImpactAsync } = useHaptics();
  const { trackEvent } = useAnalytics();
  const { mutateAsync: claimReferralCode, isPending: isClaimingReferralCode } =
    useClaimReferralV2();
  const currentUser = useCurrentUser();
  const bottomSheetModalRef = useBottomSheetModalRef();

  const { data, isLoading } = useReferralCodeJoin({ code: referralCode ?? '' });
  const toast = useRootToast();
  const claimEnabled =
    data &&
    data?.inviter.fid !== currentUser?.fid &&
    !data?.currentlyJoinedCreator &&
    !isClaimingReferralCode;

  // Present the bottom sheet when component mounts
  useEffect(() => {
    bottomSheetModalRef.current?.present();
  }, [bottomSheetModalRef]);

  const onClaimPress = useCallback(async () => {
    if (!currentUser?.fid || isClaimingReferralCode) {
      return;
    }
    triggerImpactAsync();
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
        code: referralCode ?? '',
      });
      trackEvent(
        vanity
          ? AnalyticsEvent.PressClaimVanityReferralSuccess
          : AnalyticsEvent.PressClaimReferralSuccess,
        {
          referrer: data?.inviter.username,
        },
      );
      toast.show('Claimed successfully', {
        duration: 3000,
        placement: 'top',
        icon: <Check size={24} color={t.colors.text.tertiary} />,
      });
      bottomSheetModalRef.current?.dismiss();
      goBack();
    } catch (error) {
      trackEvent(
        vanity
          ? AnalyticsEvent.PressClaimVanityReferralError
          : AnalyticsEvent.PressClaimReferralError,
        {
          referrer: data?.inviter.username,
        },
      );
      trackError(error);
      toast.show('Failed to claim', {
        duration: 3000,
        placement: 'top',
        type: 'danger',
      });
    }
  }, [
    currentUser?.fid,
    isClaimingReferralCode,
    triggerImpactAsync,
    trackEvent,
    vanity,
    data?.inviter.username,
    claimReferralCode,
    referralCode,
    toast,
    t.colors.text.tertiary,
    bottomSheetModalRef,
    goBack,
  ]);

  const onDismiss = useCallback(() => {
    triggerImpactAsync();
    trackEvent(
      vanity
        ? AnalyticsEvent.DismissClaimVanityReferral
        : AnalyticsEvent.DismissClaimReferral,
      {},
    );
    bottomSheetModalRef.current?.dismiss();
    goBack();
  }, [triggerImpactAsync, trackEvent, bottomSheetModalRef, goBack, vanity]);

  const displayCode = useMemo(() => {
    if (!referralCode) {
      return '';
    }
    const half = Math.floor(referralCode?.length / 2);
    return referralCode?.slice(0, half) + '-' + referralCode?.slice(-half);
  }, [referralCode]);

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

  const { checkUserAppContextGate } = useUserAppContextGate();

  const viewerCanAccessReferrals = checkUserAppContextGate('referrals').value;

  if (!viewerCanAccessReferrals) {
    return null;
  }

  if (isLoading || typeof referralCode === 'undefined' || !data) {
    return null;
  }
  return (
    <BottomSheetModal
      name="referralsJoin"
      ref={bottomSheetModalRef}
      onDismiss={onDismiss}
      enableDynamicSizing
    >
      <BottomSheetContentContainer>
        {data.currentlyJoinedCreator ? (
          data.currentlyJoinedCreator.fid === data.inviter.fid ? (
            <AlreadyJoinedModalContent
              alreadyJoinedCreator={data.currentlyJoinedCreator}
              onClosePress={onDismiss}
            />
          ) : (
            <AlreadyJoinedOtherModalContent
              inviter={data.inviter}
              alreadyJoinedCreator={data.currentlyJoinedCreator}
              onClosePress={onDismiss}
            />
          )
        ) : (
          <AbleToClaimModalContent
            inviter={data.inviter}
            displayCode={displayCode}
            onClaimPress={onClaimPress}
            claimEnabled={claimEnabled}
            isClaimingReferralCode={isClaimingReferralCode}
          />
        )}
      </BottomSheetContentContainer>
    </BottomSheetModal>
  );
}

ReferralsJoinScreenContent.displayName = 'ReferralsJoinScreenContent';

type AbleToClaimModalContentProps = {
  inviter: ApiUser;
  displayCode: string;
  onClaimPress: () => void;
  claimEnabled: boolean;
  isClaimingReferralCode: boolean;
};
const AbleToClaimModalContent = ({
  inviter,
  displayCode,
  onClaimPress,
  claimEnabled,
  isClaimingReferralCode,
}: AbleToClaimModalContentProps) => {
  const t = useTheme();
  return (
    <View style={[t.flex1, t.gap5]}>
      <View style={[t.flex1, t.gap5, t.itemsCenter, t.pX2]}>
        <Avatar pfpUrl={inviter.pfp?.url} diameter={48} border />
        <Typography label="Semibold/L" color="primary" style={[t.textCenter]}>
          {`🎉 Get 20% off trading fees with ${inviter.username}'s referral`}
        </Typography>
        <View style={[t.flex, t.justifyCenter, t.itemsCenter]}>
          <Text
            style={[
              t.texts.brand,
              t.fontSemibold,
              {
                fontSize: 36,
                letterSpacing: 2,
              },
            ]}
            numberOfLines={1}
          >
            {displayCode}
          </Text>
        </View>
      </View>
      <Typography label="Medium/Base" color="tertiary" style={t.textCenter}>
        Referral cannot be changed later.
      </Typography>
      <ButtonV2
        title="Claim"
        onPress={onClaimPress}
        disabled={!claimEnabled}
        textSize="lg"
        loading={isClaimingReferralCode}
      />
    </View>
  );
};

AbleToClaimModalContent.displayName = 'AbleToClaimModalContent';

type AlreadyJoinedOtherModalContentProps = {
  inviter: ApiUser;
  alreadyJoinedCreator: ApiUser;
  onClosePress: () => void;
};

const AlreadyJoinedOtherModalContent = ({
  inviter,
  alreadyJoinedCreator,
  onClosePress,
}: AlreadyJoinedOtherModalContentProps) => {
  const t = useTheme();
  return (
    <View style={[t.flex1, t.gap5]}>
      <View style={[t.flex1, t.gap5, t.itemsCenter, t.pX2]}>
        <View style={[t.flexRow, t.itemsCenter]}>
          <Avatar
            pfpUrl={inviter.pfp?.url}
            diameter={48}
            border
            style={{ marginRight: -12 }}
          />
          <Avatar
            pfpUrl={alreadyJoinedCreator.pfp?.url}
            diameter={48}
            border
            style={{ marginLeft: -12 }}
          />
        </View>
        <Typography label="Semibold/L" color="primary" style={[t.textCenter]}>
          {`You've already claimed ${alreadyJoinedCreator.username}'s referral. You cannot claim another one.`}
        </Typography>
        <ButtonV2
          title="Close"
          onPress={onClosePress}
          textSize="lg"
          variant="tertiary"
          width="full"
        />
      </View>
    </View>
  );
};

AlreadyJoinedOtherModalContent.displayName = 'AlreadyJoinedOtherModalContent';

type AlreadyJoinedModalContentProps = {
  alreadyJoinedCreator: ApiUser;
  onClosePress: () => void;
};

const AlreadyJoinedModalContent = ({
  alreadyJoinedCreator,
  onClosePress,
}: AlreadyJoinedModalContentProps) => {
  const t = useTheme();
  return (
    <View style={[t.flex1, t.gap5]}>
      <View style={[t.flex1, t.gap5, t.itemsCenter, t.pX2]}>
        <View style={[t.flexRow, t.itemsCenter]}>
          <Avatar pfpUrl={alreadyJoinedCreator.pfp?.url} diameter={48} border />
        </View>
        <Typography label="Semibold/L" color="primary" style={[t.textCenter]}>
          {`You've already claimed ${alreadyJoinedCreator.username}'s referral`}
        </Typography>
        <ButtonV2
          title="Close"
          onPress={onClosePress}
          textSize="lg"
          variant="tertiary"
          width="full"
        />
      </View>
    </View>
  );
};

AlreadyJoinedModalContent.displayName = 'AlreadyJoinedModalContent';
