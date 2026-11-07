import { storage } from "@/config/storage/storage";
import { beforeEach, jest } from "@jest/globals";
import { setCurrentUser } from "./fakes/auth";
import { resetFileSystem } from "./fakes/file-system";
import { resetFirestore } from "./fakes/firestore";

// jest-expo mocks this module itself, which would hide the fake.
jest.unmock("expo-file-system/legacy");
// Ships untranspiled ESM, and a toast has nothing to show under Jest.
jest.mock("burnt", () => ({ toast: jest.fn() }));

beforeEach(() => {
  storage.clearAll(); // react-native-mmkv swaps itself for an in-memory store under Jest
  resetFirestore();
  resetFileSystem();
  setCurrentUser(null);
});
