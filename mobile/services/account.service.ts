import { safelyPrintError } from "@/common/utils";
import { Analytics } from "@/config/analytics";
import { ErrorHandler } from "@/config/errors";
import { clearAllData, setAppAuthType } from "@/config/storage";
import { FirebaseAuthTypes, getAuth } from "@react-native-firebase/auth";
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  where,
  writeBatch,
} from "@react-native-firebase/firestore";
import { confirmAppleIdentity } from "./apple-auth.service";
import { confirmGoogleIdentity, signOut } from "./google-auth.service";

export const logOut = async () => {
  try {
    setAppAuthType();
    clearAllData();
    await signOut();
  } catch (error) {
    ErrorHandler.logError({
      location: "logOut",
      error: safelyPrintError(error),
    });
  }
};

// Returns false when the user cancels. Anything thrown before the cloud batch leaves all data intact.
const confirmIdentityAndRevoke = async (
  user: FirebaseAuthTypes.User
): Promise<boolean> => {
  const providerIds = user.providerData.map(({ providerId }) => providerId);

  if (providerIds.includes("google.com")) {
    return confirmGoogleIdentity(user);
  }

  if (providerIds.includes("apple.com")) {
    const authorizationCode = await confirmAppleIdentity(user);
    if (!authorizationCode) {
      return false;
    }
    // Needs the signed-in user, so it can't run after the login is deleted.
    await getAuth().revokeToken(authorizationCode);
    return true;
  }

  throw new Error("Unsupported sign-in provider");
};

// A batch, so a failure can't leave some lists deleted and others not.
const deleteCloudData = async (userId: string) => {
  const firestore = getFirestore();
  const lists = await getDocs(
    query(collection(firestore, "lists"), where("userId", "==", userId))
  );

  const batch = writeBatch(firestore);
  lists.docs.forEach((list) => batch.delete(list.ref));
  batch.delete(doc(firestore, "users", userId));
  await batch.commit();
};

// Returns false when the user cancels the identity check, and throws on failure.
export const deleteAccount = async (): Promise<boolean> => {
  const user = getAuth().currentUser;

  if (!user) {
    throw new Error("No authenticated user found");
  }

  if (!(await confirmIdentityAndRevoke(user))) {
    return false;
  }

  await deleteCloudData(user.uid);
  await user.delete();

  // Before logOut, which clears the analytics opt-out.
  Analytics.sendEvent(Analytics.events.remove_account);
  await logOut();
  return true;
};
