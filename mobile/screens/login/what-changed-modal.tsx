import { Button, SheetModal } from "@/common/components";
import { Colors, Units } from "@/common/constants";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";

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
    <SheetModal
      isVisible={isVisible}
      onRequestClose={onClose}
      title={STEPS[step].title}
      body={STEPS[step].body}
      buttons={
        <>
          {step > 0 && (
            <SheetModal.SecondaryButtonWrapper>
              <Button
                label="Back"
                type="ghost"
                onPress={() => setStep(step - 1)}
              />
            </SheetModal.SecondaryButtonWrapper>
          )}
          <Button
            label={isLastStep ? "Got it" : "Next"}
            type="primary"
            onPress={handleOnPress}
          />
        </>
      }
    >
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
    </SheetModal>
  );
}

const styles = StyleSheet.create({
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
});

export default WhatChangedModal;
