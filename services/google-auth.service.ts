import auth from "@react-native-firebase/auth";
import {
  GoogleSignin,
  isNoSavedCredentialFoundResponse,
} from "@react-native-google-signin/google-signin";
import { createUser } from "./users.service";

export type GoogleAuthResponseType = {
  user: any;
};

export type GoogleAuthErrorType = {
  code: string;
  message: string;
};

export const initializeGoogleSignIn = () => {
  GoogleSignin.configure();
};

const handleUserCreation = async (firebaseUser: any) => {
  try {
    // Create new user in Firestore
    console.log(
      "[Google Auth] Creating new user in Firestore:",
      firebaseUser.uid
    );
    const user = {
      id: firebaseUser.uid,
      displayName: firebaseUser.displayName,
      email: firebaseUser.email,
    };
    await createUser(user);

    return user;
  } catch (error) {
    console.error("[Google Auth] Error in handleUserCreation:", error);
    throw error;
  }
};

export const signInWithGoogle = async (): Promise<GoogleAuthResponseType> => {
  try {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signInSilently();
    console.log("[Google Auth] Attempting silent sign in");

    if (isNoSavedCredentialFoundResponse(response)) {
      console.log("[Google Auth] No saved credentials, initiating sign in");
      const letsSignin = await GoogleSignin.signIn();

      if (!letsSignin.data?.idToken) {
        throw new Error("No ID token present in Google Sign In response");
      }

      const googleCredential = auth.GoogleAuthProvider.credential(
        letsSignin.data.idToken
      );
      console.log("[Google Auth] Got Google credentials");

      const userCredential = await auth().signInWithCredential(
        googleCredential
      );
      console.log("[Google Auth] Successfully signed in with Firebase");

      if (userCredential) {
        console.log(
          "[Google Auth] User credential:",
          JSON.stringify(userCredential)
        );

        // Check if this is a new user using Firebase's isNewUser flag
        if (userCredential.additionalUserInfo?.isNewUser) {
          console.log(
            "[Google Auth] New user detected, creating Firestore record"
          );
          await handleUserCreation(userCredential.user);
        } else {
          console.log(
            "[Google Auth] Existing user, skipping Firestore creation"
          );
        }

        return {
          user: userCredential.user,
        };
      }
      return {
        user: null,
      };
    }

    return {
      user: null,
    };
  } catch (error: any) {
    console.error("[Google Auth] Error during sign in:", error);
    throw {
      code: error.code,
      message: error.message,
    } as GoogleAuthErrorType;
  }
};

export const signOut = async () => {
  try {
    await GoogleSignin.signOut();
    await auth().signOut();
    await GoogleSignin.revokeAccess();
  } catch (error) {
    console.error("[Google Auth] Error during sign out:", error);
    throw error;
  }
};
