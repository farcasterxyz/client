import { AnalyticsEvent } from 'farcaster-analytics';
import { useSaveDeferredDeepLink } from 'farcaster-client-hooks';
import { CheckIcon, CopyIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { QRCode } from 'react-qrcode-logo';

import { AndroidIcon } from '~/components/icons/AndroidIcon';
import { AppleIcon } from '~/components/icons/AppleIcon';
import { Image } from '~/components/images/Image';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useExternalNavigate } from '~/hooks/navigation/useExternalNavigate';
import { isIOS, isMobile } from '~/utils/navigatorUtils';
import { toast } from '~/utils/toast';

const imgApple = '/~/images/AppleIcon.svg';
const imgAndroidRobot11 = '/~/images/AndroidIcon.svg';

interface ReferralLandingPageContentProps {
  username: string;
  avatar: string | undefined;
  referralCode: string;
  qrUrl: string;
  onJoinReferral: () => void;
  copyAnalyticsEvent: AnalyticsEvent;
}

const androidPlayStoreUrl =
  'https://play.google.com/store/apps/details?id=com.farcaster.mobile';
const iosAppStoreUrl = 'https://apps.apple.com/us/app/farcaster/id1600555445';

async function roundImageToBase64(
  url: string,
  size = 128,
  borderWidth = 2,
  borderColor = 'white',
) {
  const img = new window.Image();
  img.crossOrigin = 'anonymous'; // important for remote images
  img.src = url;

  return new Promise((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }

      // Draw circular border
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - borderWidth / 2, 0, Math.PI * 2);
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      ctx.stroke();
      ctx.closePath();

      // Clip inside circle
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - borderWidth, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Draw image inside clipped area
      ctx.drawImage(
        img,
        borderWidth,
        borderWidth,
        size - borderWidth * 2,
        size - borderWidth * 2,
      );

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
  });
}

const useRoundedAvatar = (avatarUrl: string) => {
  const [roundedAvatar, setRoundedAvatar] = useState<string | null>(null);
  useEffect(() => {
    roundImageToBase64(avatarUrl).then((roundedAvatar) =>
      setRoundedAvatar(roundedAvatar as string),
    );
  }, [avatarUrl]);
  return roundedAvatar;
};

