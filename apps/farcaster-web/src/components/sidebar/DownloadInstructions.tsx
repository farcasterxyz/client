import { Image } from '~/components/images/Image';
import { ExternalLink } from '~/components/links/ExternalLink';

const DownloadInstructions = () => (
  <div className="mt-4 w-full flex-row rounded-xl border p-4 bg-overlay-light border-default">
    <span className="text-center text-default">
      <strong>Create an account</strong> by downloading the app
    </span>
    <div className="mt-2 grid grid-cols-2">
      <ExternalLink
        href="https://apps.apple.com/us/app/farcaster/id1600555445"
        title="Download iOS app"
      >
        <Image
          alt="Download iOS app"
          className="max-h-[46px]"
          src={'https://farcaster.xyz/~/images/DownloadApple.png'}
        />
      </ExternalLink>
      <ExternalLink
        href="https://play.google.com/store/apps/details?id=com.farcaster.mobile"
        title="Download Android app"
      >
        <Image
          alt="Download Android app"
          className="max-h-full"
          src={'https://farcaster.xyz/~/images/DownloadGoogle.png'}
        />
      </ExternalLink>
    </div>
  </div>
);

export { DownloadInstructions };
