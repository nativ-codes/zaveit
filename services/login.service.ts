import { getPosts, savePosts } from "@/config/storage/posts";
import { PostType } from "@/types/posts";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
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

    console.log("[Sync Lists] Local posts");
    const localPosts = getPosts();
    localPosts.length && savePostsService(localPosts);

    console.log("[Sync Lists] Found lists:", lists);
    // Extract posts from the first list and save them as share intents
    if (lists.length > 0 && "posts" in lists[0]) {
      const posts = lists[0].posts as PostType[];
      savePosts(posts);
      console.log("[Sync Lists] Saved posts:", posts.length);
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
