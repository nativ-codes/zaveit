import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { getPosts, savePosts } from "@/config/storage/posts";
import { getAuth, setCurrentUser } from "@/test/fakes/auth";
import { failNextBatchCommit, getFirestore } from "@/test/fakes/firestore";
import { PostType } from "@/types/posts";
import { appleAuth } from "@invertase/react-native-apple-authentication";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { deleteAccount } from "./account.service";

// Pulled in through @/common/utils, and needs native Firebase.
jest.mock("@/config/app-check", () => ({}));

jest.mock("@/config/analytics", () => ({
  Analytics: { sendEvent: jest.fn(), events: { remove_account: "remove_account" } },
}));

jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: {
    hasPlayServices: jest.fn(),
    signIn: jest.fn(),
    hasPreviousSignIn: jest.fn(),
    revokeAccess: jest.fn(),
    signOut: jest.fn(),
  },
  isCancelledResponse: (response: { type: string }) => response.type === "cancelled",
}));

jest.mock("@invertase/react-native-apple-authentication", () => ({
  appleAuth: {
    performRequest: jest.fn(),
    Operation: { LOGIN: 1 },
    Scope: { EMAIL: 0, FULL_NAME: 1 },
    Error: { CANCELED: "1001" },
  },
}));

const post = { id: "post-1", url: "https://example.com" } as PostType;
const signIn = jest.mocked(GoogleSignin.signIn);
const performRequest = jest.mocked(appleAuth.performRequest);

const cloudDataExists = async () => {
  const lists = await getFirestore().collection("lists").get();
  const user = await getFirestore().collection("users").doc("user-1").get();
  return { lists: lists.docs.length, user: user.exists() };
};

const untouched = { lists: 2, user: true };
const steps: string[] = [];

const signInAs = (providerId: string) => {
  const user = {
    uid: "user-1",
    providerData: [{ providerId }],
    reauthenticateWithCredential: jest.fn(async () => {
      steps.push(`identity confirmed, cloud ${(await cloudDataExists()).lists}`);
    }),
    delete: jest.fn(async () => {
      steps.push(`login deleted, cloud ${(await cloudDataExists()).lists}, local ${getPosts().length}`);
      setCurrentUser(null);
    }),
  };
  setCurrentUser(user);
  return user;
};

const expectNothingDeleted = async (user: ReturnType<typeof signInAs>) => {
  expect(user.delete).not.toHaveBeenCalled();
  expect(await cloudDataExists()).toEqual(untouched);
  expect(getPosts()).toHaveLength(1);
};

beforeEach(async () => {
  jest.clearAllMocks();
  jest.mocked(GoogleSignin.hasPreviousSignIn).mockReturnValue(false);
  signIn.mockReset();
  performRequest.mockReset();
  steps.length = 0;
  signIn.mockResolvedValue({ type: "success", data: { idToken: "token" } } as never);
  performRequest.mockResolvedValue({
    identityToken: "token",
    nonce: "nonce",
    authorizationCode: "code",
  } as never);

  await getFirestore().collection("users").doc("user-1").set({});
  await getFirestore().collection("lists").doc("list-1").set({ userId: "user-1", posts: [post] });
  await getFirestore().collection("lists").doc("list-2").set({ userId: "user-1", posts: [] });
  savePosts([post]);
});

describe("deleteAccount", () => {
  it("confirms identity, deletes cloud data, deletes the login, then clears local data", async () => {
    signInAs("google.com");

    await expect(deleteAccount()).resolves.toBe(true);

    expect(steps).toEqual(["identity confirmed, cloud 2", "login deleted, cloud 0, local 1"]);
    expect(await cloudDataExists()).toEqual({ lists: 0, user: false });
    expect(getPosts()).toHaveLength(0);
  });

  it("clears the saved Google login, so the next sign-in shows the account picker", async () => {
    signInAs("google.com");
    jest.mocked(GoogleSignin.hasPreviousSignIn).mockReturnValue(true);

    await deleteAccount();

    expect(GoogleSignin.revokeAccess).toHaveBeenCalledTimes(1);
    expect(GoogleSignin.signOut).toHaveBeenCalledTimes(1);
  });

  it("revokes the Apple token before deleting anything", async () => {
    signInAs("apple.com");
    const revokeToken = jest.spyOn(getAuth(), "revokeToken").mockImplementation(async () => {
      steps.push(`revoked, cloud ${(await cloudDataExists()).lists}`);
    });

    await expect(deleteAccount()).resolves.toBe(true);

    expect(revokeToken).toHaveBeenCalledWith("code");
    expect(steps).toEqual([
      "identity confirmed, cloud 2",
      "revoked, cloud 2",
      "login deleted, cloud 0, local 1",
    ]);
  });

  it("changes nothing when the user cancels the Google check", async () => {
    const user = signInAs("google.com");
    signIn.mockResolvedValue({ type: "cancelled", data: null } as never);

    await expect(deleteAccount()).resolves.toBe(false);

    await expectNothingDeleted(user);
  });

  it("changes nothing when the user cancels the Apple check", async () => {
    const user = signInAs("apple.com");
    performRequest.mockRejectedValue({ code: "1001" } as never);

    await expect(deleteAccount()).resolves.toBe(false);

    await expectNothingDeleted(user);
  });

  it("changes nothing when the identity check fails", async () => {
    const user = signInAs("google.com");
    user.reauthenticateWithCredential.mockRejectedValue(new Error("user-mismatch") as never);

    await expect(deleteAccount()).rejects.toThrow("user-mismatch");

    await expectNothingDeleted(user);
  });

  it("changes nothing when revoking the Apple token fails", async () => {
    const user = signInAs("apple.com");
    jest.spyOn(getAuth(), "revokeToken").mockRejectedValue(new Error("offline") as never);

    await expect(deleteAccount()).rejects.toThrow("offline");

    await expectNothingDeleted(user);
  });

  it("keeps the login and all data when the cloud deletion fails", async () => {
    const user = signInAs("google.com");
    failNextBatchCommit();

    await expect(deleteAccount()).rejects.toThrow("Batch failed");

    await expectNothingDeleted(user);
  });

  it("keeps local data and stays signed in when deleting the login fails", async () => {
    const user = signInAs("google.com");
    user.delete.mockRejectedValue(new Error("network") as never);

    await expect(deleteAccount()).rejects.toThrow("network");

    expect(getPosts()).toHaveLength(1);
    expect(getAuth().currentUser).toBe(user);
  });

  it("refuses providers it can't confirm", async () => {
    const user = signInAs("password");

    await expect(deleteAccount()).rejects.toThrow("Unsupported");

    await expectNothingDeleted(user);
  });
});
