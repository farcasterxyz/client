import { LikeIconType } from 'farcaster-client-hooks';
import React from 'react';

import { ClankerReactionIcon } from './ClankerReactionIcon';
import { DegenHatIcon } from './DegenHatIcon';
import { FarcasterReactionIcon } from './FarcasterReactionIcon';
import { GaReactionIcon } from './GaReactionIcon';
import { GmReactionIcon } from './GmReactionIcon';
import { GnReactionIcon } from './GnReactionIcon';
import { NogglesReactionArt } from './NogglesReactionArt';
import { RainbowWalletActiveIcon } from './RainbowWalletActiveIcon';
import { RainbowWalletIcon } from './RainbowWalletIcon';
import { WOWOWIcon } from './WOWOWIcon';

type ThemedReactionIconProps = {
  active: boolean;
  iconType: Exclude<LikeIconType, 'default'>;
};

const ThemedReactionIcon: React.FC<ThemedReactionIconProps> = ({
  active,
  iconType,
}) => {
  switch (iconType) {
    case 'gm':
      return <GmReactionIcon active={active} />;
    case 'ga':
      return <GaReactionIcon active={active} />;
    case 'gn':
      return <GnReactionIcon active={active} />;
    case 'farcaster':
      return <FarcasterReactionIcon />;
    case 'clanker':
      return <ClankerReactionIcon />;
    case 'wowow':
      return <WOWOWIcon />;
    case 'degen':
      return <DegenHatIcon />;
    case 'noggles':
      return <NogglesReactionArt preserveColors={active} />;
    case 'rainbow-wallet':
      return active ? <RainbowWalletActiveIcon /> : <RainbowWalletIcon />;
    default:
      return null;
  }
};

export { ThemedReactionIcon };
