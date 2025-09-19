import { PreviewPost } from "@/common/components";
import { ACTIVE_OPACITY, Colors, Units } from "@/common/constants";
import Icon from "@expo/vector-icons/Feather";
import React from "react";
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
}: SwipePreviewPostPropsType) {
  const swipeProgress = useSharedValue(0);

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
  };

  return (
    <SwipeRow
      rightOpenValue={-RIGHT_OFFSET}
      disableRightSwipe
      stopRightSwipe={-RIGHT_OFFSET}
      onSwipeValueChange={handleOnSwipeValueChange}
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
