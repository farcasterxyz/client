import { FC } from 'react';

import { FallbackOGHead } from '~/components/meta/FallbackOGHead';

const DefaultPage: FC = () => {
  return (
    <>
      <FallbackOGHead />
      <div className="h-full w-full landing-bg">
        {/* Desktop header with logo */}
        <div className="hidden min-h-dvh w-full flex-col p-[60px] sm:flex">
          <div className="flex flex-row items-center space-x-3 text-md">
            <svg
              width="165"
              height="23"
              viewBox="0 0 165 23"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_290_310)">
                <rect
                  x="78.3301"
                  y="6.4082"
                  width="3.6192"
                  height="16.3502"
                  fill="white"
                />
                <rect
                  x="154.979"
                  y="6.53906"
                  width="3.6192"
                  height="16.3502"
                  fill="white"
                />
                <rect
                  x="164.286"
                  y="6.4082"
                  width="3.00844"
                  height="9.30651"
                  transform="rotate(90 164.286 6.4082)"
                  fill="white"
                />
                <path
                  d="M0 0H17.1429V5.52381H5.71429V9.28571H14.2857V14.8095H5.71429V23H0V0Z"
                  fill="white"
                />
                <path
                  d="M26.0714 0H31.7857L40 23H33.9286L32.5 18.4286H25.3571L23.9286 23H17.8571L26.0714 0ZM28.9286 8.57143L26.7857 14.0952H31.0714L28.9286 8.57143Z"
                  fill="white"
                />
                <path
                  d="M40.7143 0H54.2857C58.5714 0 61.4286 2.85714 61.4286 7.14286C61.4286 10.7143 59.2857 13.2143 55.7143 13.9286L62.1429 23H55.3571L49.6429 14.2857H46.4286V23H40.7143V0ZM52.8571 9.28571C54.6429 9.28571 55.7143 8.57143 55.7143 6.78571C55.7143 5 54.6429 4.28571 52.8571 4.28571H46.4286V9.28571H52.8571Z"
                  fill="white"
                />
                <path
                  d="M72.1429 4.64286V9.28571H78.5714V13.5714H72.1429V18.2143H80V23H66.4286V0H80V4.64286H72.1429Z"
                  fill="white"
                />
                <path
                  d="M90.3571 0H96.0714L104.286 23H98.2143L96.7857 18.4286H89.6429L88.2143 23H82.1429L90.3571 0ZM93.2143 8.57143L91.0714 14.0952H95.3571L93.2143 8.57143Z"
                  fill="white"
                />
                <path
                  d="M113.571 0C119.286 0 123.571 3.57143 123.571 9.64286C123.571 12.8571 122.143 15.3571 119.643 17L125 23H117.857L113.571 18.2143H111.429V23H105.714V0H113.571ZM112.857 13.5714C115.714 13.5714 117.857 12.1429 117.857 9.64286C117.857 7.14286 115.714 5.71429 112.857 5.71429H111.429V13.5714H112.857Z"
                  fill="white"
                />
                <path
                  d="M134.286 4.64286V9.28571H140.714V13.5714H134.286V18.2143H142.143V23H128.571V0H142.143V4.64286H134.286Z"
                  fill="white"
                />
              </g>
              <defs>
                <clipPath id="clip0_290_310">
                  <rect width="164.286" height="22.9996" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col justify-center">
          {/* Bottom card with CTA */}
          <div className="absolute inset-x-0 bottom-0">
            <div className="glass-landing-bg rounded-t-[40px] pb-8">
              <div className="rounded-lg px-6 pt-6">
                <h2 className="flex-1 text-nowrap font-seasonMix text-3xl font-semibold text-light">
                  Build. Share. Grow.
                </h2>
                <div className="my-[25px] text-[rgba(255,255,255,0.8)]">
                  Farcaster is the best place to find new people and express
                  yourself through software. It's a decentralized social network
                  where you own your identity.
                </div>
                <div>
                  <div className="flex flex-row items-center space-x-2 py-2">
                    <div className="h-px grow bg-[rgba(255,255,255,0.5)]" />
                    <div className="text-sm text-[rgba(255,255,255,0.5)]">
                      Download the app
                    </div>
                    <div className="h-px grow bg-[rgba(255,255,255,0.5)]" />
                  </div>
                  <div className="mt-3 flex flex-row space-x-3">
                    <a
                      title="Download iOS app"
                      href="https://apps.apple.com/us/app/farcaster/id1600555445"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        loading="lazy"
                        alt="Download iOS app"
                        src="https://farcaster.xyz/~/images/DownloadApple.png"
                      />
                    </a>
                    <a
                      title="Download Android app"
                      href="https://play.google.com/store/apps/details?id=com.farcaster.mobile"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        loading="lazy"
                        alt="Download Android app"
                        src="https://farcaster.xyz/~/images/DownloadGoogle.png"
                      />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

DefaultPage.displayName = 'DefaultPage';

export { DefaultPage };
