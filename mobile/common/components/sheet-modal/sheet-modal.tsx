import {
  ACTIVE_OPACITY_NO_FEEDBACK,
  STICKY_VIEW_OFFSET,
  Units,
} from "@/common/constants";
import { Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import { noop } from "@/common/utils";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
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
      {/* accessible={false}: otherwise these merge the sheet's contents into one element for screen readers. */}
      <TouchableOpacity
        accessible={false}
        style={styles.overlay}
        activeOpacity={ACTIVE_OPACITY_NO_FEEDBACK}
        onPress={onRequestClose}
      >
        {/* Swallows taps on the sheet so only the backdrop closes it. */}
        <TouchableOpacity
          accessible={false}
          activeOpacity={ACTIVE_OPACITY_NO_FEEDBACK}
          onPress={noop}
        >
          <KeyboardStickyView offset={STICKY_VIEW_OFFSET}>
            <Spacer
              gap="s24"
              size="s24"
              direction="full"
              style={StyleSheet.compose(styles.container, {
                marginBottom: insets.bottom || Units.s16,
              })}
            >
              <Spacer gap="s8">
                <Text style={GeneralStyles.textTitlePostMediumPrimary}>
                  {title}
                </Text>
                <Text style={GeneralStyles.textLabelLargeSecondary}>
                  {body}
                </Text>
              </Spacer>
              {children}
              {buttons && <View style={styles.buttonContainer}>{buttons}</View>}
            </Spacer>
          </KeyboardStickyView>
        </TouchableOpacity>
      </TouchableOpacity>
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
