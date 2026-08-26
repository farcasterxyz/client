import { AnalyticsEvent } from 'farcaster-analytics';
import { HandHeartIcon, TimerIcon } from 'lucide-react';
import React, { useCallback, useEffect } from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { XpRewardIcon } from '~/components/icons/XpRewardIcon';
import { Image } from '~/components/images/Image';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { useAnalytics } from '~/contexts/AnalyticsProvider';

import { DefaultModalContent } from './DefaultModalContent';

type ReferralIntroModalProps = {
  onClose: () => void;
};

const ReferralIntroModal: React.FC<ReferralIntroModalProps> = React.memo(
  ({ onClose }) => {
    const { trackEvent } = useAnalytics();

    useEffect(() => {
      trackEvent(AnalyticsEvent.ViewReferralsIntroScreen, {});
    }, [trackEvent]);

    const handleClose = useCallback(() => {
      trackEvent(AnalyticsEvent.DismissReferralsIntroScreen, {});
      onClose();
    }, [trackEvent, onClose]);

    return (
      <DefaultModalContainer onClose={handleClose}>
        <DefaultModalContent>
          {/* <div className="flex size-full items-center justify-center p-4">
            <div className="border-top border-left border-right relative w-full max-w-md overflow-hidden rounded-2xl p-3 shadow-xl bg-app lg:max-w-lg"> */}
          <div className="flex flex-col gap-6 pb-2">
            <div className="overflow-hidden rounded-tl-lg rounded-tr-lg">
              <Image
                src="/referral-info-splash.png"
                alt="Referral Rewards"
                className="h-60 w-full object-cover"
              />
            </div>
            <div className="mx-4 text-center">
              <div className="text-sm font-medium text-brand">Introducing</div>
              <h2 className="mt-1 text-2xl font-semibold text-default">
                Referrals
              </h2>
            </div>

            <div className="mx-4 flex flex-col gap-4">
              <InfoItem
                title="Invite & Earn"
                description="You get 20% of trading fees from people who use your referral code."
                icon={<HandHeartIcon className="size-6 text-default" />}
              />
              <InfoItem
                title="Give your friends a gift"
                description="People you invite will get 20% lower fees when they trade on Farcaster."
                icon={<TimerIcon className="size-6 text-default" />}
              />
              <InfoItem
                title="Instant payouts"
                description="Rewards are paid in USDC and can be claimed every day."
                icon={
                  <div className="size-6 fill-secondary text-default">
                    <XpRewardIcon size={24} color="#000" />
                  </div>
                }
              />
            </div>

            <div className="mt-2 flex justify-center">
              <DefaultButton onClick={onClose} size="lg">
                Continue
              </DefaultButton>
            </div>
          </div>
          {/* </div>
          </div> */}
        </DefaultModalContent>
      </DefaultModalContainer>
    );
  },
);

function InfoItem({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-row items-start gap-3">
      {icon}
      <div className="flex flex-col gap-1">
        <div className="text-base font-semibold text-default">{title}</div>
        <div className="text-sm text-secondary">{description}</div>
      </div>
    </div>
  );
}

ReferralIntroModal.displayName = 'ReferralIntroModal';

export { ReferralIntroModal };
