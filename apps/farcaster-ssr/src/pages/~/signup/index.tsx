import { appPathPrefix } from 'farcaster-web/src/constants/routePrefixes';
import Link from 'next/link';

import { OGHead } from '~/components/meta/OGHead';
import { defaultOGImagePath } from '~/constants/og';
import { useRequest } from '~/contexts/RequestProvider';
import { getImageUrl } from '~/utils/imageUtils';

const title = 'Download Farcaster to sign up';
const description =
  'Download the Farcaster app to create an account and get started on the Farcaster network.';

export default function SignUpPage() {
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
      <p>
        <Link href="/">← Browse Farcaster</Link>
      </p>
      <h1>{title}</h1>
      <p>{description}</p>
      <p>Download from an app store:</p>
      <ul>
        <li>
          <a href="https://apps.apple.com/app/apple-store/id1600555445">
            Download on the App Store
          </a>
        </li>
        <li>
          <a href="https://play.google.com/store/apps/details?id=com.farcaster.mobile">
            Get it on Google Play
          </a>
        </li>
      </ul>
      <hr />
      <nav>
        <Link href="/~/support">Support</Link> |{' '}
        <Link href="/~/privacy-policy">Privacy</Link> |{' '}
        <Link href="/~/terms-of-use">Terms</Link>
      </nav>
    </>
  );
}
