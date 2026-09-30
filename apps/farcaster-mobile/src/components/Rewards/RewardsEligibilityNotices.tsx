import React from 'react';
import { View } from 'react-native';

import { GeoLockedIcon } from '~/components/icons/GeoLockedIcon';
import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

const GeoLockedBadge = ({
  color,
  size,
  bgColor,
}: {
  color: string;
  size: number;
  bgColor?: string;
}) => {
  const t = useTheme();
  return (
    <View
      style={[
        t.roundedFull,
        t.p3,
        {
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: bgColor ?? t.colors.bgMuted,
        },
      ]}
    >
      <GeoLockedIcon color={color} size={size / 2} />
    </View>
  );
};

const RewardsUnsupportedRegionNoticeWithCallToAction = () => {
  const t = useTheme();

  return (
    <View style={[t.roundedLg, t.bgWarn, t.p3, { gap: 8 }]}>
      <View style={[t.flexRow, { gap: 8 }]}>
        <GeoLockedBadge
          color={t.colors.text.warning}
          size={30}
          bgColor={'#F8EFD150'}
        />
        <View style={[t.flex1, t.flexCol, { gap: 2 }]}>
          <Text2 weight="semibold" size="sm">
            You're in an unsupported region
          </Text2>
        </View>
      </View>
    </View>
  );
};

const RewardsUnsupportedRegionNoticeSlim = () => {
  const t = useTheme();
  return (
    <View style={[t.roundedLg, t.bgSwap, t.p3, { gap: 8 }]}>
      <View style={[t.flexRow, { gap: 8 }]}>
        <GeoLockedBadge
          color={t.colors.text.secondary}
          size={30}
          bgColor={t.colors.bgHover}
        />
        <View style={[t.flex1, t.flexCol, { gap: 2 }]}>
          <Text2 weight="semibold" size="sm">
            Unsupported Region
          </Text2>
          <Text2 color="secondary" size="sm">
            Rewards aren't available in your region at this time.
          </Text2>
        </View>
      </View>
    </View>
  );
};

export {
  RewardsUnsupportedRegionNoticeSlim,
  RewardsUnsupportedRegionNoticeWithCallToAction,
};
