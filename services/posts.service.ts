import { getPosts, savePosts, updatePost } from "@/config/storage/persistent";
import { checkSocialPlatform, getMetadata } from "@/screens/share-intent/share-intent.utils";
import { PostType } from "@/types";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

export const savePostService = async (post: PostType): Promise<void> => {
  try {
    const userId = auth().currentUser?.uid;
    console.log("[Posts Service] Saving post:", { userId, post });

    // Find the user's list
    const listsRef = firestore().collection("lists");
    const userListQuery = await listsRef
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (userListQuery.empty) {
      throw new Error("No list found for user");
    }

    const userList = userListQuery.docs[0];

    // Add the post to the list's posts array
    await userList.ref.update({
      userId: userId,
      posts: firestore.FieldValue.arrayUnion(post),
    });

    console.log("[Posts Service] Post saved successfully");
  } catch (error: any) {
    console.error("[Posts Service] Error saving post:", {
      error: error.message,
    });
    throw {
      code: error.code,
      message: error.message,
    };
  }
};

export const savePostsService = async (posts: PostType[]): Promise<void> => {
  try {
    const userId = auth().currentUser?.uid;
    console.log("[Posts Service] Saving posts:", { userId, postsCount: posts.length });

    // Find the user's list
    const listsRef = firestore().collection("lists");
    const userListQuery = await listsRef
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (userListQuery.empty) {
      throw new Error("No list found for user");
    }

    const userList = userListQuery.docs[0];

    // Add all posts to the list's posts array
    await userList.ref.update({
      userId: userId,
      posts: firestore.FieldValue.arrayUnion(...posts),
    });

    console.log("[Posts Service] Posts saved successfully");
  } catch (error: any) {
    console.error("[Posts Service] Error saving posts:", {
      error: error.message,
    });
    throw {
      code: error.code,
      message: error.message,
    };
  }
};

export const removePostService = async (post: PostType): Promise<void> => {
  try {
    const userId = auth().currentUser?.uid;
    console.log("[Posts Service] Removing post:", { userId, post });

    // Find the user's list
    const listsRef = firestore().collection("lists");
    const userListQuery = await listsRef
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (userListQuery.empty) {
      throw new Error("No list found for user");
    }

    const userList = userListQuery.docs[0];
    const listData = userList.data();

    // Filter out the post with the matching postId
    const updatedPosts = listData.posts.filter(
      (currentPost: PostType) => currentPost.id !== post.id
    );

    // Update the list with the filtered posts array
    await userList.ref.update({
      posts: updatedPosts,
    });

    console.log("[Posts Service] Post removed successfully");
  } catch (error: any) {
    console.error("[Posts Service] Error removing post:", {
      error: error.message,
    });
    throw {
      code: error.code,
      message: error.message,
    };
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

export const updatePostService = async (post: PostType): Promise<void> => {
  try {
    const userId = auth().currentUser?.uid;
    console.log("[Posts Service] Updating post:", { userId, post });

    // Find the user's list
    const listsRef = firestore().collection("lists");
    const userListQuery = await listsRef
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (userListQuery.empty) {
      throw new Error("No list found for user");
    }

    const userList = userListQuery.docs[0];
    const listData = userList.data();

    // Find and replace the post with the matching postId
    const updatedPosts = listData.posts.map((currentPost: PostType) => 
      currentPost.id === post.id ? post : currentPost
    );

    // Update the list with the updated posts array
    await userList.ref.update({
      posts: updatedPosts,
    });

    console.log("[Posts Service] Post updated successfully");
  } catch (error: any) {
    console.error("[Posts Service] Error updating post:", {
      error: error.message,
    });
    throw {
      code: error.code,
      message: error.message,
    };
  }
};

export const refreshPosts = async () => {
  const posts = getPosts();

  const postsToRefresh = posts.filter((post) => {
    const platformConfig = checkSocialPlatform(post.url);
    
    if (platformConfig && platformConfig.expiresAt) {
      console.log(
        "[Posts Service] Post to refresh:",
        post.updatedAt,
        platformConfig.expiresAt
      );
      return Date.now() > (post.updatedAt || 0) + platformConfig.expiresAt;
    }
    return false;
  });

  console.log("[Posts Service] Posts to refresh:", posts.length);

  postsToRefresh.forEach(async (post) => {
    const metadata = await getMetadata({
      webUrl: post.url
    });

    if (metadata) {
      updatePost({
        ...post,
        ...metadata,
        updatedAt: Date.now(),
      });
    }
  });
};