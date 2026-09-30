import classNames from 'classnames';
import { AnalyticsEvent } from 'farcaster-analytics';
import { useFarcasterApiClient } from 'farcaster-client-hooks';
import { FC, memo, useCallback, useState } from 'react';

import { TextInput } from '~/components/forms/TextInput';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
type LoginMagicLinkWithInstructionsProps = {
  onClose: () => void;
};

const LoginMagicLinkWithInstructions: FC<LoginMagicLinkWithInstructionsProps> =
  memo(({ onClose }) => {
    const { trackEvent } = useAnalytics();
    const [email, setEmail] = useState<string>('');
    const { apiClient } = useFarcasterApiClient();

    const [error, setError] = useState<string>();
    const [success, setSuccess] = useState<boolean>();
    const [attemptingLogin, setAttemptingLogin] = useState<boolean>(false);

    const login = useCallback(async () => {
      try {
        setAttemptingLogin(true);
        setError(undefined);
        trackEvent(AnalyticsEvent.ClickedSendMagicLink, {});
        await apiClient.initiateMagicLink({
          email,
          source: 'web',
        });

        setAttemptingLogin(false);
        setSuccess(true);
      } catch (error) {
        setAttemptingLogin(false);
        setError('Invalid email');
      }
    }, [apiClient, email, trackEvent]);

    return (
      <>
        <div className="flex flex-col space-y-3 px-8 py-12">
          <h3 className="font-seasonMix text-3xl font-semibold text-light">
            Log in with email
          </h3>
          <div className="text-light">
            Enter your email address to receive a link.
          </div>
          <div
            className={classNames(
              'flex w-full grow flex-col space-y-4',
              attemptingLogin && 'animate-pulse',
            )}
          >
            <div className="flex flex-col space-y-2">
              <TextInput
                className="!rounded-[12px] !border-none !bg-[rgba(249,249,249,0.05)] py-4 text-light"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                placeholder="satoshin@gmx.com"
                autoFocus={true}
              />
              {error && (
                <div className="text-left text-sm text-danger">{error}</div>
              )}
              {success && (
                <div className="rounded-md text-left text-sm text-success">
                  Please check your email
                </div>
              )}
            </div>
            <div
              onClick={login}
              className="flex w-full items-center justify-center rounded-[300px] bg-[#7959FF] px-[36px] py-[10px] "
            >
              <div className="text-[16px] text-light">
                {(success && 'Resend email') || 'Send email'}
              </div>
            </div>
            <div
              className="landing-btn-secondary-bg flex w-full cursor-pointer items-center justify-center rounded-[300px] px-[36px] py-[10px]"
              onClick={onClose}
            >
              <div className="text-[16px] text-light">Cancel</div>
            </div>
          </div>
        </div>
      </>
    );
  });

LoginMagicLinkWithInstructions.displayName = 'LoginMagicLinkWithInstructions';

export { LoginMagicLinkWithInstructions };
