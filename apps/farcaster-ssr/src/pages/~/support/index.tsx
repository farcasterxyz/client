import {
  appPathPrefix,
  appPrivayPolicyPathPrefix,
  appTermsOfUsePathPrefix,
} from 'farcaster-web/src/constants/routePrefixes';

import { InternalLink } from '~/components/links/InternalLink';
import { OGHead } from '~/components/meta/OGHead';
import { H1, H2, Para } from '~/components/text/Paragraph';
import { defaultOGImagePath } from '~/constants/og';
import { useRequest } from '~/contexts/RequestProvider';
import { getImageUrl } from '~/utils/imageUtils';

const title = 'Farcaster Support';
const description = 'Get help with Farcaster and the Farcaster network';

export default function SupprtPage() {
  const { host } = useRequest();

  return (
    <>
      <OGHead
        description={description}
        imageUrl={getImageUrl({ path: defaultOGImagePath, host })}
        title={title}
        type="website"
        url={`${host}${appPathPrefix}/signup`}
      />
      <H1>Support</H1>
      <H2>Important Links</H2>
      <Para>
        <InternalLink path={appPrivayPolicyPathPrefix}>
          Privacy Policy
        </InternalLink>
      </Para>
      <Para>
        <InternalLink path={appTermsOfUsePathPrefix}>Terms of Use</InternalLink>
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
        account and follow the instructions to confirm you would like to delete
        your account.
      </Para>
      <H2>Contact us</H2>
      <Para>
        If you need to contact support, please send an email to{' '}
        <a href="mailto:support+web@neynar.com" title="Email Support">
          support+web@neynar.com
        </a>
        .
      </Para>
    </>
  );
}
