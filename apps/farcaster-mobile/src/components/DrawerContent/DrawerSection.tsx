import { Octicons } from '@expo/vector-icons';
import React, { FC, memo, useCallback } from 'react';
import { TouchableOpacity, View } from 'react-native';

import {
  DrawerFeedItem,
  ExtendedFeedRoute,
} from '~/components/DrawerContent/DrawerItem';
import { useDrawerTouchablePress } from '~/components/DrawerContent/drawerPressHandlers';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

interface DrawerSectionProps {
  sectionHeading?: string;
  expanded?: boolean;
  onSetExpanded?: (expanded: boolean) => void;
  children?: React.ReactNode;
}

const DrawerSection: FC<DrawerSectionProps> = memo(
  ({ sectionHeading, expanded: expandedMaybe, onSetExpanded, children }) => {
    const expanded = !(expandedMaybe === false);

    return (
      <>
        <DrawerSectionHeader
          sectionHeading={sectionHeading}
          expanded={expanded}
          onSetExpanded={onSetExpanded}
        />
        {expanded && children}
      </>
    );
  },
);

DrawerSection.displayName = 'DrawerSection';

interface DrawerSectionHeaderProps {
  sectionHeading?: string;
  expanded?: boolean;
  onSetExpanded?: (expanded: boolean) => void;
}

const DrawerSectionHeader: FC<DrawerSectionHeaderProps> = memo(
  ({ sectionHeading, expanded, onSetExpanded }) => {
    const t = useTheme();

    const onToggleExpanded = useCallback(() => {
      onSetExpanded?.(!expanded);
    }, [expanded, onSetExpanded]);

    const expandPressProps = useDrawerTouchablePress(onToggleExpanded);

    if (!sectionHeading) {
      return null;
    }

    const comp = (
      <Text style={[t.pL4, t.texts.tertiary, t.textSm]}>{sectionHeading}</Text>
    );

    if (onSetExpanded) {
      return (
        <TouchableOpacity activeOpacity={0.5} {...expandPressProps}>
          <View
            style={[
              t.flexRow,
              t.justifyBetween,
              t.itemsCenter,
              t.pT3,
              t.pB1,
              t.pR5,
            ]}
          >
            {comp}
            <Octicons
              style={[expanded === false ? undefined : { marginTop: 2 }]}
              name={expanded === false ? 'chevron-down' : 'chevron-up'}
              size={12}
              color={t.colors.text.tertiary}
            />
          </View>
        </TouchableOpacity>
      );
    } else {
      return <View style={[t.pB1]}>{comp}</View>;
    }
  },
);

interface DrawerFeedsSectionProps {
  feeds: ExtendedFeedRoute[];
  onFavoriteFeed: (feedKey: string) => void;
  onUnfavoriteFeed: (feedKey: string, pinnedPisition: number) => void;
}

const DrawerFeedsSection: FC<DrawerFeedsSectionProps> = memo(
  ({ feeds, onFavoriteFeed, onUnfavoriteFeed }) => {
    return (
      <>
        {feeds.map((feed) => (
          <DrawerFeedItem
            key={feed.key}
            feed={feed}
            onFavoriteFeed={onFavoriteFeed}
            onUnfavoriteFeed={onUnfavoriteFeed}
          />
        ))}
      </>
    );
  },
);

DrawerFeedsSection.displayName = 'DrawerFeedsSection';

export { DrawerFeedsSection, DrawerSection, DrawerSectionHeader };
