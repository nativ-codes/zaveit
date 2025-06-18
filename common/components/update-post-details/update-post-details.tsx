import { ACTIVE_OPACITY } from "@/common/constants";
import { Colors } from "@/common/constants/colors";
import { Units } from "@/common/constants/units";
import { Row, Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import * as Burnt from "burnt";
import * as Clipboard from "expo-clipboard";
import React from "react";
import { Image, ScrollView, Text, TouchableOpacity } from "react-native";
import SkeletonLoader from "../skeleton-loader/skeleton-loader";
import TagItem from "../tag-item/tag-item";
import styles from "./update-post-details.style";
import { UpdatePostDetailsPropsType } from "./update-post-details.type";

function UpdatePostDetails({
  title,
  author,
  url,
  thumbnail,
  additionalTags,
  selectedAdditionalTags,
  mainTags,
  selectedMainTags,
  onMainTagPress,
  onAdditionalTagPress,
  isLoading
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

  const renderSkeletonTags = (count: number, isHorizontal: boolean = false) => {
    const skeletonTags = Array.from({ length: count }, (_, index) => (
      <SkeletonLoader
        key={`skeleton-${index}`}
        width={Units.s64 + Math.random() * Units.s40}
        height={Units.s32}
        borderRadius={Units.s16}
      />
    ));

    if (isHorizontal) {
      return (
        <ScrollView
          style={styles.mainTagsContainer}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <Spacer
            style={GeneralStyles.directionRow}
            direction="horizontal"
            size="s16"
            gap="s8"
          >
            {skeletonTags}
          </Spacer>
        </ScrollView>
      );
    }

    return (
      <Spacer gap="s8" style={styles.tagsContainer}>
        {skeletonTags}
      </Spacer>
    );
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
          <Text style={GeneralStyles.textTitleBody}>
            Select at least one main tag:
          </Text>
          {isLoading ? (
            renderSkeletonTags(3, true)
          ) : (
            <ScrollView
              style={styles.mainTagsContainer}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              <Spacer
                style={GeneralStyles.directionRow}
                direction="horizontal"
                size="s16"
                gap="s8"
              >
                {mainTags?.map((tag) => (
                  <TagItem
                    key={tag}
                    tag={tag}
                    isSelected={selectedMainTags?.includes(tag)}
                    onPress={() => onMainTagPress(tag)}
                  />
                ))}
              </Spacer>
            </ScrollView>
          )}
        </Spacer>

        <Spacer gap="s16" direction="top" size="s16">
          <Text style={GeneralStyles.textTitleBody}>Additional tags:</Text>
          {isLoading
            ? renderSkeletonTags(5)
            : additionalTags &&
              additionalTags.length > 0 && (
                <Spacer gap="s8" style={styles.tagsContainer}>
                  {additionalTags.map((tag) => (
                    <TagItem
                      key={tag}
                      tag={tag}
                      isSelected={selectedAdditionalTags?.includes(tag)}
                      onPress={() => onAdditionalTagPress(tag)}
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
