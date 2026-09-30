import React from 'react';

import { ExternalLink } from '~/components/links/ExternalLink';
import { Link } from '~/components/links/Link';
import { StandalonePage } from '~/components/page/StandalonePage';
import { H1 } from '~/components/text/H1';
import { H2 } from '~/components/text/H2';
import { Para } from '~/components/text/Para';

const SupportPage: React.FC = React.memo(() => {
  return (
    <StandalonePage meta={{ title: 'Farcaster Support' }}>
      <div className="py-4">
        <H1>Support</H1>
        <H2>Important Links</H2>
        <Para>
          <Link
            to="privacyPolicy"
            params={{}}
            searchParams={{}}
            title="Privacy Policy"
          >
            Privacy Policy
          </Link>
        </Para>
        <Para>
          <Link
            to="termsOfUse"
            params={{}}
            searchParams={{}}
            title="Terms of User"
          >
            Terms of Use
          </Link>
        </Para>
        <H2>How is my data used?</H2>
        <Para>
          Neynar only collects a limited amount of personal data like an email
          address and device identifiers. We use this information to offer the
          core functionality of the app and for analytics to improve the app.
        </Para>
        <H2>
          Is my data shared with or sold to 3rd parties for advertising or
          tracking purposes?
        </H2>
        <Para>
          No. Neynar uses a select number of 3rd-party analytics tools strictly
          for improving app functionality and performance.
        </Para>
        <H2>How do I delete my account?</H2>
        <Para>
          In the app, open the side menu and navigate to Advanced. Tap Delete
          account and follow the instructions to confirm you would like to
          delete your account.
        </Para>
        <H2>Contact us</H2>
        <Para>
          If you need to contact support, please send an email to{' '}
          <ExternalLink
            href="mailto:support+web@neynar.com"
            title="Email Support"
          >
            support+web@neynar.com
          </ExternalLink>
          .
        </Para>
      </div>
    </StandalonePage>
  );
});

SupportPage.displayName = 'SupportPage';

export { SupportPage };
