import { FlashListRef } from '@shopify/flash-list';
import { ApiLocation } from 'farcaster-client-data';
import React, { FC, memo, useEffect, useMemo, useRef } from 'react';
import { Image, Platform, View } from 'react-native';

import { Empty } from '~/components/Empty';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { useScrollToTop } from '~/hooks/useScrollToTop';
import { trackError } from '~/utils/ErrorUtils';

import { LocationPrediction } from './LocationPrediction';

type Props = {
  q: string;
  predictions: ApiLocation[];
  onPressPrediction: (prediction: ApiLocation) => void;
};

const LocationPredictionList: FC<Props> = memo(
  ({ q, onPressPrediction, predictions }) => {
    const t = useTheme();

    const flatListRef = useRef<FlashListRef<ApiLocation>>(null);

    useScrollToTop(flatListRef);

    const footer = useMemo(
      () => (
        <View
          style={[t.flex, t.flexRow, t.justifyEnd, t.itemsCenter, t.pY1, t.pR2]}
        >
          <Text style={[t.textXs, t.texts.secondary, { height: 18 }]}>
            {'via '}
          </Text>
          <Image
            source={
              Platform.OS === 'ios'
                ? t.dark
                  ? require('~/assets/images/google/google_on_non_white_ios.png')
                  : require('~/assets/images/google/google_on_white_ios.png')
                : t.dark
                  ? require('~/assets/images/google/google_on_non_white_android.png')
                  : require('~/assets/images/google/google_on_white_android.png')
            }
            style={{ width: 60, height: 18 }}
            resizeMode="cover"
          />
        </View>
      ),
      [t],
    );

    useEffect(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToOffset({ offset: 0, animated: false });
      }
    }, []);

    const prepared = useMemo(() => {
      if (!predictions.length) {
        return [];
      }

      const truncated = predictions.slice(0, 5);
      if (predictions.length !== truncated.length) {
        trackError(
          `Expected no more than 5 location predictions for query: ${q}`,
        );
      }
      const filtered = truncated.filter(
        (prediction) => !!prediction.placeId && !!prediction.description,
      );
      if (filtered.length !== truncated.length) {
        trackError(`Expected no empty predictions for query: ${q}`);
      }
      return filtered;
    }, [predictions, q]);

    if (!prepared.length) {
      return (
        <View style={[t.flexGrow, t.pY2]}>
          <Empty message={'No locations match your query.'} />
        </View>
      );
    }

    // NOTE: We render these predictions "manually" rather than using a FlatList or
    // or FlashList, so that this component can be rendered inside a ScrollView;
    // FlatList does not play well inside ScrollView (we observed jitter in the
    // animation of the appearance of the list). This is fine in terms of performance
    // because we expect, and ensure, that we're not rendering more than 5 items.
    return (
      <View style={[t.z100]}>
        {prepared.map((prediction) => (
          <LocationPrediction
            key={prediction.placeId}
            prediction={prediction}
            onPressPrediction={onPressPrediction}
          />
        ))}
        {footer}
      </View>
    );
  },
);

LocationPredictionList.displayName = 'LocationPredictionList';

export { LocationPredictionList };
