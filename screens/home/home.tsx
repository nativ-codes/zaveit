import {
  TopBar
} from "@/common/components";
import { ScreenLayout, Spacer } from "@/common/layouts";
import { GeneralStyles } from "@/common/styles";
import { useSyncLists } from "@/config/use-sync-lists";
import { router, useRouter } from "expo-router";
import { useShareIntentContext } from "expo-share-intent";
import React, { useEffect } from "react";
import { Text } from "react-native";
import FrequentlyAccessedSection from "./components/frequently-accessed-section/frequently-accessed-section";
import RandomPickSection from "./components/random-pick-section/random-pick-section";
import RecentlyAddedSection from "./components/recently-added-section/recently-added-section";

const useShareIntent = () => {
  const router = useRouter();
  const { hasShareIntent } = useShareIntentContext();

  useEffect(() => {
    if (hasShareIntent) {
      router.navigate("/share-intent");
    }
  }, [hasShareIntent, router]);
};


function HomeScreen() {
  useShareIntent();
  const { syncLists } = useSyncLists();

  useEffect(() => {
    syncLists();
  }, []);

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
        <RecentlyAddedSection onPostPress={handleOnPostPress} />
        <FrequentlyAccessedSection onPostPress={handleOnPostPress} />
        <RandomPickSection onPostPress={handleOnPostPress} />
      </Spacer>
    </ScreenLayout>
  );
}

export default HomeScreen;
