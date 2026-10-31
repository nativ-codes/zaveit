import { PostType } from "@/types";
import { getAuth } from "@react-native-firebase/auth";
import {
  arrayUnion,
  collection,
  getDocs,
  getFirestore,
  limit,
  query,
  updateDoc,
  where,
} from "@react-native-firebase/firestore";
import { createList } from "./users.service";

// Sign-up can fail before the list exists, so create it here when it's missing.
// shortcut: two simultaneous first saves can each create a list, move to a list id derived from the user id if that shows up.
export const getUserList = async () => {
  const userId = getAuth().currentUser?.uid;
  if (!userId) {
    throw new Error("No signed-in user");
  }

  const userListQuery = await getDocs(
    query(
      collection(getFirestore(), "lists"),
      where("userId", "==", userId),
      limit(1)
    )
  );

  if (userListQuery.empty) {
    return { ref: await createList(userId), posts: [] as PostType[] };
  }

  const userList = userListQuery.docs[0];
  return { ref: userList.ref, posts: userList.data().posts as PostType[] };
};

export const savePostService = async (post: PostType): Promise<void> => {
  try {
    const userList = await getUserList();

    // Add the post to the list's posts array
    await updateDoc(userList.ref, {
      posts: arrayUnion(post),
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
    console.log("[Posts Service] Saving posts:", {
      postsCount: posts.length,
    });

    const userList = await getUserList();

    // Add all posts to the list's posts array
    await updateDoc(userList.ref, {
      posts: arrayUnion(...posts),
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
    const userList = await getUserList();

    // Filter out the post with the matching postId
    const updatedPosts = userList.posts.filter(
      (currentPost: PostType) => currentPost.id !== post.id
    );

    // Update the list with the filtered posts array
    await updateDoc(userList.ref, {
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
