import { appPathPrefix } from 'farcaster-web/src/constants/routePrefixes';

import { OGHead } from '~/components/meta/OGHead';
import { H1, Para } from '~/components/text/Paragraph';
import { defaultOGImagePath } from '~/constants/og';
import { useRequest } from '~/contexts/RequestProvider';
import { getImageUrl } from '~/utils/imageUtils';

export default function DeleteAccountPage() {
  const { host } = useRequest();

  return (
    <>
      <OGHead
        description="Delete your Farcaster account"
        imageUrl={getImageUrl({ path: defaultOGImagePath, host })}
        title="Delete Your Account"
        type="website"
        url={`${host}${appPathPrefix}/support/deleteaccount`}
      />
      <H1>Delete your account</H1>
      <Para>
        To delete your Farcaster account, please send an email to{' '}
        <a href="mailto:support+deleteaccount@neynar.com" title="Email Support">
          support+deleteaccount@neynar.com
        </a>{' '}
        with the subject &quot;Delete account&quot;.
      </Para>
      <Para>
        Please include the username associated with your account in the body of
        the email.
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
    </>
  );
}
