import { Units } from "@/common/constants";
import { Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import React from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import styles from "./sheet-modal.style";
import { SheetModalPropsType } from "./sheet-modal.type";

function SheetModal({
  isVisible,
  onRequestClose,
  title,
  body,
  buttons,
  children,
}: SheetModalPropsType) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <View style={styles.overlay}>
        <Spacer
          gap="s24"
          size="s24"
          direction="full"
          style={StyleSheet.compose(styles.container, {
            marginBottom: insets.bottom || Units.s16,
          })}
        >
          <Spacer gap="s8">
            <Text style={GeneralStyles.textTitlePostMediumPrimary}>{title}</Text>
            <Text style={GeneralStyles.textLabelLargeSecondary}>{body}</Text>
          </Spacer>
          {children}
          <View style={styles.buttonContainer}>{buttons}</View>
        </Spacer>
      </View>
    </Modal>
  );
}

SheetModal.SecondaryButtonWrapper = function SecondaryButtonWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <View style={styles.secondaryButton}>{children}</View>;
};

export default SheetModal;
