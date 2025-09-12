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
    console.log("[Posts Service] Saving posts:", {
      userId,
      postsCount: posts.length,
    });

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
