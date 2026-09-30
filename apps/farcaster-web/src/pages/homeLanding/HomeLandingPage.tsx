import { AnalyticsEvent } from 'farcaster-analytics';
import React, { useState } from 'react';

import { Image } from '~/components/images/Image';
import { ExternalLink } from '~/components/links/ExternalLink';
import { Link } from '~/components/links/Link';
import { LogoBrandContextMenu } from '~/components/LogoBrandContextMenu';
import { LoginMagicLinkModal } from '~/components/modals/LoginMagicLinkModal';
import { LoginModal } from '~/components/modals/LoginModal';
import { Page } from '~/components/page/Page';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { isMobile } from '~/utils/navigatorUtils';

import LandingVideo from './LandingVideo.mp4';

function FullLogo() {
  return (
    <svg
      width={165}
      height={23}
      viewBox="0 0 165 23"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#clip0_290_310)">
        <path
          d="M25.6958 3.08141H22.6493V6.15997H23.5826V6.16087H25.6958V22.8188H20.5927L20.5896 22.8035L17.9857 10.3421C17.7374 9.15422 17.0877 8.07935 16.1564 7.31498C15.2251 6.55065 14.0519 6.12979 12.8532 6.12978H12.8429C11.6442 6.12979 10.471 6.55061 9.53964 7.31498C8.60831 8.07935 7.95874 9.1546 7.71048 10.3421L5.10348 22.8188H0V6.16048H2.11314V6.15997H3.0465V3.08141H0V0H25.6958V3.08141Z"
          fill="white"
        />
        <path
          d="M137.611 14.6175C137.611 9.1018 140.735 6.25098 145.527 6.25098C150.289 6.25098 153.044 9.16378 153.044 13.9823V15.6246L141.087 15.6246C141.148 18.305 142.786 20.1797 145.512 20.1797C148.145 20.1797 149.293 18.7543 149.538 17.5458H152.723V18.0106C152.294 20.1023 150.396 22.9996 145.558 22.9996C140.75 22.9996 137.611 20.1333 137.611 14.6175ZM141.133 12.8977L149.63 12.8977C149.6 10.7131 148.222 9.03983 145.481 9.03983C142.817 9.03983 141.332 10.7596 141.133 12.8977Z"
          fill="white"
        />
        <path
          d="M128.61 6.62318L128.61 2.37793L132.239 2.37793V6.62318H136.71V9.45852H132.239V19.3434L132.484 19.5913H136.633V22.6281H132.974C130.233 22.6281 128.61 21.2027 128.61 18.4758V9.45852L128.61 6.62318Z"
          fill="white"
        />
        <path
          d="M112.569 10.9922C112.569 8.09485 115.019 6.2666 119.321 6.2666C123.639 6.2666 126.165 8.09485 126.425 11.0851V11.5499L123.118 11.5499C123.011 9.6752 121.495 9.02447 119.337 9.02447C117.193 9.02447 116.014 9.6752 116.014 10.9147C116.014 12.1542 116.994 12.557 118.357 12.7739L121.327 13.2387C124.481 13.7345 126.64 15.0515 126.64 17.9643C126.64 20.8771 124.358 22.9842 119.765 22.9842C115.172 22.9842 112.508 20.8771 112.278 18.0418V17.5769H115.647C115.8 19.4517 117.499 20.2264 119.765 20.2264C122.031 20.2264 123.18 19.4207 123.18 18.1657C123.18 16.9262 122.184 16.4149 120.515 16.1515L117.545 15.6867C114.575 15.2219 112.569 13.8895 112.569 10.9922Z"
          fill="white"
        />
        <path
          d="M96.4589 11.147C96.7804 8.15669 99.3526 6.25098 103.594 6.25098C107.819 6.25098 110.361 8.15669 110.361 12.3555V22.6277H107.008V20.7065H106.763C106.166 21.7911 104.711 22.9376 101.573 22.9376C98.0665 22.9376 95.6475 21.1558 95.6475 18.1036C95.6475 14.8964 98.0819 13.4555 101.251 13.0527L106.885 12.34V11.9526C106.885 9.86099 105.768 9.00884 103.532 9.00884C101.297 9.00884 100.011 9.86099 99.8426 11.6118H96.4589V11.147ZM99.2608 17.9022C99.2608 19.2966 100.409 20.1333 102.277 20.1333C104.864 20.1333 106.885 18.7543 106.885 15.795V14.9894L102.032 15.6401C100.348 15.8725 99.2608 16.5232 99.2608 17.9022Z"
          fill="white"
        />
        <path
          d="M78.8926 14.6175C78.8926 9.1173 82.215 6.25098 87.0379 6.25098C91.7995 6.25098 94.1726 9.1018 94.3717 11.8907V12.3555L91.0033 12.3555C90.8655 10.8526 89.855 9.14828 87.1297 9.14828C84.3279 9.14828 82.5365 11.1005 82.5365 14.6175C82.5365 18.1501 84.3126 20.1023 87.1297 20.1023C89.8856 20.1023 90.8808 18.3825 91.0492 16.7866H94.4329V17.2514C94.1879 20.1488 91.8454 22.9996 87.0379 22.9996C82.1997 22.9996 78.8926 20.1333 78.8926 14.6175Z"
          fill="white"
        />
        <path
          d="M52.5439 11.147C52.8654 8.15669 55.4376 6.25098 59.6787 6.25098C63.9044 6.25098 66.446 8.15669 66.446 12.3555V22.6277H63.0929V20.7065H62.848C62.2508 21.7911 60.7963 22.9376 57.6576 22.9376C54.1515 22.9376 51.7324 21.1558 51.7324 18.1036C51.7324 14.8964 54.1668 13.4555 57.3361 13.0527L62.9704 12.34V11.9526C62.9704 9.86099 61.8528 9.00884 59.6174 9.00884C57.3821 9.00884 56.096 9.86099 55.9275 11.6118H52.5439V11.147ZM55.3457 17.9022C55.3457 19.2966 56.494 20.1333 58.3619 20.1333C60.9494 20.1333 62.9704 18.7543 62.9704 15.795V14.9894L58.117 15.6401C56.4328 15.8725 55.3457 16.5232 55.3457 17.9022Z"
          fill="white"
        />
        <path
          d="M36.6826 0.317383L51.6871 0.317383V3.46259L40.4337 3.46259V9.93892L50.4469 9.93892V13.0996L40.4337 13.0996V22.6282H36.6826V0.317383Z"
          fill="white"
        />
        <rect
          x={69.0234}
          y={6.53906}
          width={3.6192}
          height={16.3502}
          fill="white"
        />
        <rect
          x={78.3301}
          y={6.4082}
          width={3.00844}
          height={9.30651}
          transform="rotate(90 78.3301 6.4082)"
          fill="white"
        />
        <rect
          x={154.979}
          y={6.53906}
          width={3.6192}
          height={16.3502}
          fill="white"
        />
        <rect
          x={164.286}
          y={6.4082}
          width={3.00844}
          height={9.30651}
          transform="rotate(90 164.286 6.4082)"
          fill="white"
        />
      </g>
      <defs>
        <clipPath id="clip0_290_310">
          <rect width={164.286} height={22.9996} fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

export function HomeLandingPage() {
  const { dangerouslyTrackPreAuthEvent, trackEvent } = useAnalytics();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggingInWithMagicLink, setIsLoggingInWithMagicLink] =
    useState(false);

  return (
    <Page className="landing-bg" meta={{ title: 'Farcaster' }}>
      <div className="hidden min-h-dvh w-full flex-col p-[60px] sm:flex">
        <div className="flex flex-row items-center space-x-3 text-md">
          <LogoBrandContextMenu>
            <FullLogo />
          </LogoBrandContextMenu>
        </div>
        <div className="mx-auto mb-8 flex max-w-screen-lg flex-1 flex-col justify-center">
          <div className="flex flex-row items-stretch justify-center ">
            <div className="relative h-[580px] w-[280px] overflow-hidden rounded-[49px]">
              <video
                src={LandingVideo}
                className="absolute inset-0 h-full w-full origin-center object-cover"
                style={{ transform: 'scale(1.1)' }}
                autoPlay
                loop
                muted
                playsInline
                aria-hidden
                tabIndex={-1}
              />
            </div>
            <div className="ml-[50px] flex w-[405px] flex-col py-4">
              <h2 className="text-nowrap font-seasonMix text-3xl font-semibold text-light">
                Build. Share. Grow.
              </h2>
              <div className="mt-[25px] text-[rgba(255,255,255,0.8)]">
                Farcaster is the best place to find new people and express
                yourself through software. It's a decentralized social network
                where you own your identity.
              </div>
              <div className="mt-[35px] flex flex-col space-y-3">
                {isMobile() ? (
                  <ExternalLink
                    href="https://link.farcaster.xyz/download"
                    title="Download Farcaster"
                  >
                    <div className="flex w-full items-center justify-center rounded-[300px] bg-[#7959FF] px-[36px] py-[10px] ">
                      <div className="text-[16px] text-light">Sign up</div>
                    </div>
                  </ExternalLink>
                ) : (
                  <Link
                    to="signup"
                    params={{}}
                    searchParams={{}}
                    title="Download Farcaster"
                  >
                    <div className="flex w-full items-center justify-center rounded-[300px] bg-[#7959FF] px-[36px] py-[10px]">
                      <div className="text-[16px] text-light">Sign up</div>
                    </div>
                  </Link>
                )}
                <div className="flex flex-row items-center space-x-2 py-2">
                  <div className="h-px grow bg-[rgba(255,255,255,0.5)]" />
                  <div className="text-sm text-[rgba(255,255,255,0.5)]">or</div>
                  <div className="h-px grow bg-[rgba(255,255,255,0.5)]" />
                </div>
                <div
                  className="landing-btn-secondary-bg flex w-full cursor-pointer items-center justify-center rounded-[300px] px-[36px] py-[10px]"
                  onClick={() => {
                    trackEvent(AnalyticsEvent.ClickedMagicLink, undefined);
                    setIsLoggingInWithMagicLink(true);
                  }}
                >
                  <div className="text-[16px] text-light">
                    Log in with email
                  </div>
                </div>
                <div
                  className="landing-btn-secondary-bg flex w-full cursor-pointer items-center justify-center rounded-[300px] px-[36px] py-[10px]"
                  onClick={() => {
                    dangerouslyTrackPreAuthEvent(
                      AnalyticsEvent.ClickedLogin,
                      undefined,
                    );
                    setIsLoggingIn(true);
                  }}
                >
                  <div className="text-[16px] text-light">
                    Log in with phone
                  </div>
                </div>
              </div>
              <div className="mt-[35px] flex flex-col space-y-3">
                <div className="flex flex-row items-center space-x-2 py-2">
                  <div className="h-px grow bg-[rgba(255,255,255,0.8)]" />
                  <div className="text-sm text-[rgba(255,255,255,0.8)]">
                    Download the app
                  </div>
                  <div className="h-px grow bg-[rgba(255,255,255,0.8)]" />
                </div>
                <div className="mt-3 flex flex-row space-x-3">
                  <ExternalLink
                    href="https://apps.apple.com/us/app/farcaster/id1600555445"
                    title="Download iOS app"
                    onClick={() => {
                      dangerouslyTrackPreAuthEvent(
                        AnalyticsEvent.ClickedDownloadApple,
                        undefined,
                      );
                    }}
                  >
                    <Image
                      alt="Download iOS app"
                      className="max-h-[60px]"
                      src={'https://farcaster.xyz/~/images/DownloadApple.png'}
                    />
                  </ExternalLink>
                  <ExternalLink
                    href="https://play.google.com/store/apps/details?id=com.farcaster.mobile"
                    title="Download Android app"
                    onClick={() => {
                      dangerouslyTrackPreAuthEvent(
                        AnalyticsEvent.ClickedDownloadGoogle,
                        undefined,
                      );
                    }}
                  >
                    <Image
                      alt="Download Android app"
                      className="max-h-[60px]"
                      src={'https://farcaster.xyz/~/images/DownloadGoogle.png'}
                    />
                  </ExternalLink>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex w-full flex-row items-center justify-between">
          <div className="flex flex-row items-center space-x-0.5">
            <span className="font-seasonMix text-[rgba(255,255,255,0.5)]">
              Copyright © {new Date().getFullYear()} Neynar. All rights
              reserved.
            </span>
          </div>
          <div className="flex flex-row items-center space-x-6">
            <ExternalLink
              href="https://docs.farcaster.xyz"
              title="Developers"
              className="font-seasonMix text-[rgba(255,255,255,0.8)] hover:underline"
            >
              Developers
            </ExternalLink>
            <Link
              to="support"
              params={{}}
              searchParams={{}}
              title="Support"
              className="font-seasonMix text-[rgba(255,255,255,0.8)] hover:underline"
            >
              Support
            </Link>
            <Link
              to="privacyPolicy"
              params={{}}
              searchParams={{}}
              title="Privacy Policy"
              className="font-seasonMix text-[rgba(255,255,255,0.8)] hover:underline"
            >
              Privacy
            </Link>
            <Link
              to="termsOfUse"
              params={{}}
              searchParams={{}}
              title="Terms of Use"
              className="font-seasonMix text-[rgba(255,255,255,0.8)] hover:underline"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
      <div className="container mx-auto flex h-dvh flex-col justify-center p-4 sm:hidden">
        <div className="flex h-full flex-col">
          <div className="my-3 flex w-full flex-none flex-row items-center justify-center">
            <div className="flex flex-row items-center space-x-3 text-md">
              <FullLogo />
            </div>
          </div>
          <div className="relative flex flex-1 flex-col items-center pt-4">
            <div className="relative mx-auto aspect-[9/19] w-[280px] overflow-hidden rounded-[49px]">
              <video
                src={LandingVideo}
                className="absolute inset-0 h-full w-full origin-center object-cover"
                style={{ transform: 'scale(1.1)' }}
                autoPlay
                loop
                muted
                playsInline
                aria-hidden
                tabIndex={-1}
              />
            </div>
            <div className="absolute inset-x-0 bottom-0">
              <div className="glass-landing-bg rounded-t-[40px] pb-8">
                <div className="rounded-lg px-6 pt-6">
                  <h2 className="flex-1 text-nowrap font-seasonMix text-3xl font-semibold text-light">
                    Build. Share. Grow.
                  </h2>
                  <div className="my-[25px] text-[rgba(255,255,255,0.8)]">
                    Farcaster is the best place to find new people and express
                    yourself through software. It's a decentralized social
                    network where you own your identity.
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
                      <ExternalLink
                        href="https://apps.apple.com/us/app/farcaster/id1600555445"
                        title="Download iOS app"
                        onClick={() => {
                          dangerouslyTrackPreAuthEvent(
                            AnalyticsEvent.ClickedDownloadApple,
                            undefined,
                          );
                        }}
                      >
                        <Image
                          alt="Download iOS app"
                          className="max-h-[60px]"
                          src={
                            'https://farcaster.xyz/~/images/DownloadApple.png'
                          }
                        />
                      </ExternalLink>
                      <ExternalLink
                        href="https://play.google.com/store/apps/details?id=com.farcaster.mobile"
                        title="Download Android app"
                        onClick={() => {
                          dangerouslyTrackPreAuthEvent(
                            AnalyticsEvent.ClickedDownloadGoogle,
                            undefined,
                          );
                        }}
                      >
                        <Image
                          alt="Download Android app"
                          className="max-h-[60px]"
                          src={
                            'https://farcaster.xyz/~/images/DownloadGoogle.png'
                          }
                        />
                      </ExternalLink>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isLoggingIn && <LoginModal onClose={() => setIsLoggingIn(false)} />}
      {isLoggingInWithMagicLink && (
        <LoginMagicLinkModal
          onClose={() => setIsLoggingInWithMagicLink(false)}
        />
      )}
    </Page>
  );
}
