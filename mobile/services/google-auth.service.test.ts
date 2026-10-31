import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { getAuth, GoogleAuthProvider, signInWithCredential, signOut as firebaseSignOut } from "@react-native-firebase/auth";
import { signInWithGoogle, signOut } from "./google-auth.service";
import { createFirestoreUser } from "./users.service";

jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: {
    hasPlayServices: jest.fn(),
    signIn: jest.fn(),
    signInSilently: jest.fn(),
    hasPreviousSignIn: jest.fn(),
    revokeAccess: jest.fn(),
    signOut: jest.fn(),
  },
  isCancelledResponse: (response: { type: string }) => response.type === "cancelled",
}));

jest.mock("@react-native-firebase/auth", () => ({
  getAuth: jest.fn(),
  GoogleAuthProvider: { credential: jest.fn() },
  signInWithCredential: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock("./users.service", () => ({ createFirestoreUser: jest.fn() }));

const google = jest.mocked(GoogleSignin);

beforeEach(() => {
  jest.resetAllMocks();
});

describe("signInWithGoogle", () => {
  it("always uses the interactive flow and signs in to Firebase", async () => {
    google.signIn.mockResolvedValue({
      type: "success",
      data: { idToken: "token" },
    } as never);
    jest.mocked(GoogleAuthProvider.credential).mockReturnValue({} as never);
    jest.mocked(createFirestoreUser).mockResolvedValue("user-id");

    await expect(signInWithGoogle()).resolves.toBe("user-id");

    expect(google.signInSilently).not.toHaveBeenCalled();
    expect(signInWithCredential).toHaveBeenCalledTimes(1);
  });

  it("returns null when the user cancels", async () => {
    google.signIn.mockResolvedValue({ type: "cancelled", data: null } as never);

    await expect(signInWithGoogle()).resolves.toBeNull();

    expect(signInWithCredential).not.toHaveBeenCalled();
  });
});

describe("signOut", () => {
  beforeEach(() => {
    jest.mocked(getAuth).mockReturnValue({ currentUser: {} } as never);
  });

  it("clears the saved Google login", async () => {
    google.hasPreviousSignIn.mockReturnValue(true);

    await signOut();

    expect(firebaseSignOut).toHaveBeenCalledTimes(1);
    expect(google.revokeAccess).toHaveBeenCalledTimes(1);
    expect(google.signOut).toHaveBeenCalledTimes(1);
  });

  it("still clears the saved login when revoking fails", async () => {
    google.hasPreviousSignIn.mockReturnValue(true);
    google.revokeAccess.mockRejectedValue(new Error("offline") as never);

    await expect(signOut()).rejects.toThrow("offline");

    expect(google.signOut).toHaveBeenCalledTimes(1);
  });

  it("still clears the saved Google login when Firebase has no user", async () => {
    jest.mocked(getAuth).mockReturnValue({ currentUser: null } as never);
    google.hasPreviousSignIn.mockReturnValue(true);

    await signOut();

    expect(firebaseSignOut).not.toHaveBeenCalled();
    expect(google.signOut).toHaveBeenCalledTimes(1);
  });

  it("skips Google for users with no Google login", async () => {
    google.hasPreviousSignIn.mockReturnValue(false);

    await signOut();

    expect(firebaseSignOut).toHaveBeenCalledTimes(1);
    expect(google.revokeAccess).not.toHaveBeenCalled();
    expect(google.signOut).not.toHaveBeenCalled();
  });
});
