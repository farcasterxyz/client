import React from 'react';

import { AvatarImage } from '~/components/avatar/AvatarImage';
import { Image } from '~/components/images/Image';

interface ReferralPageContentProps {
  username: string;
  referralCode?: string;
  avatar: string | undefined;
  footerComponent?: React.ReactNode;
}

interface FeatureCardProps {
  variant:
    | 'coin_finds_you'
    | 'never_feel_left_out'
    | 'lowest_swap_fees'
    | 'swap_in_seconds';
}

const TopLogo: React.FC = () => {
  return (
    <svg
      className="size-6"
      xmlns="http://www.w3.org/2000/svg"
      width="30"
      height="28"
      viewBox="0 0 30 28"
      fill="none"
    >
      <path
        d="M5.20203 0.589355H24.2666V4.39557H29.6878L28.5517 8.20272H27.5897V23.6042C28.0721 23.6042 28.4637 23.9909 28.4637 24.4686V25.5068H28.6387C29.122 25.5068 29.5137 25.8944 29.5137 26.3722V27.4104H19.7185V26.3722C19.7185 25.8944 20.1101 25.5068 20.5935 25.5068H20.7685V24.4686C20.7685 24.0531 21.0648 23.7064 21.4592 23.6228L21.4407 15.1246C21.1314 11.7292 18.2472 9.06807 14.7343 9.06807C11.2214 9.06807 8.33717 11.7292 8.02791 15.1246L8.00939 23.6153C8.47605 23.6841 9.05012 24.0401 9.05012 24.4686V25.5068H9.22512C9.70752 25.5068 10.0992 25.8944 10.0992 26.3722V27.4104H0.30488V26.3722C0.30488 25.8944 0.696541 25.5068 1.17894 25.5068H1.35394V24.4686C1.35394 23.9909 1.7456 23.6042 2.22893 23.6042V8.20272H1.2669L0.129883 4.39557H5.20203V0.589355Z"
        fill="#DCD3FF"
      />
    </svg>
  );
};

const FeatureCardUI: React.FC<{
  top: React.ReactNode;
  title: string;
  description: string;
}> = ({ top, title, description }) => {
  return (
    <div className="flex h-[189px] w-[148px] flex-col overflow-hidden rounded-xl border bg-primary border-surface-secondary">
      <div className="relative h-[119px] w-full overflow-hidden rounded-b-3xl border-b bg-gradient-to-b from-primary border-tertiary to-brand-light">
        {top}
      </div>
      <div className="mt-auto flex flex-col justify-center gap-1 self-stretch px-4 pb-4 pl-3 pt-2">
        <p className="text-[10px] font-semibold text-primary">{title}</p>
        <p className="text-[8px] text-secondary">{description}</p>
      </div>
    </div>
  );
};

const FeatureCard: React.FC<FeatureCardProps> = ({ variant }) => {
  if (variant === 'coin_finds_you') {
    return (
      <FeatureCardUI
        top={
          <Image
            alt="The coin finds you"
            src={imgCoinFindsYou}
            className="pointer-events-none absolute inset-0 size-full object-contain"
          />
        }
        title="The coin finds you"
        description="Notifications for trending tokens"
      />
    );
  }

  if (variant === 'never_feel_left_out') {
    return (
      <FeatureCardUI
        top={
          <Image
            alt="Never feel left out"
            src={imgNeverFeelLeftOut}
            className="pointer-events-none absolute inset-0 size-full object-contain"
          />
        }
        title="Never feel left out"
        description="Notifications for trending tokens"
      />
    );
  }
  if (variant === 'lowest_swap_fees') {
    return (
      <FeatureCardUI
        top={
          <div className="relative size-full">
            <Image
              alt="Lowest swap fees"
              src={imgLowestSwapFees}
              className="pointer-events-none absolute inset-0 size-full object-contain"
            />
          </div>
        }
        title="Lowest swap fees"
        description="No fees with PRO"
      />
    );
  }
  if (variant === 'swap_in_seconds') {
    return (
      <FeatureCardUI
        top={
          <Image
            alt="Lowest swap fees"
            src={imgSwapInSeconds}
            className="pointer-events-none absolute inset-0 size-full object-contain"
          />
        }
        title="Swap in seconds"
        description="Trade instantly with a tap"
      />
    );
  }
};

// Image assets for the footer
const imgPlaystore =
  'http://localhost:3845/assets/5cc7a03eb6b933f8e58f531f46e5dcd34068ac9e.svg';
const imgPath90 =
  'http://localhost:3845/assets/6c4b7acecf1ceefffc5a776367534d1edf090d15.svg';
