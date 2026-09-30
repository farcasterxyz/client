import { Octicons } from '@expo/vector-icons';
import { useNavigationState } from '@react-navigation/native';
import {
  ApiCastFeedItemTopHat,
  ApiCastFeedItemTopHatInteractions,
} from 'farcaster-client-data';
import React, { FC, memo, useMemo } from 'react';
import { View } from 'react-native';

import { UserMinimalMention } from '~/components/casts/UserMinimalMention';
import { CommentFillIcon } from '~/components/images/CommentFillIcon';
import { Text } from '~/components/Text';
import { defaultThumbnailDiameter } from '~/constants/Images';
import { useTheme } from '~/contexts/ThemeProvider';

interface FeedItemTopHatProps {
  isPinnedToChannel?: boolean;
  isPinnedToProfile?: boolean;
  topHat?: ApiCastFeedItemTopHat;
  avatarDiameter?: number;
}

const FeedItemTopHat: FC<FeedItemTopHatProps> = memo(
  ({ isPinnedToChannel, isPinnedToProfile, topHat, avatarDiameter }) => {
    const routeName = useNavigationState(
      (state) => state?.routes?.[state.index]?.name,
    );

    const shouldShowPinned = React.useMemo(() => {
      // Show the pinned label if we are on channel related context and its pinned to channel
      // or its pinned to user profile and we are in user profile context.
      return (
        ((routeName === 'Cast' ||
          routeName === 'Channel' ||
          routeName === 'Feed') &&
          isPinnedToChannel) ||
        ((routeName === 'UserV2' || routeName === 'DeeplinkOnlyUserV2') &&
          isPinnedToProfile)
      );
    }, [isPinnedToChannel, isPinnedToProfile, routeName]);

    if (shouldShowPinned) {
      return <FeedItemTopHatPinned avatarDiameter={avatarDiameter} />;
    } else if (topHat && topHat.type === 'interactions') {
      return (
        <FeedItemTopHatInteractions
          topHat={topHat}
          avatarDiameter={avatarDiameter}
        />
      );
    }

    return null;
  },
);
FeedItemTopHat.displayName = 'FeedItemTopHat';

interface FeedItemTopHatInteractionsProps {
  topHat: ApiCastFeedItemTopHatInteractions;
  avatarDiameter?: number;
}

const FeedItemTopHatInteractions: FC<FeedItemTopHatInteractionsProps> = memo(
  ({ topHat, avatarDiameter }) => {
    const t = useTheme();

    return useMemo(() => {
      let verb = '';
      let icon: React.ReactNode = null;
      const iconSize = 14;
      if (topHat.interactionType === 'like') {
        verb = ' liked';
        icon = (
          <Octicons
            name="heart-fill"
            size={iconSize}
            style={[t.texts.tertiary]}
          />
        );
      } else if (topHat.interactionType === 'recast') {
        verb = ' recasted';
        icon = (
          <Octicons name="sync" size={iconSize} style={[t.texts.tertiary]} />
        );
      } else if (topHat.interactionType === 'reply') {
        verb = ' replied';
        icon = (
          <CommentFillIcon size={iconSize} color={t.colors.text.tertiary} />
        );
      }

      const textStyles = [
        t.texts.tertiary,
        t.fontNormal,
        {
          // these needs to match UserMinimalMention
          lineHeight: 18,
          fontSize: 14,
        },
      ];

      return (
        <FeedItemTopHatContainer avatarDiameter={avatarDiameter} icon={icon}>
          <View style={[t.flexShrink, t.flexRow, t.wFull, t.itemsCenter]}>
            <View style={[t.flexShrink]}>
              <UserMinimalMention user={topHat.actor1} />
            </View>
            {topHat.actor2 && topHat.numActors <= 2 ? (
              <>
                <Text style={textStyles}>{' and '}</Text>
                <View style={[t.flexShrink]}>
                  <UserMinimalMention user={topHat.actor2} />
                </View>
              </>
            ) : topHat.numActors > 2 ? (
              <Text style={textStyles}>
                {' and '}
                {topHat.numActors - 1}
                {topHat.numActors > 2 ? ' others' : ' other'}
              </Text>
            ) : null}
            <Text style={textStyles}>{verb}</Text>
          </View>
        </FeedItemTopHatContainer>
      );
    }, [topHat, avatarDiameter, t]);
  },
);
FeedItemTopHatInteractions.displayName = 'FeedItemTopHatInteractions';

interface FeedItemTopHatPinnedProps {
  avatarDiameter?: number;
}

const FeedItemTopHatPinned: FC<FeedItemTopHatPinnedProps> = memo(
  ({ avatarDiameter }) => {
    const t = useTheme();

    return (
      <FeedItemTopHatContainer
        avatarDiameter={avatarDiameter}
        icon={<Octicons name="pin" size={13} style={[t.texts.tertiary]} />}
        text="Pinned"
      />
    );
  },
);

FeedItemTopHatPinned.displayName = 'FeedItemTopHatPinned';

// Matches Cast.tsx cast menu pressable width (t.w11).
const FEED_CAST_MENU_ACTIONS_WIDTH = 44;

interface FeedItemTopHatContainerProps {
  avatarDiameter?: number;
  icon: React.ReactNode;
  text?: string;
  children?: React.ReactNode;
  trailing?: React.ReactNode;
  reserveMenuActionSpace?: boolean;
}

const FeedItemTopHatContainer: FC<FeedItemTopHatContainerProps> = memo(
  ({
    avatarDiameter,
    icon,
    text,
    children,
    trailing,
    reserveMenuActionSpace = false,
  }) => {
    const t = useTheme();

    // container padding shrunk from 16 to 12 px, we want 8px of spacing
    const marginBottom = -6;
    const paddingTop = 12;
    const horizontalPadding = reserveMenuActionSpace
      ? { paddingLeft: 12, paddingRight: FEED_CAST_MENU_ACTIONS_WIDTH }
      : { paddingHorizontal: 12 };

    const textComp = useMemo(
      () =>
        text ? (
          <Text
            style={[
              t.flexShrink,
              t.texts.tertiary,
              { fontSize: 14, lineHeight: 18 },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {text}
          </Text>
        ) : (
          children
        ),
      [text, t.flexShrink, t.texts.tertiary, children],
    );

    return (
      <View
        style={[
          t.flex,
          t.flexRow,
          t.wFull,
          t.itemsCenter,
          t.justifyBetween,
          { paddingTop, marginBottom, ...horizontalPadding },
        ]}
      >
        <View style={[t.flex, t.flexRow, t.itemsCenter, t.flex1, t.flexShrink]}>
          <View
            style={[
              {
                width: avatarDiameter || defaultThumbnailDiameter,
                marginRight: 11,
                // manually adjust down icon to vertically align against all lowecase text
                marginTop: 3,
              },
              t.textRight,
              t.flexRow,
              t.justifyEnd,
              t.flex0,
            ]}
          >
            {icon}
          </View>
          {textComp}
        </View>
        {trailing}
      </View>
    );
  },
);

export { FeedItemTopHat, FeedItemTopHatContainer };
