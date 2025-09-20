import auth from "@react-native-firebase/auth";
import {
  GoogleSignin,
  isNoSavedCredentialFoundResponse,
} from "@react-native-google-signin/google-signin";
import { createFirestoreUser, UserUUIDType } from "./users.service";

export type GoogleAuthResponseType = {
  user: any;
};

export type GoogleAuthErrorType = {
  code: string;
  message: string;
};

export const initializeGoogleSignIn = () => {
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
  });
};

export const signInWithGoogle = async (): Promise<UserUUIDType | null> => {
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

      return await createFirestoreUser(userCredential);
    }

    return null;
  } catch (error: any) {
    throw {
      code: error.code,
      message: error.message,
    } as GoogleAuthErrorType;
  }
};

export const signOut = async () => {
  try {
    await auth().signOut();
    await GoogleSignin.signOut();
    await GoogleSignin.revokeAccess();
  } catch (error) {
    throw error;
  }
};
