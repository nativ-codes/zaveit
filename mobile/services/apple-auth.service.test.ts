import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { appleAuth } from "@invertase/react-native-apple-authentication";
import { signInWithApple } from "./apple-auth.service";

jest.mock("@invertase/react-native-apple-authentication", () => ({
  appleAuth: {
    performRequest: jest.fn(),
    Operation: { LOGIN: 1 },
    Scope: { EMAIL: 0, FULL_NAME: 1 },
    Error: { CANCELED: "1001" },
  },
}));

jest.mock("@react-native-firebase/auth", () => ({
  getAuth: jest.fn(),
  AppleAuthProvider: { credential: jest.fn() },
  signInWithCredential: jest.fn(),
}));

jest.mock("./users.service", () => ({ createFirestoreUser: jest.fn() }));

const performRequest = jest.mocked(appleAuth.performRequest);

beforeEach(() => {
  jest.resetAllMocks();
});

describe("signInWithApple", () => {
  it("returns null when the user cancels", async () => {
    performRequest.mockRejectedValue({ code: "1001" } as never);

    await expect(signInWithApple()).resolves.toBeNull();
  });

  it("rethrows real failures", async () => {
    performRequest.mockRejectedValue({ code: "1000" } as never);

    await expect(signInWithApple()).rejects.toEqual({ code: "1000" });
  });
});
