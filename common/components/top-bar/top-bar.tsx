import { useNavigation } from "@react-navigation/native";
import React, { memo } from "react";
import { View, StyleSheet } from "react-native";

import Button from "@/common/components/button/button";
import Text from "@/common/components/text/text";
import { Row } from "@/common/layouts";

import styles from "./top-bar.style";
import { TopBarPropsType } from "./top-bar.type";

function TopBar({
  title,
  hasBackButton,
  left,
  right,
  testID,
}: TopBarPropsType) {
  const navigation = useNavigation();

  const renderLeftComponent = () => {
    if (hasBackButton) {
      return (
        <Button.Icon
          size="medium"
          iconName="caret-left"
          onPress={navigation.goBack}
          testID={`${testID}_TopBar_BackButton`}
        />
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
