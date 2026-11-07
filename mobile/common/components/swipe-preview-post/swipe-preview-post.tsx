import { PreviewPost } from "@/common/components";
import { ACTIVE_OPACITY, Colors, Units } from "@/common/constants";
import { Haptics } from "@/common/utils/haptics";
import Icon from "@expo/vector-icons/Feather";
import React, { useCallback, useLayoutEffect, useRef } from "react";
import { TouchableOpacity, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { SwipeRow } from "react-native-swipe-list-view";
import styles from "./swipe-preview-post.style";
import { SwipePreviewPostPropsType } from "./swipe-preview-post.type";

const RIGHT_OFFSET = Units.s64 + Units.s16; // BUTTON WIDTH + MARGIN

function SwipePreviewPost({
  post,
  onPress,
  onRemove,
  onOpen,
}: SwipePreviewPostPropsType) {
  const swipeRef = useRef<SwipeRow<unknown>>(null);
  const swipeProgress = useSharedValue(0);
  const isAtRemovePoint = useRef(false);

  // FlashList reuses this row for another Post while scrolling; close it before paint so an open swipe doesn't carry over.
  useLayoutEffect(() => {
    swipeRef.current?.closeRowWithoutAnimation();
    swipeProgress.value = 0;
    isAtRemovePoint.current = false;
  }, [post.id, swipeProgress]);

  const close = useCallback(() => swipeRef.current?.closeRow(), []);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      swipeProgress.value,
      [0, -RIGHT_OFFSET],
      [0, 1],
      "clamp"
    );

    const translateX = interpolate(
      swipeProgress.value,
      [0, -RIGHT_OFFSET],
      [-5, 0],
      "clamp"
    );

    return {
      opacity,
      transform: [{ translateX }],
    };
  });

  const handleOnSwipeValueChange = (swipeData: { value: number }) => {
    swipeProgress.value = swipeData.value;

    const isOpen = swipeData.value <= -RIGHT_OFFSET;
    if (isOpen && !isAtRemovePoint.current) {
      Haptics.medium();
    }
    isAtRemovePoint.current = isOpen;
  };

  return (
    <SwipeRow
      ref={swipeRef}
      // The close above is a JS setValue, which doesn't reach a view whose last spring ran on the native driver.
      useNativeDriver={false}
      // Fills the row instead of keeping the height measured for the first Post this reused row showed.
      disableHiddenLayoutCalculation
      onRowOpen={() => onOpen?.(close)}
      rightOpenValue={-RIGHT_OFFSET}
      disableRightSwipe
      stopRightSwipe={-RIGHT_OFFSET}
      onSwipeValueChange={handleOnSwipeValueChange}
      // weird, i know, but this is a workaround to fix the type error
      {...({} as any)}
    >
      <View style={styles.container}>
        <Animated.View style={animatedStyle}>
          <TouchableOpacity
            activeOpacity={ACTIVE_OPACITY}
            style={styles.removeButton}
            onPress={onRemove}
          >
            <Icon name="trash" size={Units.s24} color={Colors.text.onPrimary} />
          </TouchableOpacity>
        </Animated.View>
      </View>
      <PreviewPost {...post} onPress={onPress} />
    </SwipeRow>
  );
}

export default SwipePreviewPost;
