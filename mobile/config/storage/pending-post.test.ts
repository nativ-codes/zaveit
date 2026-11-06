import { describe, expect, it } from "@jest/globals";
import {
  clearPendingPost,
  dismissJustSharedPost,
  getJustSharedPost,
  getPendingPost,
  keepPendingPost,
} from "./pending-post";

describe("Pending post", () => {
  it("is empty when nothing was shared while signed out", () => {
    expect(getPendingPost()).toBeUndefined();
  });

  it("keeps a link shared while signed out", () => {
    keepPendingPost("https://example.com/a");

    expect(getPendingPost()).toBe("https://example.com/a");
  });

  it("replaces an older link with a newer share", () => {
    keepPendingPost("https://example.com/a");
    keepPendingPost("https://example.com/b");

    expect(getPendingPost()).toBe("https://example.com/b");
  });

  it("is gone once cleared, so the prompt never repeats", () => {
    keepPendingPost("https://example.com/a");
    clearPendingPost();

    expect(getPendingPost()).toBeUndefined();
    expect(getJustSharedPost()).toBeUndefined();
  });

  it("is marked as just shared until dismissed, and stays kept for after sign-in", () => {
    keepPendingPost("https://example.com/a");
    expect(getJustSharedPost()).toBe("https://example.com/a");

    dismissJustSharedPost();

    expect(getJustSharedPost()).toBeUndefined();
    expect(getPendingPost()).toBe("https://example.com/a");
  });
});
