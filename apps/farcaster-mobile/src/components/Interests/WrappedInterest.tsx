import { Octicons } from '@expo/vector-icons';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiInterestWrapped } from 'farcaster-client-data';
import {
  BookOpen,
  Box,
  Globe,
  Heart,
  Music,
  Newspaper,
  Paintbrush,
  Puzzle,
  Smile,
  Sparkles,
  Terminal,
  Trophy,
  Video,
} from 'lucide-react-native';
import React, { FC, useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';

import { AppleIcon } from '~/components/images/AppleIcon';
import { EthereumIcon } from '~/components/images/EthereumIcon';
import { FarcasterIcon } from '~/components/images/FarcasterIcon';
import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useSelectedInterests } from '~/contexts/SelectedInterestsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useHaptics } from '~/hooks/useHaptics';

type WrappedInterestProps = {
  interest: ApiInterestWrapped;
};

const WrappedInterest: React.FC<WrappedInterestProps> = React.memo(
  ({ interest }) => {
    const t = useTheme();

    const { triggerImpactAsync } = useHaptics();

    const { trackEvent } = useAnalytics();

    const [interested, setInterested] = React.useState<boolean>(false);

    const { addWrappedSelectedInterest, removeWrappedSelectedInterest } =
      useSelectedInterests();

    const group = React.useMemo(() => {
      return interest.content.group;
    }, [interest.content.group]);

    const onChannelPress = React.useCallback(() => {
      if (!interested) {
        trackEvent(AnalyticsEvent.SelectOnboardingInterest, {
          groupType: group.type,
        });

        triggerImpactAsync();
      }

      if (!interested) {
        addWrappedSelectedInterest({ groupType: group.type });
      } else {
        removeWrappedSelectedInterest({ groupType: group.type });
      }

      setInterested((interested) => !interested);
    }, [
      addWrappedSelectedInterest,
      group.type,
      interested,
      removeWrappedSelectedInterest,
      trackEvent,
      triggerImpactAsync,
    ]);

    const iconComp = useMemo(
      () => (
        <InterestIcon
          octiconName={group.octiconName}
          heroiconName={group.heroiconName}
          color={interested ? t.colors.bgDefault : t.colors.text.primary}
        />
      ),
      [
        group.heroiconName,
        group.octiconName,
        interested,
        t.colors.text.primary,
        t.colors.bgDefault,
      ],
    );

    return (
      <TouchableOpacity onPress={onChannelPress} activeOpacity={0.75}>
        <View
          style={[
            t.roundedLg,
            t.pX3,
            { height: 36 },
            t.flex,
            t.flexRow,
            t.itemsCenter,
            t.border,
            { borderColor: t.dark ? t.colors.white : t.colors.black },
            interested && {
              backgroundColor: t.dark ? t.colors.white : t.colors.black,
            },
          ]}
        >
          {iconComp}
          <Text
            style={[
              t.textBase,
              interested ? t.colors.bgDefault : t.texts.primary,
              iconComp !== null && t.mL2,
            ]}
            numberOfLines={1}
          >
            {group.name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  },
);

interface InterestIconProps {
  octiconName?: string;
  heroiconName?: string;
  color: string;
}

const InterestIcon: FC<InterestIconProps> = ({
  octiconName,
  heroiconName,
  color,
}) => {
  switch (heroiconName) {
    // Custom
    case 'ethereum':
      return <EthereumIcon height={18} color={color} />;
    case 'farcaster':
      return <FarcasterIcon height={18} color={color} />;
    case 'apple':
      return <AppleIcon size={16} color={color} />;

    // Default
    case 'command-line':
      return <Terminal size={18} color={color} />;
    case 'sparkles':
      return <Sparkles size={18} color={color} />;
    case 'newspaper':
      return <Newspaper size={18} color={color} />;
    case 'cube-transparent':
      return <Box size={18} color={color} />;
    case 'face-smile':
      return <Smile size={18} color={color} />;
    case 'video-camera':
      return <Video size={18} color={color} />;
    case 'book-open':
      return <BookOpen size={18} color={color} />;
    case 'puzzle-piece':
      return <Puzzle size={18} color={color} />;
    case 'musical-note':
      return <Music size={18} color={color} />;
    case 'trophy':
      return <Trophy size={18} color={color} />;
    case 'paint-brush':
      return <Paintbrush size={18} color={color} />;
    case 'heart':
      return <Heart size={18} color={color} />;
    case 'globe-alt':
      return <Globe size={18} color={color} />;
  }

  if (octiconName) {
    return (
      <Octicons
        // @ts-ignore-next-line
        name={octiconName}
        size={14}
        color={color}
      />
    );
  }

  return null;
};
InterestIcon.displayName = 'InterestIcon';

export { WrappedInterest };
