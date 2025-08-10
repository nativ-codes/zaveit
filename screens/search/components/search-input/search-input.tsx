import { Button } from "@/common/components";
import { Colors } from "@/common/constants/colors";
import { Spacer } from "@/common/layouts";
import React from "react";
import { TextInput, View } from "react-native";
import styles from "./search-input.style";
import { SearchInputPropsType } from "./search-input.type";

function SearchInput({
  value,
  onChangeText,
  onClear,
  placeholder = "Search your saved content...",
}: SearchInputPropsType) {
  return (
    <Spacer direction="horizontal" size="s16">
      <View>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={value}
          placeholderTextColor={Colors.text.placeholder}
          onChangeText={onChangeText}
        />
        {Boolean(value.length) && (
          <View style={styles.clearButton}>
            <Button.Icon iconName="x" onPress={onClear} />
          </View>
        )}
      </View>
    </Spacer>
  );
}

export default SearchInput;


