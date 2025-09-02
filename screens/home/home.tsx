import { EmptyPlaceholder, TopBar } from "@/common/components";
import { ScreenLayout, Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import { useHasPosts } from "@/config/storage";
import { router } from "expo-router";
import React from "react";
import { Text } from "react-native";
import FrequentlyAccessedSection from "./components/frequently-accessed-section/frequently-accessed-section";
import RandomPickSection from "./components/random-pick-section/random-pick-section";
import RecentlyAddedSection from "./components/recently-added-section/recently-added-section";

function HomeScreen() {
  const hasPosts = useHasPosts();

  const handleOnPostPress = (postId: string) => {
    router.push({
      pathname: "/post-details/[id]",
      params: { id: postId },
    });
  };

  return (
    <ScreenLayout>
      <Spacer direction="bottom" size="s8">
        <TopBar
          left={<Text style={GeneralStyles.textTitleScreenPrimary}>Home</Text>}
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
    </ScreenLayout>
  );
}

export default HomeScreen;
