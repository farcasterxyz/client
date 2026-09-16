import { ApiUser } from 'farcaster-client-data';
import React from 'react';
import {
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { FarcasterProBadge } from '~/components/FarcasterPro/FarcasterProBadge';
import { Text } from '~/components/Text';
import { useUserLevel } from '~/hooks/data/useUserLevel';

type SpaceUserDisplayNameWithProBadgeProps = {
  user?: ApiUser;
  name?: string;
  fallbackName?: string;
  containerStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  suffix?: string;
  suffixTextStyle?: StyleProp<TextStyle>;
  badgeSize?: number;
  numberOfLines?: number;
};

const SpaceUserDisplayNameWithProBadge: React.FC<
  SpaceUserDisplayNameWithProBadgeProps
> = ({
  user,
  name,
  fallbackName,
  containerStyle,
  textStyle,
  suffix,
  suffixTextStyle,
  badgeSize = 14,
  numberOfLines = 1,
}) => {
  const isProUser = useUserLevel(user) === 'pro';
  const displayName = name ?? user?.displayName ?? fallbackName;

  if (!displayName) {
    return null;
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <Text numberOfLines={numberOfLines} style={[styles.name, textStyle]}>
        {displayName}
      </Text>
      {isProUser && (
        <FarcasterProBadge
          size={badgeSize}
          style={styles.badge}
          showBorder={false}
        />
      )}
      {suffix ? (
        <Text numberOfLines={1} style={[styles.suffix, suffixTextStyle]}>
          {suffix}
        </Text>
      ) : null}
    </View>
  );
};

SpaceUserDisplayNameWithProBadge.displayName =
  'SpaceUserDisplayNameWithProBadge';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  name: {
    flexShrink: 1,
  },
  suffix: {
    flexShrink: 1,
  },
  badge: {
    marginLeft: 3,
  },
});

export { SpaceUserDisplayNameWithProBadge };
