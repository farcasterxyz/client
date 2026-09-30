import Link from 'next/link';

import { FallbackOGHead } from '~/components/meta/FallbackOGHead';

export default function HomePage() {
  return (
    <>
      <FallbackOGHead />
      <h1>Build. Share. Grow.</h1>
      <p>
        Farcaster is the best place to find new people and express yourself
        through software. It's a decentralized social network where you own your
        identity.
      </p>
      <p>
        <Link href="/~/signup">Sign up</Link>
      </p>
      <p>Download the app:</p>
      <ul>
        <li>
          <a href="https://apps.apple.com/us/app/farcaster/id1600555445">
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
        <a href="https://docs.farcaster.xyz">Developers</a> |{' '}
        <Link href="/~/support">Support</Link> |{' '}
        <Link href="/~/privacy-policy">Privacy</Link> |{' '}
        <Link href="/~/terms-of-use">Terms</Link>
      </nav>
      <p>Copyright © {new Date().getFullYear()} Neynar. All rights reserved.</p>
    </>
  );
}
