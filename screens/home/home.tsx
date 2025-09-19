import { AddPostModal, EmptyPlaceholder, TopBar } from "@/common/components";
import { ACTIVE_OPACITY } from "@/common/constants/ui";
import { Units } from "@/common/constants/units";
import { ScreenLayout, Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import { useHasPosts } from "@/config/storage";
import { router } from "expo-router";
import React, { useState } from "react";
import { Text, TouchableOpacity } from "react-native";
import FrequentlyAccessedSection from "./components/frequently-accessed-section/frequently-accessed-section";
import RandomPickSection from "./components/random-pick-section/random-pick-section";
import RecentlyAddedSection from "./components/recently-added-section/recently-added-section";

function HomeScreen() {
  const hasPosts = useHasPosts();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleOnPostPress = (postId: string) => {
    router.push({
      pathname: "/post-details/[id]",
      params: { id: postId },
    });
  };

  const handleOnAddPost = () => {
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  const handleSubmitPost = (url: string) =>
    router.push({
      pathname: "/share-intent",
      params: { url },
    });

  return (
    <ScreenLayout>
      <Spacer direction="bottom" size="s8">
        <TopBar
          left={<Text style={GeneralStyles.textTitleScreenPrimary}>Home</Text>}
          right={
            <TouchableOpacity
              activeOpacity={ACTIVE_OPACITY}
              hitSlop={Units.s16}
              onPress={handleOnAddPost}
            >
              <Text style={GeneralStyles.textLink}>Add post</Text>
            </TouchableOpacity>
          }
        />
      </Spacer>

      <Spacer gap="s16">
        {hasPosts ? (
          <>
            <RecentlyAddedSection onPostPress={handleOnPostPress} />
            <FrequentlyAccessedSection onPostPress={handleOnPostPress} />
            <RandomPickSection onPostPress={handleOnPostPress} />
          </>
        ) : (
          <EmptyPlaceholder
            message="You haven't zaved any posts yet."
            instruction="Tap Share → Choose ZaveIt"
          />
        )}
      </Spacer>

      <AddPostModal
        isVisible={isModalVisible}
        onClose={handleCloseModal}
        onSubmit={handleSubmitPost}
      />
    </ScreenLayout>
  );
}

export default HomeScreen;
