import { Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import React from "react";
import { Text } from "react-native";
import styles from "./empty-placeholder.style";
import { EmptyPlaceholderType } from "./empty-placeholder.type";

function EmptyPlaceholder({ message, instruction }: EmptyPlaceholderType) {
  return (
    <Spacer gap="s8" style={styles.container}>
      <Text style={GeneralStyles.textLabelLargeSecondary}>{message}</Text>
      <Text style={GeneralStyles.textLabelLargeSecondary}>{instruction}</Text>
    </Spacer>
  );
}

export default EmptyPlaceholder; 