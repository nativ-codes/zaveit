import { firebase } from "@react-native-firebase/app-check";

// Initializes Firebase App Check. Debug provider in dev builds (register the
// debug token in the Firebase console), real attestation in release.
export const initializeAppCheck = async (): Promise<void> => {
  try {
    const provider = firebase.appCheck().newReactNativeFirebaseAppCheckProvider();

    provider.configure({
      android: {
        provider: __DEV__ ? "debug" : "playIntegrity",
      },
      apple: {
        provider: __DEV__ ? "debug" : "appAttestWithDeviceCheckFallback",
      },
    });

    await firebase.appCheck().initializeAppCheck({
      provider,
      isTokenAutoRefreshEnabled: true,
    });
  } catch (error) {
    console.warn("[App Check] Initialization failed:", error);
  }
};

// Returns the current App Check token, or null when unavailable. Callers
// treat null as "send request without token" and let the server decide.
export const getAppCheckToken = async (): Promise<string | null> => {
  try {
    const { token } = await firebase.appCheck().getToken();
    return token;
  } catch (error) {
    console.warn("[App Check] Failed to get token:", error);
    return null;
  }
};
