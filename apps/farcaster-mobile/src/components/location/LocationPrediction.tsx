import { ApiLocation } from 'farcaster-client-data';
import React, { FC, memo, useCallback } from 'react';
import { Pressable } from 'react-native';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

type Props = {
  prediction: ApiLocation;
  onPressPrediction: (prediction: ApiLocation) => void;
};

const LocationPrediction: FC<Props> = memo(
  ({ prediction, onPressPrediction }) => {
    const t = useTheme();

    const onPress = useCallback(() => {
      onPressPrediction(prediction);
    }, [onPressPrediction, prediction]);

    return (
      <Pressable
        style={[
          t.flexRow,
          t.itemsCenter,
          t.justifyBetween,
          t.pX4,
          t.pY3,
          t.borderDefault,
          t.borderBHairline,
        ]}
        onPress={onPress}
      >
        <Text style={[t.texts.primary, t.textBase]}>
          {prediction.description}
        </Text>
      </Pressable>
    );
  },
);

LocationPrediction.displayName = 'LocationPrediction';

export { LocationPrediction };
