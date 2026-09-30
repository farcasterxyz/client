import { ApiNotificationIcon } from 'farcaster-client-data';
import React, { FC, useMemo } from 'react';
import { View } from 'react-native';

import { AirdropIcon } from '~/components/images/AirdropIcon';
import { SimplerRemoteImage } from '~/components/SimplerRemoteImage';
import { useTheme } from '~/contexts/ThemeProvider';

type LogoWithBadgeProps = {
  icon: ApiNotificationIcon;
};

export const LogoWithBadge: FC<LogoWithBadgeProps> = ({ icon }) => {
  const t = useTheme();

  const bottomRightIcon = useMemo(() => {
    if (icon.bottomRightIcon === 'airdrop') {
      return (
        <View style={[t.absolute, { bottom: -8, right: -8 }]}>
          <AirdropIcon />
        </View>
      );
    }
    return null;
  }, [icon, t]);

  return (
    <View
      style={[
        t.w12,
        t.h12,
        t.bgBlack,
        t.justifyCenter,
        t.itemsCenter,
        t.relative,
        { borderRadius: 14 },
      ]}
    >
      <SimplerRemoteImage
        uri={icon.assetImageUrl}
        width={icon.width ?? 29}
        height={icon.height ?? 29}
      />
      {bottomRightIcon}
    </View>
  );
};
