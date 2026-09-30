import { useReferralCode } from 'farcaster-client-hooks';
import React from 'react';

import { AvatarImage } from '~/components/avatar/AvatarImage';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { Image } from '~/components/images/Image';
import { ExternalLink } from '~/components/links/ExternalLink';
import { Page } from '~/components/page/Page';
import { useParams } from '~/hooks/navigation/useParams';
import { isAndroid, isIOS } from '~/utils/navigatorUtils';

export const ReferralsPage: React.FC = () => {
  const { code } = useParams('referralCodeLandingPage');

  const query = useReferralCode({ code: code ?? '' });

  if (!code) {
    return (
      <Page meta={{ title: 'Join Farcaster' }}>
        <div
          className="flex min-h-dvh items-center justify-center"
          style={{
            background:
              'linear-gradient(180deg, var(--violet-500) 0%, var(--violet-500) 37.74%, var(--violet-200) 97.6%)',
          }}
        >
          <div className="rounded-lg bg-white/10 p-6 text-white">
            No referral code provided.
          </div>
        </div>
      </Page>
    );
  }

  const inviter = query.data.inviter;

  return (
    <Page meta={{ title: `Join ${inviter.displayName} on Farcaster` }}>
      <div
        className="flex min-h-dvh flex-col items-center justify-center"
        style={{
          background:
            'linear-gradient(180deg, var(--violet-500) 0%, var(--violet-500) 37.74%, var(--violet-200) 97.6%)',
        }}
      >
        <div className="flex flex-col items-center gap-4 py-10">
          <AvatarImage
            imgUrl={inviter.pfp?.url}
            imgAlt={`${inviter.displayName} avatar`}
            size="md"
          />
          <div className="w-72 text-center text-2xl font-semibold tracking-normal text-white">
            Claim free trading for 30 days from @{inviter.username}
          </div>
          <div className="mt-25 flex justify-center">
            <Image
              src="/~/images/referrals_image.png"
              alt="Referral background"
              height={133}
              width={133}
            />
          </div>
        </div>
        <div className="w-full px-3">
          <div className="mx-auto flex w-full max-w-[480px] flex-col gap-3 rounded-[20px] p-2">
            {isIOS() ? (
              <ExternalLink
                href="https://apps.apple.com/us/app/farcaster/id1600555445"
                title="Download iOS app"
              >
                <DefaultButton
                  className="!w-full !rounded-[20px] !py-4"
                  size="lg"
                >
                  Download App to Claim
                </DefaultButton>
              </ExternalLink>
            ) : isAndroid() ? (
              <ExternalLink
                href="https://play.google.com/store/apps/details?id=com.farcaster.mobile"
                title="Download Android app"
              >
                <DefaultButton
                  className="!w-full !rounded-[20px] !py-4"
                  size="lg"
                >
                  Download App to Claim
                </DefaultButton>
              </ExternalLink>
            ) : (
              // Fallback for desktop or unknown platforms - show both options
              <>
                <ExternalLink
                  href="https://apps.apple.com/us/app/farcaster/id1600555445"
                  title="Download iOS app"
                >
                  <DefaultButton
                    className="!w-full !rounded-[20px] !py-4"
                    size="lg"
                  >
                    Download App to Claim
                  </DefaultButton>
                </ExternalLink>
                <ExternalLink
                  href="https://play.google.com/store/apps/details?id=com.farcaster.mobile"
                  title="Download Android app"
                >
                  <DefaultButton
                    className="!w-full !rounded-[20px] !py-4"
                    size="lg"
                  >
                    Download App to Claim
                  </DefaultButton>
                </ExternalLink>
              </>
            )}
          </div>
        </div>
      </div>
    </Page>
  );
};
