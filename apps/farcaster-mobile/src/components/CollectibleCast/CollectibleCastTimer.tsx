import { Text2 } from 'farcaster-expo';
import React, { useEffect, useState } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface CollectibleTimerProps {
  end: number | undefined;
}

const AnimatedText2 = Animated.createAnimatedComponent(Text2);

function ActiveTimer({ end }: { end: number }) {
  const [timeRemaining, setTimeRemaining] = useState(end - Date.now());
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Fade in when component mounts
    opacity.value = withTiming(1, { duration: 300 });
  }, [opacity]);

  useEffect(() => {
    setTimeRemaining(end - Date.now());
  }, [end]);

  useEffect(() => {
    // Don't start timer if already expired or paused
    if (timeRemaining <= 0) {
      return;
    }

    const interval = setInterval(() => {
      const remaining = end - Date.now();
      setTimeRemaining(remaining);

      // Clear interval when timer expires
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [end, timeRemaining]);

  // Calculate time units
  const seconds = Math.floor(timeRemaining / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  // Format display based on remaining time
  let timeDisplay = '';
  if (timeRemaining <= 0) {
    timeDisplay = 'Ended';
  } else if (days > 0) {
    timeDisplay = `${days}d ${hours}h`;
  } else if (hours > 0) {
    timeDisplay = `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    timeDisplay = `${minutes}m ${secs}s`;
  } else {
    timeDisplay = `${secs}s`;
  }

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <AnimatedText2 size="xl" weight="medium" style={animatedStyle}>
      {timeDisplay}
    </AnimatedText2>
  );
}

export function CollectibleTimer({ end }: CollectibleTimerProps) {
  if (end === undefined) {
    return (
      <Text2 size="xl" weight="medium">
        -
      </Text2>
    );
  }

  return <ActiveTimer end={end} />;
}
