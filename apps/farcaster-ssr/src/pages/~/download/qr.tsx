import type { GetServerSideProps } from 'next';

const IOS_URL = 'https://apps.apple.com/app/apple-store/id1600555445';
const ANDROID_URL =
  'https://play.google.com/store/apps/details?id=com.farcaster.mobile';
const FALLBACK_URL = '/~/signup';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const ua = context.req.headers['user-agent'] || '';

  let destination = FALLBACK_URL;

  if (/iPhone|iPad|iPod/i.test(ua)) {
    destination = IOS_URL;
  } else if (/Android/i.test(ua)) {
    destination = ANDROID_URL;
  }

  return {
    redirect: {
      destination,
      permanent: false,
    },
  };
};

// Page component is never rendered due to redirect, but Next.js requires a default export
export default function QrRedirectPage() {
  return null;
}
