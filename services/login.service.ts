import { forceHttps } from "@/common/utils/formatters";
import { saveImageFromUrl } from "@/common/utils/files";
import { getPosts, savePosts } from "@/config/storage/posts";
import { getMetadata } from "@/screens/share-intent/share-intent.utils";
import { PostType } from "@/types/posts";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import * as FileSystem from "expo-file-system/legacy";
import { savePostsService } from "./posts.service";

export type LoginResponseType = {
  user: any;
};

export type LoginErrorType = {
  code: string;
  message: string;
};

export const login = async (
  email: string,
  password: string
): Promise<LoginResponseType> => {
  try {
    const userCredential = await auth().signInWithEmailAndPassword(
      email,
      password
    );
    return { user: userCredential.user };
  } catch (error: any) {
    throw {
      code: error.code,
      message: error.message,
    } as LoginErrorType;
  }
};

type SyncPostsPropsType = {
  uid: string;
};

export const syncPosts = async ({ uid }: SyncPostsPropsType) => {
  if (!uid) {
    console.log("[Sync Lists] No user found");
    return;
  }

  try {
    console.log("[Sync Lists] Starting sync for user:", uid);

    const listsRef = firestore().collection("lists");
    const userListsQuery = await listsRef.where("userId", "==", uid).get();

    if (userListsQuery.empty) {
      console.log("[Sync Lists] No lists found for user:", uid);
      return;
    }

    const lists = userListsQuery.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const localPosts = getPosts();
    console.log("[Sync Lists] Local posts", localPosts);
    localPosts.length && savePostsService(localPosts);

    console.log("[Sync Lists] Found lists:", lists);
    // Extract posts from the first list and save them as share intents
    if (lists.length > 0 && "posts" in lists[0]) {
      const posts = lists[0].posts as PostType[];
      savePosts(posts);
      console.log("[Sync Lists] Saved posts:", posts.length);

      const postsWithoutImages = (
        await Promise.all(
          posts.map(async (post) => {
            const localUri = `${FileSystem.documentDirectory}${post.id}.jpg`;
            const info = await FileSystem.getInfoAsync(localUri);
            return info.exists ? null : post;
          })
        )
      ).filter(Boolean) as PostType[];

      await Promise.allSettled(
        postsWithoutImages.map(async (post) => {
          try {
            const metadata = await getMetadata({ webUrl: post.url });
            if (metadata.thumbnail) {
              await saveImageFromUrl(forceHttps(metadata.thumbnail), post.id);
            }
          } catch {
            // silently skip posts where metadata/image fetch fails
          }
        })
      );
    }

    return lists;
  } catch (error: any) {
    console.error("[Sync Lists] Error syncing lists:", error.message);
    throw {
      code: error.code,
      message: error.message,
    };
  }
};
