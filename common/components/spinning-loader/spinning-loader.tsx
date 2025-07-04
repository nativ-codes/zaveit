import { Colors } from "@/common/constants/colors";
import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";
import { createSpinningLoaderStyles } from "./spinning-loader.style";
import {
    SpinningLoaderPropsType,
    SpinningLoaderSizeEnum
} from "./spinning-loader.type";

function SpinningLoader({
  size = SpinningLoaderSizeEnum.medium,
  color = Colors.primary,
}: SpinningLoaderPropsType) {
  const rotation = useSharedValue(0);
  const styles = createSpinningLoaderStyles(size, color);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.circle, animatedStyle]} />
    </View>
  );
}

export default SpinningLoader;
