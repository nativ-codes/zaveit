import { Button } from "@/common/components";
import { Colors, Units } from "@/common/constants";
import { Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import React, { useState } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STEPS = [
  {
    title: "ZaveIt now needs an account",
    body: "Signing in keeps your List safe and puts it on all your devices.",
  },
  {
    title: "Your posts are still here",
    body: "Everything you saved is on this phone and will be uploaded to your account when you sign in.",
  },
];

type WhatChangedModalPropsType = {
  isVisible: boolean;
  onClose: () => void;
};

function WhatChangedModal({ isVisible, onClose }: WhatChangedModalPropsType) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);

  const isLastStep = step === STEPS.length - 1;

  const handleOnPress = () => {
    if (isLastStep) {
      onClose();
    } else {
      setStep(step + 1);
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
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
            <Text style={GeneralStyles.textTitlePostMediumPrimary}>
              {STEPS[step].title}
            </Text>
            <Text style={GeneralStyles.textLabelLargeSecondary}>
              {STEPS[step].body}
            </Text>
          </Spacer>

          <View
            style={styles.dots}
            accessible
            accessibilityLabel={`Step ${step + 1} of ${STEPS.length}`}
          >
            {STEPS.map(({ title }, index) => (
              <View
                key={title}
                style={[styles.dot, index === step && styles.dotActive]}
              />
            ))}
          </View>

          <View style={styles.buttonContainer}>
            {step > 0 && (
              // Fixed width: Button flexes, so on its own it would take half the row.
              <View style={styles.backButton}>
                <Button
                  label="Back"
                  type="ghost"
                  onPress={() => setStep(step - 1)}
                />
              </View>
            )}
            <Button
              label={isLastStep ? "Got it" : "Next"}
              type="primary"
              onPress={handleOnPress}
            />
          </View>
        </Spacer>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: Colors.background.primary,
    borderRadius: Units.s24,
    marginHorizontal: Units.s16,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Units.s8,
  },
  dot: {
    width: Units.s8,
    height: Units.s8,
    borderRadius: Units.s8,
    backgroundColor: Colors.primaryLight,
  },
  dotActive: {
    width: Units.s24,
    backgroundColor: Colors.primary,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: Units.s8,
    height: Units.s64,
  },
  backButton: {
    width: Units.s88,
  },
});

export default WhatChangedModal;
