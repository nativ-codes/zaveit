import { Units } from "@/common/constants/units";
import { Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import React from "react";
import { ScrollView, Text } from "react-native";
import SkeletonLoader from "../skeleton-loader/skeleton-loader";
import TagItem from "../tag-item/tag-item";
import styles from "./update-post-details.style";
import { UpdatePostDetailsPropsType } from "./update-post-details.type";

// Add Post's Tag picking; the screen renders it under PostDetails.
function UpdatePostDetails({
  additionalTags,
  selectedAdditionalTags,
  mainTags,
  selectedMainTags,
  onMainTagPress,
  onAdditionalTagPress,
  isLoading
}: UpdatePostDetailsPropsType) {
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
    <>
      <Spacer gap="s16" direction="top" size="s16">
        <Text style={GeneralStyles.textLabelLargePrimary}>
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
        <Text style={GeneralStyles.textLabelLargePrimary}>
          Additional tags:
        </Text>
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
    </>
  );
}

export default UpdatePostDetails;
