import {
  HorizontalScrollViewPosts,
  PreviewPostCard,
  TopBar
} from "@/common/components";
import { Colors } from "@/common/constants/colors";
import { SafeAreaEdges } from "@/common/constants/safe-area";
import { Units } from "@/common/constants/units";
import { useAuth } from "@/config/contexts/auth.context";
import { getPosts } from "@/config/storage/persistent";
import { useSyncLists } from "@/config/use-sync-lists";
import { signOut } from "@/services/google-auth.service";
import { StoredPost } from "@/types";
import { useRouter } from "expo-router";
import { useShareIntentContext } from "expo-share-intent";
import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ViewPostsTypeEnum } from "../view-posts/view-posts.type";

export default function HomeScreen() {
  const { hasShareIntent } = useShareIntentContext();
  const router = useRouter();
  const [posts, setPosts] = useState<StoredPost[]>([]);
  const { user, isLoading, isAuthenticated } = useAuth();
  const { syncLists } = useSyncLists();

  useEffect(() => {
    if (hasShareIntent) {
      router.replace("/share-intent");
    }
  }, [hasShareIntent]);

  useEffect(() => {
    if (user) {
      syncLists();
    }
  }, [user]);

  useEffect(() => {
    const storedPosts = getPosts();
    setPosts(storedPosts);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const randomPost = useMemo(() => {
    if (posts.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * posts.length);
    return posts[randomIndex];
  }, [posts]);

  if (!isAuthenticated) {
    return (
      <SafeAreaView edges={SafeAreaEdges.noBottom} style={styles.container}>
        <View style={styles.loginContainer}>
          <Text style={styles.loginTitle}>
            Sign in to view your saved content
          </Text>
          <Text style={styles.loginSubtitle}>
            Your saved content will be synced across devices
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.loginButtonText}>Sign in with Google</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={SafeAreaEdges.noBottom} style={styles.container}>
      <TopBar left={<Text>ZaveIt</Text>} right={<Text>Add Post</Text>} />
      <View style={styles.backgroundOverlay} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.tilesContainer}>
          <HorizontalScrollViewPosts
            Element={PreviewPostCard}
            title="Recently Added"
            posts={posts}
            onPostPress={(postId) =>
              router.push({
                pathname: "/share-intent/[id]",
                params: { id: postId },
              })
            }
            onViewAll={() => {
              router.push({
                pathname: "/view-posts",
                params: { type: ViewPostsTypeEnum.RECENTLY_ADDED },
              });
            }}
          />

          <HorizontalScrollViewPosts
            Element={PreviewPostCard}
            title="Frequently Accessed"
            posts={posts}
            onPostPress={(postId) =>
              router.push({
                pathname: "/share-intent/[id]",
                params: { id: postId },
              })
            }
            onViewAll={() => {
              router.push({
                pathname: "/view-posts",
                params: { type: ViewPostsTypeEnum.FREQUENTLY_ACCESSED },
              });
            }}
          />

          {randomPost && (
            <View style={styles.randomPickContainer}>
              <Text style={styles.sectionTitle}>Random Pick</Text>
              <PreviewPostCard
                url={randomPost.url}
                title={randomPost.title}
                thumbnail={randomPost.thumbnail}
                tags={randomPost.tags}
                onPress={() =>
                  router.push({
                    pathname: "/share-intent/[id]",
                    params: { id: randomPost.id },
                  })
                }
              />
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.logoutListButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutListButtonText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: 300,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  loginContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 24,
    textAlign: "center",
  },
  loginSubtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
    marginBottom: 32,
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  logoutButton: {
    marginRight: 16,
    padding: 8,
  },
  logoutListButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutListButtonText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  mainContent: {
    flex: 1,
  },
  tilesContainer: {
    gap: Units.s16,
  },
  tilesScrollContent: {
    paddingHorizontal: Units.s16,
    gap: Units.s16,
  },
  tileWrapper: {
    marginRight: Units.s16,
  },
  randomPickContainer: {
    paddingHorizontal: Units.s16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: Units.s8,
  },
});

export const options = {
  headerShown: false,
};
