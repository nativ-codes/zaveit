import React, { useEffect } from "react";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";
import styles from "./skeleton-loader.style";
import { SkeletonLoaderPropsType } from "./skeleton-loader.type";

function SkeletonLoader({
  width,
  height,
  borderRadius = 0,
}: SkeletonLoaderPropsType) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0.6, {
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1, // Infinite repeat
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
        },
        animatedStyle,
      ]}
    />
  );
}

export default SkeletonLoader; 