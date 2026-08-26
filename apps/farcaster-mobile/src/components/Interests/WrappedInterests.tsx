import { ApiInterest } from 'farcaster-client-data';
import React from 'react';
import { View } from 'react-native';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

import { Interest } from './Interest';

type WrappedInterestsProps = {
  interests: ApiInterest[];
  categoryIndex: number;
};

const WrappedInterests: React.FC<WrappedInterestsProps> = ({
  interests,
  categoryIndex,
}) => {
  const t = useTheme();

  const category = React.useMemo(() => {
    const interest = interests[0];

    switch (interest.type) {
      case 'wrapped':
        return interest.content.group.category;
      case 'channel':
      case 'collection':
      default:
        return undefined;
    }
  }, [interests]);

  return (
    <View>
      {typeof category !== 'undefined' && (
        <View
          style={[
            t.flex,
            t.flexRow,
            t.itemsCenter,
            t.mB3,
            categoryIndex > 0 && t.mT1,
          ]}
        >
          <Text style={[t.texts.secondary, t.textBase, t.fontSemibold]}>
            {category.name}
          </Text>
        </View>
      )}
      <View style={[t.flex, t.flexRow, t.flexWrap]}>
        {interests.map((interest, index) => (
          <View style={[t.flex, t.flexRow, t.mR3, t.mB3]} key={index}>
            <Interest interest={interest} />
          </View>
        ))}
      </View>
    </View>
  );
};

WrappedInterests.displayName = 'WrappedInterests';

export { WrappedInterests };
