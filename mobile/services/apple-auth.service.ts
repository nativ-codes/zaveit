import { appleAuth } from "@invertase/react-native-apple-authentication";
import {
    AppleAuthProvider,
    getAuth,
    signInWithCredential,
} from "@react-native-firebase/auth";
import { createFirestoreUser, UserUUIDType } from "./users.service";

// Returns null when the user cancels.
export const signInWithApple = async (): Promise<UserUUIDType | null> => {
    try {
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
        const { identityToken, nonce } = appleAuthRequestResponse;
        const appleCredential = AppleAuthProvider.credential(
            identityToken,
            nonce
        );

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
