import { appleAuth } from "@invertase/react-native-apple-authentication";
import {
    AppleAuthProvider,
    FirebaseAuthTypes,
    getAuth,
    reauthenticateWithCredential,
    signInWithCredential,
} from "@react-native-firebase/auth";
import { createFirestoreUser, UserUUIDType } from "./users.service";

const requestAppleCredential = async () => {
    // Start the sign-in request
    const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        // As per the FAQ of react-native-apple-authentication, the name should come first in the following array.
        // See: https://github.com/invertase/react-native-apple-authentication#faqs
        requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
    });

    // Ensure Apple returned a user identityToken
    if (!appleAuthRequestResponse.identityToken) {
        throw new Error("Apple Sign-In failed - no identify token returned");
    }

    // Create a Firebase credential from the response
    const { identityToken, nonce, authorizationCode } = appleAuthRequestResponse;
    return {
        appleCredential: AppleAuthProvider.credential(identityToken, nonce),
        authorizationCode,
    };
};

// Returns null when the user cancels.
export const signInWithApple = async (): Promise<UserUUIDType | null> => {
    try {
        const { appleCredential } = await requestAppleCredential();

        // Sign the user in with the credential
        const userCredential = await signInWithCredential(getAuth(), appleCredential);

        return await createFirestoreUser(userCredential);
    } catch (error: any) {
        if (error.code === appleAuth.Error.CANCELED) {
            return null;
        }
        throw error;
    }
};

// Returns the authorization code for revoking the Apple token, or null when the user cancels.
export const confirmAppleIdentity = async (
    user: FirebaseAuthTypes.User
): Promise<string | null> => {
    try {
        const { appleCredential, authorizationCode } = await requestAppleCredential();

        if (!authorizationCode) {
            throw new Error("Apple Sign-In failed - no authorization code returned");
        }

        await reauthenticateWithCredential(user, appleCredential);
        return authorizationCode;
    } catch (error: any) {
        if (error.code === appleAuth.Error.CANCELED) {
            return null;
        }
        throw error;
    }
};
