import qs from 'qs';
import { FC, memo, useMemo } from 'react';
import { QRCode } from 'react-qrcode-logo';

import { isDev } from '~/constants/env';

type LoginQRCodeProps = {
  channelId: string;
  args?: Record<string, string>;
};

const LoginQRCode: FC<LoginQRCodeProps> = memo(({ channelId, args }) => {
  const url = useMemo(() => {
    const q = qs.stringify({ ['channel-id']: channelId, ...args });

    // Instead of directly targeting the apps, we will hop from our servers to guarantee Android
    // devices handle the linking properly as well.
    return `https://farcaster.xyz/login-web?${q}`;
  }, [args, channelId]);

  const showQRCodeURL = useMemo(() => {
    return isDev;
  }, []);

  return (
    <div className="w-[280px] overflow-hidden rounded-lg">
      <QRCode
        bgColor="#141414"
        ecLevel="H"
        eyeRadius={0}
        fgColor="#ffffff"
        size={260}
        value={url}
      />
      {showQRCodeURL && (
        <div className="mt-4 text-sm">
          <div className="mb-1 text-xs font-semibold text-light">
            (Development Only)
          </div>
          <div className="text-sm text-light">{url}</div>
          <div
            onClick={() => {
              navigator.clipboard.writeText(url);
            }}
            className="mb-1 text-link hover:cursor-pointer hover:underline"
          >
            Copy to clipboard
          </div>
        </div>
      )}
    </div>
  );
});

LoginQRCode.displayName = 'LoginQRCode';

export { LoginQRCode };
