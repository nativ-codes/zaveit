import { safelyPrintError } from "@/common/utils/error-parsers";
import { ErrorHandler } from "@/config/errors";
import { getPosts, savePosts } from "@/config/storage/posts";
import { getAuth, signInWithEmailAndPassword } from "@react-native-firebase/auth";
import { getUserList, savePostsService } from "./posts.service";

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
    const userCredential = await signInWithEmailAndPassword(
      getAuth(),
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

// Safe to repeat. Compares by id because an edited Post differs from its cloud copy, and arrayUnion would add it twice.
// Never rejects, so callers can start it without waiting. Resolves false when the sync failed.
export const syncPosts = async (): Promise<boolean> => {
  try {
    const { posts: cloudPosts } = await getUserList();
    const localPosts = getPosts();

    const cloudIds = new Set(cloudPosts.map(({ id }) => id));
    const missingFromCloud = localPosts.filter(({ id }) => !cloudIds.has(id));
    if (missingFromCloud.length) {
      await savePostsService(missingFromCloud);
    }

    // The local copy wins, because edits aren't uploaded.
    const localIds = new Set(localPosts.map(({ id }) => id));
    savePosts(cloudPosts.filter(({ id }) => !localIds.has(id)));
    return true;
  } catch (error) {
    ErrorHandler.logError({
      location: "syncPosts",
      error: safelyPrintError(error),
    });
    return false;
  }
};
