import { Image } from 'expo-image';
import { useWindowDimensions } from 'react-native';
import Animated, {
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../../contexts';

type WalletHomeNuxBackgroundProps = {
  progress: SharedValue<number>;
};

export function WalletHomeNuxBackground({
  progress,
}: WalletHomeNuxBackgroundProps) {
  const { height: screenHeight } = useWindowDimensions();
  const { top } = useSafeAreaInsets();
  const t = useTheme();
  const backgroundAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(progress.value, [0, 1], [1, 0]),
    };
  }, [progress.value]);

  const height = screenHeight;

  return (
    <Animated.View
      style={[
        {
          width: '100%',
          height: height,
          position: 'absolute',
          top: -top,
          left: 0,
          zIndex: -1,
        },
        backgroundAnimatedStyle,
      ]}
    >
      <Image
        source={
          t.dark
            ? require('../../../assets/brand/BrandedArchGradient.png')
            : require('../../../assets/brand/BrandedArchGradientLight.png')
        }
        style={[
          {
            width: '100%',
            height: height * 0.3,
            position: 'absolute',
            top: top + 40,
            left: 0,
          },
        ]}
        contentFit="contain"
      />
      <Image
        source={require('../../../assets/brand/TexturedBackground.png')}
        style={{
          width: '100%',
          height: '100%',
          opacity: t.dark ? 1 : 0.1,
        }}
        contentFit="fill"
      />
    </Animated.View>
  );
}
