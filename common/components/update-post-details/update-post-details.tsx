import { ACTIVE_OPACITY } from "@/common/constants";
import { Colors } from "@/common/constants/colors";
import { Row, Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import * as Burnt from "burnt";
import * as Clipboard from "expo-clipboard";
import React from "react";
import { Image, Text, TouchableOpacity } from "react-native";
import TagItem from "../tag-item/tag-item";
import styles from "./update-post-details.style";
import { UpdatePostDetailsPropsType } from "./update-post-details.type";

function UpdatePostDetails({
  title,
  author,
  url,
  thumbnail,
  availableTags,
  selectedTags,
  onTagPress,
}: UpdatePostDetailsPropsType) {
  const handleOnCopyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(url);

      Burnt.toast({
        title: "Copied to clipboard.",
        preset: "done",
        duration: 2,
        haptic: "success",
      });
    } catch (error) {
      console.error("Error copying to clipboard:", error);
    }
  };

  return (
    <Spacer gap="s16">
      {thumbnail && (
        <Image
          source={{ uri: thumbnail }}
          style={styles.image}
          resizeMode="cover"
        />
      )}
      <Spacer direction="horizontal" size="s16" gap="s16">
        <Spacer gap="s8">
          {title && <Text style={GeneralStyles.textTitleSection}>{title}</Text>}
          {author && (
            <Text style={GeneralStyles.textBodyMediumSecondary}>
              Author: {author}
            </Text>
          )}
        </Spacer>
        <TouchableOpacity
          activeOpacity={ACTIVE_OPACITY}
          onPress={handleOnCopyToClipboard}
        >
          <Row
            center={<Text style={GeneralStyles.textLink}>{url}</Text>}
            right={
              <Icon name="content-copy" size={24} color={Colors.primary} />
            }
          />
        </TouchableOpacity>

        <Spacer gap="s16" direction="top" size="s16">
          <Text style={GeneralStyles.textTitleBody}>Select at least one main tag:</Text>
          {availableTags && availableTags.length > 0 && (
            <Spacer gap="s8" style={styles.tagsContainer}>
              {availableTags.map((tag) => (
                <TagItem
                  key={tag}
                  tag={tag}
                  isSelected={selectedTags?.includes(tag)}
                  onPress={() => onTagPress(tag)}
                />
              ))}
            </Spacer>
          )}
        </Spacer>
      </Spacer>
    </Spacer>
  );
}

export default UpdatePostDetails;
