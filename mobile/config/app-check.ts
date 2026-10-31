import { getApp } from "@react-native-firebase/app";
import {
  AppCheck,
  getToken,
  initializeAppCheck as initializeFirebaseAppCheck,
} from "@react-native-firebase/app-check";

import { safelyPrintError } from "@/common/utils/error-parsers";
import { ErrorHandler } from "@/config/errors";

let appCheck: Promise<AppCheck> | undefined;

// Dev builds use the debug provider, whose token must be registered in the Firebase console.
export const initializeAppCheck = (): Promise<AppCheck> => {
  if (!appCheck) {
    const debugToken = __DEV__
      ? process.env.EXPO_PUBLIC_APP_CHECK_DEBUG_TOKEN
      : undefined;

    appCheck = initializeFirebaseAppCheck(getApp(), {
      provider: {
        providerOptions: {
          android: {
            provider: __DEV__ ? "debug" : "playIntegrity",
            debugToken,
          },
          apple: {
            provider: __DEV__ ? "debug" : "appAttestWithDeviceCheckFallback",
            debugToken,
          },
        },
      },
      isTokenAutoRefreshEnabled: true,
    });
  }

  return appCheck;
};

// An empty token makes the server answer 401, which callers already handle as a failed request.
export const getAppCheckToken = async (): Promise<string> => {
  try {
    const { token } = await getToken(await initializeAppCheck());
    return token;
  } catch (error) {
    appCheck = undefined;
    ErrorHandler.logError({
      location: "getAppCheckToken",
      error: safelyPrintError(error),
    });
    return "";
  }
};
