import { ACTIVE_OPACITY, Colors, Units } from "@/common/constants";
import { Row, Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import Icon from "@expo/vector-icons/Feather";
import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { MenuItemPropsType } from "./menu-item.type";

function MenuItem({ onPress, label, right }: MenuItemPropsType) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={ACTIVE_OPACITY}>
      <Spacer direction="full" size="s8">
        <Row
          center={
            <Text style={GeneralStyles.textLabelLargePrimary}>{label}</Text>
          }
          right={
            right ? (
              right
            ) : (
              <Icon
                name="chevron-right"
                size={Units.s24}
                color={Colors.text.secondary}
              />
            )
          }
        />
      </Spacer>
    </TouchableOpacity>
  );
}

export default MenuItem;
