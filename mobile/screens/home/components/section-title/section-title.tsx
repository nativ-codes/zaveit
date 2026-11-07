import { Colors, Units } from "@/common/constants";
import { GeneralStyles } from "@/common/styles";
import Icon from "@expo/vector-icons/Feather";
import React from "react";
import { Text, View } from "react-native";
import styles from "./section-title.style";
import { SectionTitlePropsType } from "./section-title.type";

function SectionTitle({ title, icon }: SectionTitlePropsType) {
  return (
    <View style={styles.container} accessibilityRole="header">
      <Icon name={icon} size={Units.s16} color={Colors.primary} />
      <Text style={GeneralStyles.textTitleSectionPrimary}>{title}</Text>
    </View>
  );
}

export default SectionTitle;
