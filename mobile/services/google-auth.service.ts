import { FirebaseAuthTypes, getAuth, GoogleAuthProvider, reauthenticateWithCredential, signInWithCredential, signOut as firebaseSignOut } from "@react-native-firebase/auth";
import { GoogleSignin, isCancelledResponse } from "@react-native-google-signin/google-signin";
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

// Returns null when the user cancels.
const requestGoogleCredential = async () => {
  await GoogleSignin.hasPlayServices();
  const response = await GoogleSignin.signIn();

  if (isCancelledResponse(response)) {
    return null;
  }

  if (!response.data?.idToken) {
    throw new Error("No ID token present in Google Sign In response");
  }

  return GoogleAuthProvider.credential(response.data.idToken);
};

// Returns null when the user cancels.
export const signInWithGoogle = async (): Promise<UserUUIDType | null> => {
  try {
    const googleCredential = await requestGoogleCredential();

    if (!googleCredential) {
      return null;
    }

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

// Returns false when the user cancels. Picking a different Google account throws.
export const confirmGoogleIdentity = async (
  user: FirebaseAuthTypes.User
): Promise<boolean> => {
  const googleCredential = await requestGoogleCredential();

  if (!googleCredential) {
    return false;
  }

  await reauthenticateWithCredential(user, googleCredential);
  return true;
};

export const signOut = async () => {
  // Firebase rejects sign-out with no user, which is the case right after account deletion.
  if (getAuth().currentUser) {
    await firebaseSignOut(getAuth());
  }

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
