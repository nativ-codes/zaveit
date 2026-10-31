import { getAuth, GoogleAuthProvider, signInWithCredential, signOut as firebaseSignOut } from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
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
    const response = await GoogleSignin.signIn();

    if (!response.data?.idToken) {
      throw new Error("No ID token present in Google Sign In response");
    }

    const googleCredential = GoogleAuthProvider.credential(
      response.data.idToken
    );
    const userCredential = await signInWithCredential(
      getAuth(),
      googleCredential
    );

    return await createFirestoreUser(userCredential);
  } catch (error: any) {
    throw {
      code: error.code,
      message: error.message,
    } as GoogleAuthErrorType;
  }
};

export const signOut = async () => {
  await firebaseSignOut(getAuth());

  // Apple and anonymous users have no Google login to clear.
  if (!GoogleSignin.hasPreviousSignIn()) {
    return;
  }

  try {
    await GoogleSignin.revokeAccess();
  } finally {
    // Runs even if revoking fails (e.g. offline), so the saved login is always cleared.
    await GoogleSignin.signOut();
  }
};
