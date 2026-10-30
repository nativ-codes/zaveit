import { firebase } from "@react-native-firebase/app-check";

let initializePromise: Promise<void> | null = null;

// Initializes Firebase App Check. Debug provider in dev builds (register the
// debug token in the Firebase console), real attestation in release.
export const initializeAppCheck = (): Promise<void> => {
  if (initializePromise) {
    return initializePromise;
  }

  initializePromise = (async () => {
    try {
      const provider = firebase
        .appCheck()
        .newReactNativeFirebaseAppCheckProvider();
      const debugToken = process.env.EXPO_PUBLIC_APP_CHECK_DEBUG_TOKEN;

      provider.configure({
        android: {
          provider: __DEV__ ? "debug" : "playIntegrity",
          debugToken: __DEV__ ? debugToken : undefined,
        },
        apple: {
          provider: __DEV__ ? "debug" : "appAttestWithDeviceCheckFallback",
          debugToken: __DEV__ ? debugToken : undefined,
        },
      });

      await firebase.appCheck().initializeAppCheck({
        provider,
        isTokenAutoRefreshEnabled: true,
      });
    } catch (error) {
      console.warn("[App Check] Initialization failed:", error);
    }
  })();

  return initializePromise;
};

// Returns the current App Check token, or null when unavailable. Callers
// treat null as "send request without token" and let the server decide.
export const getAppCheckToken = async (): Promise<string | null> => {
  try {
    await initializeAppCheck();
    const { token } = await firebase.appCheck().getToken();
    return token;
  } catch (error) {
    console.warn("[App Check] Failed to get token:", error);
    return null;
  }
};
