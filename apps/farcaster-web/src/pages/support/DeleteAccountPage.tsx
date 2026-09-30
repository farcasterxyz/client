import React from 'react';

import { ExternalLink } from '~/components/links/ExternalLink';
import { StandalonePage } from '~/components/page/StandalonePage';
import { H1 } from '~/components/text/H1';
import { Para } from '~/components/text/Para';

const DeleteAccountPage: React.FC = React.memo(() => {
  return (
    <StandalonePage meta={{ title: 'Delete Your Account' }}>
      <div className="py-4">
        <H1>Delete your account</H1>
        <Para>
          To delete your Farcaster account, please send an email to{' '}
          <ExternalLink
            href="mailto:support+deleteaccount@neynar.com"
            title="Email Support"
          >
            support+deleteaccount@neynar.com
          </ExternalLink>{' '}
          with the subject &quot;Delete account&quot;.
        </Para>
        <Para>
          Please include the username associated with your account in the body
          of the email.
        </Para>
        <Para>
          The email must be from the same email associated with the account.
        </Para>
        <Para>
          Farcaster will then delete any personal information we have stored on
          our servers, including your email address.
        </Para>
        <Para>
          We will send you a confirmation email once your data has been deleted,
          typically within a week.
        </Para>
      </div>
    </StandalonePage>
  );
});

DeleteAccountPage.displayName = 'DeleteAccountPage';

export { DeleteAccountPage };
