import { AnalyticsEvent } from 'farcaster-analytics';
import { getFirstApiErrorBody } from 'farcaster-client-data';
import {
  resolveUsernameShort,
  useClaimReferral,
  useUserByFid,
  useUserByUsername,
} from 'farcaster-client-hooks';
import React from 'react';

import { AvatarImage } from '~/components/avatar/AvatarImage';
import { BorderedMainContent } from '~/components/BorderedMainContent';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { TextInput } from '~/components/forms/TextInput';
import { AppStoreRedirectsModal } from '~/components/modals/AppStoreRedirectsModal';
import { Page } from '~/components/page/Page';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { useParams } from '~/hooks/navigation/useParams';

const ReferralPageWithUsername = React.memo(() => {
  const { username } = useParams('referralWithUsername');

  const { data } = useUserByUsername({ username });

  if (data === null || data.result.user === null) {
    return <></>;
  }

  return (
    <ReferralPageContent
      username={username}
      fid={data.result.user.fid}
      pfp={data.result.user.pfp?.url}
    />
  );
});

ReferralPageWithUsername.displayName = 'ReferralPageWithUsername';

const ReferralPageWithoutUsername = React.memo(() => {
  const { fid } = useParams('referral');

  const { data } = useUserByFid({ fid });

  const username = resolveUsernameShort({
    username:
      typeof data !== 'undefined' && data !== null
        ? data.result.user.username
        : undefined,
    fid: fid,
  });

  if (data === null || data.result.user === null) {
    return <></>;
  }

  return (
    <ReferralPageContent
      username={username}
      fid={fid}
      pfp={data.result.user.pfp?.url}
    />
  );
});

ReferralPageWithoutUsername.displayName = 'ReferralPageWithoutUsername';

function ReferralPageContent({
  username,
  fid,
  pfp,
}: {
  username: string;
  fid: number;
  pfp: string | undefined;
}) {
  const isSignedIn = useIsSignedIn();

  const { trackEvent } = useAnalytics();

  const claimReferral = useClaimReferral();

  const [claimed, setClaimed] = React.useState<boolean>(false);

  const [inputError, setInputError] = React.useState<string | undefined>(
    undefined,
  );

  const [email, setEmail] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    trackEvent(AnalyticsEvent.ViewReferralPage, { username, isSignedIn });
  }, [isSignedIn, trackEvent, username]);

  const [appStoreRedirectModalVisible, setAppStoreRedirectModalVisible] =
    React.useState<boolean>(false);

  const onEmailChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newEmailToSet = e.target.value.trim();
      setEmail(newEmailToSet);
    },
    [],
  );

  const onClaimClick = React.useCallback(
    async (e: React.SyntheticEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      e.preventDefault();

      if (typeof email === 'undefined') {
        return;
      }

      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!valid) {
        setInputError('Invalid email');
        return;
      }

      try {
        await claimReferral({ fid: fid, email });

        setClaimed(true);
      } catch (error) {
        const apiError = getFirstApiErrorBody(error);
        if (apiError && apiError.reason === 'referral_blocked') {
          setInputError(
            'Unable to claim referral. Please try a different email.',
          );
          return;
        }
        if (apiError && apiError.reason === 'referral_claimed') {
          setInputError('This email is already used to claim a referral.');
          return;
        }
        setInputError('Failed to claim, please try again.');
      }
    },
    [claimReferral, email, fid],
  );

  const onDownloadAppClick = React.useCallback(async () => {
    setAppStoreRedirectModalVisible(true);
  }, []);

  return (
    <Page
      meta={{
        title: `Join @${username} on Farcaster`,
      }}
    >
      <BorderedMainContent className="flex !min-h-dvh flex-col items-center justify-center gap-12">
        <div className="w-full flex-col items-center justify-center space-y-10 rounded-lg">
          <div className="mx-3 space-y-4 rounded-lg py-4 bg-swap">
            <div className="relative w-full rounded-lg">
              <div className="flex flex-col items-center justify-center space-y-2">
                <AvatarImage imgUrl={pfp} imgAlt={'Referrer image'} size="lg" />
                <div className="text-2xl font-semibold text-default">
                  {`Join @${username} on Farcaster`}
                </div>
                <div className="text-base text-default">
                  {`@${username} referred you to join Farcaster.`}
                </div>
              </div>
            </div>
            <div className="flex size-full flex-col items-center justify-center space-y-2 px-6">
              {claimed ? (
                <div className="py-2 text-center text-muted">
                  Make sure you use {email} to sign up.
                </div>
              ) : (
                <TextInput
                  className="h-12"
                  onChange={onEmailChange}
                  value={email}
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="hello@farcaster.xyz"
                />
              )}
              {typeof inputError !== 'undefined' && (
                <div className="w-full text-left text-sm text-danger">
                  {inputError}
                </div>
              )}
              {claimed ? (
                <DefaultButton
                  size="lg"
                  className="!w-full !py-[12px]"
                  onClick={onDownloadAppClick}
                >
                  Download app
                </DefaultButton>
              ) : (
                <DefaultButton
                  size="lg"
                  className="!w-full !py-[12px]"
                  onClick={onClaimClick}
                  disabled={typeof email === 'undefined'}
                >
                  Claim referral
                </DefaultButton>
              )}
            </div>
            {appStoreRedirectModalVisible && window.innerWidth < 720 && (
              <AppStoreRedirectsModal
                onClose={() => setAppStoreRedirectModalVisible(false)}
              />
            )}
          </div>
        </div>
      </BorderedMainContent>
    </Page>
  );
}

export { ReferralPageWithoutUsername, ReferralPageWithUsername };
