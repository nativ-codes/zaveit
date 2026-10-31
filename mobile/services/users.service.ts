import {
  collection,
  doc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from "@react-native-firebase/firestore";

export type UserType = {
  id: string;
  displayName: string | null;
  email: string | null;
};

export type UserUUIDType = string;

export const createList = async (userId: string) => {
  const listRef = doc(collection(getFirestore(), "lists"));
  await setDoc(listRef, {
    isPublished: false,
    posts: [],
    userId,
    createdAt: serverTimestamp(),
  });
  return listRef;
};

export const createUser = async (user: UserType): Promise<void> => {
  try {
    const userRef = doc(getFirestore(), "users", user.id);
    await setDoc(userRef, {
      displayName: user.displayName,
      email: user.email,
      createdAt: serverTimestamp(),
    });

    // Create a list for the user
    await createList(user.id);

    console.log("[Users Service] User and list created successfully:", user.id);
  } catch (error: any) {
    console.error("[Users Service] Error creating user:", {
      userId: user.id,
      error: error.message,
    });
    throw {
      code: error.code,
      message: error.message,
    };
  }
};

export const createFirestoreUser = async (
  userCredential: any
): Promise<UserUUIDType | null> => {
  try {
    if (userCredential) {
      // Check if this is a new user using Firebase's isNewUser flag
      if (userCredential.additionalUserInfo?.isNewUser) {
        console.log(
          "[Google Auth] New user detected, creating Firestore record"
        );
        // Create new user in Firestore
        console.log(
          "[Users Service] Creating new user in Firestore:",
          userCredential.user.uid
        );
        const user = {
          id: userCredential.user.uid,
          uid: userCredential.user.uid,
          displayName: userCredential.user.displayName,
          email: userCredential.user.email,
        };
        await createUser(user);
        // return user;
      } else {
        console.log("[Google Auth] Existing user, skipping Firestore creation");
      }
      return userCredential.user.uid as UserUUIDType;
    } else {
      return null;
    }
  } catch (error) {
    console.error("[Users Service] Error in handleUserCreation:", error);
    throw error;
  }
};