function MobileProductCard({
  code,
  avatarUrl,
  username,
  onJoinReferral,
  onDownloadAppAndroid,
  onDownloadAppIOS,
  qrUrl,
  copyAnalyticsEvent,
}: {
  code: string;
  avatarUrl: string;
  username: string;
  onJoinReferral: () => void;
  onDownloadAppAndroid: () => void;
  onDownloadAppIOS: () => void;
  qrUrl: string;
  copyAnalyticsEvent: AnalyticsEvent;
}) {
  const roundedAvatar = useRoundedAvatar(avatarUrl);
  const { trackEvent } = useAnalytics();

  const [copied, setCopied] = React.useState(false);
  const onCopy = React.useCallback(() => {
    if (!qrUrl) {
      return;
    }
    trackEvent(copyAnalyticsEvent, {
      link: qrUrl,
    });
    toast({
      message: 'Referral link copied to clipboard!',
      toastId: 'referral-link-copied',
      position: 'top-center',
    });
    navigator.clipboard.writeText(qrUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [qrUrl, copyAnalyticsEvent, trackEvent]);

  return (
    <div className="relative flex w-full flex-col items-start justify-start gap-12">
      {/* Product Card */}
      <div className="relative flex w-full flex-col items-center justify-start gap-5">
        {/* Product Image */}
        <div className="relative h-[100px] w-[100px] overflow-hidden rounded-full">
          {roundedAvatar ? (
            <Image
              alt={`${username} avatar`}
              className="h-full w-full rounded-full object-cover"
              src={avatarUrl}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-300">
              <span className="text-2xl text-gray-600">👤</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="relative flex w-full flex-col items-start justify-start gap-5">
          {/* Code Container */}
          <div
            onClick={copied ? undefined : onCopy}
            className="relative flex h-[52px] w-full cursor-pointer items-center justify-center rounded-[45px] border-white/20 bg-white/10 shadow-[0px_16px_80px_20px_rgba(0,0,0,0.25)] backdrop-blur-[20px]"
          >
            <p className="font-['IBM_Plex_Sans_Condensed',_sans-serif] text-[28px] font-semibold tracking-[10px] text-white">
              {code}
            </p>
            <div
              className={`ml-4 flex h-8 w-8 items-center justify-center ${copied ? 'text-green-500' : 'text-white'}`}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </div>
          </div>

          {/* Description Container */}
          <div className="flex w-full flex-col items-center justify-start gap-1 text-center">
            <p className="w-full text-[20px] leading-[20px] tracking-[-0.5px] text-[#a5a5a5]">
              Join {username} on Farcaster to get
            </p>
            <p className="w-full text-[24px] text-white">
              20% off trading fees
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="relative flex w-full flex-col items-start justify-start gap-3">
        {/* Download App Button */}
        {isMobile() ? (
          <div className="relative flex h-[52px] w-full items-center justify-center rounded-[45px] border-2 border-white/20 text-white">
            <button
              onClick={isIOS() ? onDownloadAppIOS : onDownloadAppAndroid}
              className="flex h-full w-full items-center justify-center gap-[10px] rounded-[32px] bg-white/5 px-4 py-[7px] transition-colors hover:bg-white/10"
            >
              <p className="font-['STK_Bureau_Sans',_sans-serif] text-[20px] leading-[20px] text-white">
                Download app
              </p>
            </button>
          </div>
        ) : (
          <div className="relative flex h-[52px] w-full items-center justify-center rounded-[45px] border-2 border-white/20 text-white">
            <button
              onClick={onDownloadAppIOS}
              className="flex h-full w-full items-center justify-center gap-[10px] rounded-[32px] bg-white/5 px-4 py-[7px] transition-colors hover:bg-white/10"
            >
              <div className="flex h-6 w-[20.452px] items-center justify-center">
                <AppleIcon color="white" className="h-full w-full" />
              </div>
              <p className="font-['STK_Bureau_Sans',_sans-serif] text-[20px] leading-[20px]">
                Download for iOS
              </p>
            </button>
          </div>
        )}

        {/* Claim Invite Button */}
        {isMobile() ? (
          <button
            onClick={onJoinReferral}
            className="relative flex h-[52px] w-full items-center justify-center rounded-[45px] border-2 border-white/20 bg-white/5 text-white transition-colors  hover:bg-white/10"
          >
            <p className="font-['STK_Bureau_Sans',_sans-serif] text-[20px] leading-[20px] text-white">
              Claim invite
            </p>
          </button>
        ) : (
          <div className="relative flex h-[52px] w-full items-center justify-center rounded-[45px] border-2 border-white/20 text-white">
            <button
              onClick={onDownloadAppAndroid}
              className="flex h-full w-full items-center justify-center gap-[10px] rounded-[32px] bg-white/5 px-4 py-[7px] text-white transition-colors  hover:bg-white/10"
            >
              <div className="flex h-6 w-[20.452px] items-center justify-center">
                <AndroidIcon
                  color="white"
                  strokeColor="black"
                  className="h-full w-full"
                />
              </div>
              <p className="font-['STK_Bureau_Sans',_sans-serif] text-[20px] leading-[20px]">
                Download for Android
              </p>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// DesktopProductCard component based on Figma design
function DesktopProductCard({
  code,
  qrUrl,
  avatarUrl,
  username,
  onDownloadApp,
  copyAnalyticsEvent,
}: {
  code: string;
  qrUrl: string;
  avatarUrl: string;
  onDownloadApp: (platform: 'ios' | 'android') => void;
  username: string;
  copyAnalyticsEvent: AnalyticsEvent;
}) {
  const roundedAvatar = useRoundedAvatar(avatarUrl);
  const [copied, setCopied] = React.useState(false);
  const { trackEvent } = useAnalytics();
  const onCopy = React.useCallback(() => {
    if (!qrUrl) {
      return;
    }
    trackEvent(copyAnalyticsEvent, {
      link: qrUrl,
    });
    toast({
      message: 'Referral link copied to clipboard!',
      toastId: 'referral-link-copied',
      position: 'top-center',
    });
    navigator.clipboard.writeText(qrUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [qrUrl, copyAnalyticsEvent, trackEvent]);

  return (
    <div className="relative flex h-[594px] w-[294px] flex-col items-center justify-start">
      {/* QR Code Section */}
      <div
        className="mb-5 flex h-[294px] w-[294px] items-center justify-center rounded-[45px] border-2 
     border-white/20 
     bg-[linear-gradient(148deg,rgba(255,255,255,0.15)_0%,rgba(255,255,255,0.30)_77.36%)] 
     shadow-[0_16px_80px_20px_rgba(0,0,0,0.25)] backdrop-blur-[20px]"
      >
        <QRCode
          value={qrUrl}
          size={226}
          bgColor="#ffffff00"
          fgColor="#ffffff"
          ecLevel="Q"
          eyeRadius={20}
          logoImage={roundedAvatar || ''}
          logoPaddingStyle="square"
          logoWidth={64}
          logoHeight={64}
        />
      </div>

      {/* Product Info Section */}
      <div className="relative mb-4 flex h-[124px] w-[294px] flex-col items-start justify-start gap-5">
        {/* Code Container */}
        <div
          onClick={copied ? undefined : onCopy}
          className="relative flex h-[52px] w-full cursor-pointer items-center justify-center rounded-[45px] border-2 border-white/20 bg-white/10 shadow-[0px_16px_80px_20px_rgba(0,0,0,0.25)] backdrop-blur-[20px]"
        >
          <p className="font-['IBM_Plex_Sans_Condensed',_sans-serif] text-[28px] font-semibold tracking-[10px] text-white">
            {code}
          </p>
          <div
            className={`ml-4 flex h-8 w-8 items-center justify-center ${copied ? 'text-green-500' : 'text-white'}`}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </div>
        </div>

        {/* Description Container */}
        <div className="flex w-full flex-col items-center justify-start gap-1 text-center">
          <p className="w-full text-[16px] leading-[18.4px] tracking-[-0.5px] text-[#a5a5a5]">
            Join {username} on Farcaster to get
          </p>
          <p className="w-full text-[24px] text-white">20% off trading fees</p>
        </div>
      </div>

      {/* Download Container */}
      <div className="flex h-[108px] w-[294px] flex-col items-start justify-start gap-3">
        {/* iOS Download */}
        <div
          onClick={() => onDownloadApp('ios')}
          className="flex h-[48px] w-full cursor-pointer items-center justify-center gap-[10px] rounded-[32px] bg-white/50 px-4 py-[7px] transition-colors hover:bg-white/60"
        >
          <div className="flex h-6 w-5 items-center justify-center">
            <img alt="Apple logo" className="h-full w-full" src={imgApple} />
          </div>
          <p className="font-['STK_Bureau_Sans',_sans-serif] text-[16px] font-medium leading-[18.4px] tracking-[0.5px] text-[#121212]">
            Download for iOS
          </p>
        </div>

        {/* Android Download */}
        <div
          onClick={() => onDownloadApp('android')}
          className="flex h-[48px] w-full cursor-pointer items-center justify-center gap-[10px] rounded-[32px] bg-white/50 px-4 py-[7px] transition-colors hover:bg-white/60"
        >
          <div className="flex h-6 w-[20.452px] items-center justify-center">
            <img
              alt="Android logo"
              className="h-full w-full"
              src={imgAndroidRobot11}
            />
          </div>
          <p className="font-['STK_Bureau_Sans',_sans-serif] text-[16px] font-medium leading-[18.4px] tracking-[0.5px] text-[#121212]">
            Download for Android
          </p>
        </div>
      </div>
    </div>
  );
}

export function ReferralLandingPageContent({
  username,
  avatar,
  referralCode,
  qrUrl,
  onJoinReferral,
  copyAnalyticsEvent,
}: ReferralLandingPageContentProps) {
  const externalNavigate = useExternalNavigate();
  const { mutate: saveDeferredDeepLink } = useSaveDeferredDeepLink();

  const openDownloadApp = React.useCallback(
    (platform: 'ios' | 'android') => {
      // Save the referral deep link for later retrieval after authentication
      void saveDeferredDeepLink({ targetPath: qrUrl });

      externalNavigate({
        to: platform === 'ios' ? iosAppStoreUrl : androidPlayStoreUrl,
        openInNewTab: true,
      });
    },
    [externalNavigate, qrUrl, saveDeferredDeepLink],
  );

  const openIOSDownloadApp = React.useCallback(() => {
    // Save the referral deep link for later retrieval after authentication
    void saveDeferredDeepLink({ targetPath: qrUrl });

    externalNavigate({
      to: iosAppStoreUrl,
      openInNewTab: true,
    });
  }, [externalNavigate, qrUrl, saveDeferredDeepLink]);

  const openAndroidDownloadApp = React.useCallback(() => {
    void saveDeferredDeepLink({ targetPath: qrUrl });

    externalNavigate({
      to: androidPlayStoreUrl,
      openInNewTab: true,
    });
  }, [externalNavigate, qrUrl, saveDeferredDeepLink]);

  const onJoinReferralWrapped = React.useCallback(() => {
    void saveDeferredDeepLink({ targetPath: qrUrl });
    onJoinReferral();
  }, [onJoinReferral, qrUrl, saveDeferredDeepLink]);

  return (
    <div className="relative size-full min-h-screen">
      <Image
        src={'/~/images/referrals-background.png'}
        alt="Background"
        className="absolute hidden h-full w-full md:flex"
      />
      <Image
        src={'/~/images/referrals-background-mobile.png'}
        alt="Background"
        className="absolute flex h-full w-full md:hidden"
      />
      {/* Desktop Version */}
      <div className="relative z-10 hidden min-h-screen items-center justify-center p-8 md:flex">
        <DesktopProductCard
          code={referralCode}
          qrUrl={qrUrl}
          onDownloadApp={openDownloadApp}
          avatarUrl={avatar || ''}
          username={username}
          copyAnalyticsEvent={copyAnalyticsEvent}
        />
      </div>

      {/* Mobile Version */}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-8 py-6 md:hidden">
        <MobileProductCard
          code={referralCode}
          avatarUrl={avatar || ''}
          username={username}
          onJoinReferral={onJoinReferralWrapped}
          onDownloadAppAndroid={openAndroidDownloadApp}
          onDownloadAppIOS={openIOSDownloadApp}
          qrUrl={qrUrl}
          copyAnalyticsEvent={copyAnalyticsEvent}
        />
      </div>
    </div>
  );
}
