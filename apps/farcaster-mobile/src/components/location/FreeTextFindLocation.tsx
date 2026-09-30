import { ApiLocation } from 'farcaster-client-data';
import { useFindLocation } from 'farcaster-client-hooks';
import React, { FC, memo, Suspense, useEffect, useRef } from 'react';
import { useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { useTheme } from '~/contexts/ThemeProvider';

import { LocationPredictionList } from './LocationPredictionList';

type FreeTextFindLocationProps = {
  q: string;
  isVisible: boolean;
  onPressPrediction: (prediction: ApiLocation) => void;
};

const FreeTextFindLocation: FC<FreeTextFindLocationProps> = ({
  q,
  isVisible,
  onPressPrediction,
}) => {
  const t = useTheme();

  const lastIsVisibleRef = useRef(isVisible);

  const { height: windowHeight } = useWindowDimensions();
  const height = useSharedValue(windowHeight);

  useEffect(() => {
    if (isVisible !== lastIsVisibleRef.current) {
      height.value = withTiming(isVisible ? windowHeight : 0, {
        duration: 200,
      });

      lastIsVisibleRef.current = isVisible;
    }
  }, [isVisible, height, windowHeight]);

  const animatedStyle = useAnimatedStyle(() => ({ height: height.value }));

  return (
    <Animated.View
      style={[
        t.bgDefault,
        t.roundedTLg,
        animatedStyle,
        {
          display: isVisible ? null : 'none',
          marginHorizontal: -15,
          marginBottom: -15,
        },
      ]}
    >
      <Suspense
        fallback={
          <FullScreenLoadingIndicator debugName="FreeTextFindLocation" />
        }
      >
        <FreeTextFindLocationContent
          q={q}
          onPressPrediction={onPressPrediction}
        />
      </Suspense>
    </Animated.View>
  );
};

FreeTextFindLocation.displayName = 'FreeTextFindLocation';

type FreeTextFindLocationContentProps = {
  q: string;
  onPressPrediction: (prediction: ApiLocation) => void;
};

const FreeTextFindLocationContent: FC<FreeTextFindLocationContentProps> = memo(
  ({ q, onPressPrediction }) => {
    const t = useTheme();
    const predictions = useFindLocation({ q }).data?.result.predictions;

    if (!predictions) {
      return !q ? (
        <></>
      ) : (
        <FullScreenLoadingIndicator
          debugName="FreeTextFindLocationContent"
          justify="start"
          style={[t.pY2]}
        />
      );
    }

    return (
      <LocationPredictionList
        q={q}
        predictions={predictions}
        onPressPrediction={onPressPrediction}
      />
    );
  },
);

FreeTextFindLocationContent.displayName = 'FreeTextFindLocationContent';

export { FreeTextFindLocation };