const imgLowestSwapFees = '/~/images/lowest_swap_fees.svg';
const imgSwapInSeconds = '/~/images/swap_in_seconds.svg';
const imgNeverFeelLeftOut = '/~/images/never_feel_left_out.svg';
const imgCoinFindsYou = '/~/images/coin_finds_you.svg';

const DefaultFooter: React.FC = () => {
  return (
    <div className="flex w-full flex-col items-center justify-between p-3 pb-6">
      {/* Store download button */}
      <div className="relative h-[54px] w-[162px] rounded-[8.1px] bg-black">
        <div className="relative size-full overflow-hidden">
          {/* Playstore icon */}
          <div className="absolute left-[10.8px] top-[10.8px] h-[32.4px] w-[28.35px]">
            <Image alt="" className="size-full" src={imgPlaystore} />
          </div>
          {/* Content */}
          <div className="absolute left-[48.6px] top-[6.75px] flex flex-col items-start justify-start gap-[4.05px]">
            <div className="text-[13.5px] font-normal uppercase leading-normal text-white">
              GET IT ON
            </div>
            <div className="flex items-center justify-center">
              <div className="scale-y-[-100%]">
                <div className="h-[20.25px] w-[99.9px]">
                  <Image alt="" className="size-full" src={imgPath90} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 rounded-[8.1px] border-[1.35px] border-solid border-[#a6a6a6]" />
      </div>

      {/* Download instructions */}
      <div className="flex flex-col items-center justify-start gap-2">
        <div className="text-center text-[15px] font-semibold leading-[20px] tracking-[-0.25px] text-secondary">
          Download app and visit the link to claim
        </div>
        <div className="relative rounded-[100px] bg-[rgba(0,0,0,0.25)] px-2 py-[3px]">
          <div className="pointer-events-none absolute inset-0 rounded-[100px] border border-solid border-[rgba(255,246,246,0.5)]" />
        </div>
      </div>
    </div>
  );
};

const ReferralPageContent: React.FC<ReferralPageContentProps> = ({
  username,
  avatar,
  footerComponent,
}) => {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center bg-gradient-to-b to-primary p-4 from-brand-light sm:p-6 lg:px-8">
      {/* Header Section */}
      <div className="relative flex flex-col items-center justify-start gap-6">
        <div className="relative flex flex-col items-center justify-start gap-4">
          {/* Logo */}
          <div className="relative flex flex-col items-center justify-center gap-0.5 overflow-hidden rounded-xl px-[11px] py-[13px]">
            <div className="relative h-[27px] w-[30px]">
              <TopLogo />
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="relative flex flex-col items-center justify-start gap-3">
          {/* User Avatar */}
          <div className="relative size-12">
            <AvatarImage
              imgUrl={avatar}
              imgAlt={`${username} avatar`}
              size="md"
            />
          </div>

          {/* Title */}
          <div className="relative max-w-[282px] px-4 text-center text-xl font-semibold tracking-[-0.09px] text-primary sm:text-2xl">
            <p className="leading-[28px] sm:leading-[32px]">
              🎉 Claim free trading for 30 days from @{username}
            </p>
          </div>

          {/* Description */}
          <div className="relative max-w-[352px] px-4 text-center text-sm font-medium tracking-[-0.25px] text-secondary">
            <p className="leading-[18px]">
              Farcaster makes discovering, trading and talking about crypto
              simple, fast, and fun.
            </p>
          </div>
        </div>
      </div>

      {/* Feature Carousel */}
      <div className="relative mt-4 w-full overflow-hidden">
        <div className="scrollbar-hide flex touch-pan-x snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4">
          {/* Left spacer equals half viewport */}
          <div
            className="pointer-events-none shrink-0 basis-1/2"
            aria-hidden="true"
          />
          <div className="shrink-0 snap-center">
            <div className="max-w-[calc(100vw-2rem)]">
              <FeatureCard variant="coin_finds_you" />
            </div>
          </div>
          <div className="shrink-0 snap-center">
            <div className="max-w-[calc(100vw-2rem)]">
              <FeatureCard variant="never_feel_left_out" />
            </div>
          </div>
          <div className="shrink-0 snap-center">
            <div className="max-w-[calc(100vw-2rem)]">
              <FeatureCard variant="lowest_swap_fees" />
            </div>
          </div>
          <div className="shrink-0 snap-center">
            <div className="max-w-[calc(100vw-2rem)]">
              <FeatureCard variant="swap_in_seconds" />
            </div>
          </div>
          {/* Right spacer to center the last card when snapped */}
          <div
            className="pointer-events-none shrink-0 basis-1/2"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Footer - Use provided component or default */}
      {footerComponent || <DefaultFooter />}
    </div>
  );
};

export { ReferralPageContent };
