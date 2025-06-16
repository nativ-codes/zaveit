import Text from "@/common/components/text/text";
import { Row } from "@/common/layouts";
import Icon from "@expo/vector-icons/Feather";
import React, { memo } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { Colors } from "@/common/constants/colors";
import { ACTIVE_OPACITY } from "@/common/constants/ui";
import { Units } from "@/common/constants/units";
import { router } from "expo-router";
import styles from "./top-bar.style";
import { TopBarPropsType } from "./top-bar.type";

function TopBar({
  title,
  hasBackButton,
  left,
  right,
  testID,
}: TopBarPropsType) {
  const renderLeftComponent = () => {
    if (hasBackButton) {
      return (
        <TouchableOpacity
          activeOpacity={ACTIVE_OPACITY}
          onPress={router.back}
          hitSlop={Units.s16}
        >
          <Icon
            name="chevron-left"
            size={Units.s24}
            color={Colors.text.secondary}
          />
        </TouchableOpacity>
      );
    } else {
      return left;
    }
  };

  const renderCenterComponent = () => {
    if (title) {
      return (
        <Text variant="title-section" fontWeight="bold">
          {title}
        </Text>
      );
    } else {
      return <View />;
    }
  };

  return (
    <Row
      testID={`${testID}_TopBar`}
      style={styles.container}
      left={
        left || hasBackButton ? (
          <View style={StyleSheet.compose(styles.column, styles.left)}>
            {renderLeftComponent()}
          </View>
        ) : null
      }
      center={renderCenterComponent()}
      right={
        right ? (
          <View style={StyleSheet.compose(styles.column, styles.right)}>
            {right}
          </View>
        ) : null
      }
    />
  );
}

export default memo(TopBar);
