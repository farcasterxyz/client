import { AnalyticsEvent } from 'farcaster-analytics';
import { isError, isHandledFetchError } from 'farcaster-client-data';
import { useSignupForInvite } from 'farcaster-client-hooks';
import React, { FC, memo, useCallback, useMemo, useState } from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { TextInput } from '~/components/forms/TextInput';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { isEmailValid } from '~/utils/emailUtils';
import { trackError } from '~/utils/errorUtils';

type SignupFormProps = {
  inviterFid: number;
  urlIdentifier: string;
  setAppStoreModalVisible: (x: boolean) => void;
};

const SignupForm: FC<SignupFormProps> = memo(
  ({ inviterFid, urlIdentifier, setAppStoreModalVisible }) => {
    const signupForInvite = useSignupForInvite();
    const [email, setEmail] = useState<string>('');
    const [inviting, setInviting] = useState<boolean>(false);
    const [successMessage, setSuccessMessage] = useState<string | undefined>(
      undefined,
    );
    const [errorMessage, setErrorMessage] = useState<string | undefined>(
      undefined,
    );

    const { trackEvent } = useAnalytics();

    const canInvite = useMemo(() => {
      return isEmailValid(email);
    }, [email]);

    const onInviteClick = useCallback(async () => {
      if (!canInvite) {
        setErrorMessage('Invalid email');
        return;
      }

      setSuccessMessage(undefined);
      setErrorMessage(undefined);

      setInviting(true);

      trackEvent(AnalyticsEvent.ClickInviteUser, { email: email });

      try {
        await signupForInvite({ inviterFid, email, identifier: urlIdentifier });
        trackEvent(AnalyticsEvent.SubmitInvite, { email: email });
        setEmail('');
        setSuccessMessage(`Invite sent to ${email}!`);
        setAppStoreModalVisible(true);
      } catch (e) {
        trackError(e);
        setErrorMessage(parseErrorMessage(e));
      } finally {
        setInviting(false);
      }
    }, [
      canInvite,
      email,
      urlIdentifier,
      signupForInvite,
      trackEvent,
      inviterFid,
      setAppStoreModalVisible,
    ]);

    return (
      <div className="flex w-full flex-col items-center">
        <div className="mt-2 flex h-12 flex-row justify-between space-x-0">
          <TextInput
            className="rounded-l-lg rounded-r-none border-r-0 border-verified"
            autoFocus={false}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            placeholder={'Enter email...'}
          />
          <DefaultButton
            variant="normal"
            className="ml-1 w-40 rounded-l-none"
            onClick={onInviteClick}
            isLoading={inviting}
            size={'md'}
          >
            Send Invite
          </DefaultButton>
        </div>
        <div className="my-2 flex h-6 flex-row">
          {typeof successMessage !== 'undefined' && (
            <span className="text-sm text-success">{successMessage}</span>
          )}
          {typeof errorMessage !== 'undefined' && (
            <span className="text-sm text-danger">{errorMessage}</span>
          )}
        </div>
      </div>
    );
  },
);

const parseErrorMessage = (error: unknown): string => {
  if (isHandledFetchError(error) && error.responseData.errors.length) {
    const message = error.responseData.errors[0].message;
    if (message.startsWith('Cannot invite user that was already invited')) {
      return 'This email address has already been invited';
    } else if (message.startsWith('Invalid invite link')) {
      return 'Invalid invite link';
    }
  }

  if (isError(error)) {
    return error.message;
  }

  return 'We were unable to invite that email';
};

export { SignupForm };
