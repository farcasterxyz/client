import { LikeIconType } from 'farcaster-client-hooks';
import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { DegenHatIcon } from '~/components/images/DegenHatIcon';
import { RainbowWalletIcon } from '~/components/images/RainbowWalletIcon';
import { WOWOWIcon } from '~/components/images/WOWOWIcon';
import { useTheme } from '~/contexts/ThemeProvider';

import { ClankerReactionIcon } from './ClankerReactionIcon';
import { FarcasterReactionIcon } from './FarcasterReactionIcon';
import { GaReactionIcon } from './GaReactionIcon';
import { GmReactionIcon } from './GmReactionIcon';
import { GnReactionIcon } from './GnReactionIcon';
import {
  NOGGLES_BLACK_PATH,
  NOGGLES_RED_PATH,
  NOGGLES_WHITE_PATH,
} from './nogglesPixels';

const NOGGLES_VIEWBOX = '0 3 16 8';
const NOGGLES_VIEWBOX_WIDTH = 16;
const NOGGLES_VIEWBOX_HEIGHT = 8;
const NOGGLES_ASPECT_RATIO = NOGGLES_VIEWBOX_WIDTH / NOGGLES_VIEWBOX_HEIGHT;
const NOGGLES_WIDTH_SCALE = 0.55;
const NOGGLES_SCALE = 0.85;
// Nudge the glasses up so they vertically center on the like count. The art
// sits in the lower half of its viewBox, so without this it renders low.
const NOGGLES_Y_OFFSET = -2;

const NogglesReactionIcon = React.memo(
  ({
    color,
    fill,
    height,
  }: {
    color: string;
    fill: boolean;
    height: number;
  }) => {
    const scaledHeight = height * NOGGLES_SCALE;
    const scaledWidth =
      scaledHeight * NOGGLES_ASPECT_RATIO * NOGGLES_WIDTH_SCALE;
    const containerStyle = {
      width: height,
      height,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    };

    return (
      <View style={containerStyle}>
        <Svg
          width={scaledWidth}
          height={scaledHeight}
          viewBox={NOGGLES_VIEWBOX}
          fill="none"
          style={{ marginTop: NOGGLES_Y_OFFSET }}
        >
          <Path d={NOGGLES_RED_PATH} fill={fill ? '#F3322C' : color} />
          <Path d={NOGGLES_BLACK_PATH} fill="#000000" />
          <Path d={NOGGLES_WHITE_PATH} fill="#FFFFFF" />
        </Svg>
      </View>
    );
  },
);

NogglesReactionIcon.displayName = 'NogglesReactionIcon';

const getThemedLikeIconColor = ({
  iconType,
  dark,
  heliotrope,
  minsk,
}: {
  iconType: LikeIconType;
  dark: boolean;
  heliotrope: string;
  minsk: string;
}) => {
  switch (iconType) {
    case 'degen':
    case 'farcaster':
    case 'clanker':
      return dark ? heliotrope : minsk;
    case 'default':
    case 'noggles':
    case 'rainbow-wallet':
      return '#D51338';
    case 'ga':
      return '#B8A34D';
    case 'gm':
      return '#F38234';
    case 'gn':
      return '#9170F6';
    case 'wowow':
    default:
      return '#15803D';
  }
};

const ThemedLikeIcon = ({
  active,
  color,
  iconType,
  size = 16,
}: {
  active: boolean;
  color: string;
  iconType: Exclude<LikeIconType, 'default'>;
  size?: number;
}) => {
  const t = useTheme();
  const iconDimension = Math.round(size * 1.5);

  switch (iconType) {
    case 'gm':
      return <GmReactionIcon color={color} size={size} />;
    case 'ga':
      return <GaReactionIcon color={color} size={size} />;
    case 'gn':
      return <GnReactionIcon color={color} size={size} />;
    case 'farcaster':
      return <FarcasterReactionIcon color={color} size={size} />;
    case 'clanker':
      return <ClankerReactionIcon color={color} size={size} />;
    case 'wowow':
      return (
        <WOWOWIcon color={color} width={iconDimension} height={iconDimension} />
      );
    case 'degen':
      return (
        <DegenHatIcon
          color={color}
          width={iconDimension}
          height={iconDimension}
          alternateColor={t.colors.bgDefault}
        />
      );
    case 'noggles':
      return (
        <NogglesReactionIcon
          color={color}
          height={iconDimension}
          fill={active}
        />
      );
    case 'rainbow-wallet':
      return (
        <RainbowWalletIcon
          color={color}
          width={iconDimension}
          height={iconDimension}
          fill={active}
        />
      );
    default:
      return null;
  }
};

export { getThemedLikeIconColor, ThemedLikeIcon };
