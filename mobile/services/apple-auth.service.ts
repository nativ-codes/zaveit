import { appleAuth } from "@invertase/react-native-apple-authentication";
import {
    AppleAuthProvider,
    getAuth,
    signInWithCredential,
} from "@react-native-firebase/auth";
import { createFirestoreUser } from "./users.service";

export const signInWithApple = async () => {
    // Start the sign-in request
    console.log("Starting Apple Sign-In");
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
}