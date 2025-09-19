import { Button } from "@/common/components";
import { Colors } from "@/common/constants/colors";
import React from "react";
import { TextInput, View } from "react-native";
import styles from "./search-input.style";
import { SearchInputPropsType } from "./search-input.type";

function SearchInput({
  value,
  onChangeText,
  placeholder = "Search your saved content...",
  isActionVisible,
  actionIcon = "x",
  onAction,
}: SearchInputPropsType) {
  return (
    <View>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        placeholderTextColor={Colors.text.placeholder}
        onChangeText={onChangeText}
      />
      {isActionVisible && (
        <View style={styles.clearButton}>
          <Button.Icon iconName={actionIcon} onPress={onAction} />
        </View>
      )}
    </View>
  );
}

export default SearchInput;
