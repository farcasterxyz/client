import qs from 'qs';
import React, { FC, memo, useMemo } from 'react';
import { View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { baseApiUrl } from '~/constants/Api';
import { isDev } from '~/constants/Env';
import { loginChannelIdParam } from '~/constants/Params';
import { useTheme } from '~/contexts/ThemeProvider';

import { Text } from './Text';

type SignInQRCodeProps = {
  channelId: string;
};

const SignInQRCode: FC<SignInQRCodeProps> = memo(({ channelId }) => {
  const t = useTheme();
  const value = useMemo(
    () =>
      `${baseApiUrl}/deeplinks/login-mobile?${qs.stringify({
        [loginChannelIdParam]: channelId,
      })}`,
    [channelId],
  );

  return (
    <View style={[t.flexCol, t.itemsCenter]}>
      <QRCode
        backgroundColor="#ffffff"
        color="#000000"
        ecl="H"
        size={260}
        // Instead of directly targeting the apps, we will hop from our servers to guarantee Android
        // devices handle the linking properly as well.
        value={`${baseApiUrl}/deeplinks/login-mobile?${qs.stringify({
          [loginChannelIdParam]: channelId,
        })}`}
      />
      {isDev && (
        <View style={[t.mT2]}>
          <Text style={[t.textXs, t.texts.tertiary, t.fontBold, t.textCenter]}>
            (Development Only)
          </Text>
          <Text selectable style={[t.textXs, t.texts.secondary, t.textCenter]}>
            {value}
          </Text>
        </View>
      )}
    </View>
  );
});

SignInQRCode.displayName = 'SignInQRCode';

export { SignInQRCode };
