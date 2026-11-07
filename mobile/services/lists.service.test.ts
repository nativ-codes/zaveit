import { setCurrentUser } from "@/test/fakes/auth";
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { createList, deleteList, getLists, isValidListPassword, isValidSlug, toListPath, updateList } from "./lists.service";

jest.mock("@/config/app-check", () => ({ getAppCheckToken: async () => "app-check-token" }));
jest.mock("@/config/api", () => ({ ApiEndpoints: { lists: "https://api.test/v1/lists" } }));

const fakeFetch = (status: number, body: unknown) =>
  jest.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify(body), { status }));

afterEach(() => {
  jest.restoreAllMocks();
});

describe("getLists", () => {
  it("loads the Username through GET /v1/lists with the ID token and App Check", async () => {
    setCurrentUser({ uid: "user-1" });
    const fetch = fakeFetch(200, { username: "andrei", lists: [] });

    expect(await getLists()).toEqual({ username: "andrei", lists: [] });
    expect(fetch).toHaveBeenCalledWith("https://api.test/v1/lists", {
      method: "GET",
      headers: { Authorization: "Bearer id-token-user-1", "X-Firebase-AppCheck": "app-check-token" },
    });
  });

  it("answers no Username for a user who hasn't claimed one", async () => {
    setCurrentUser({ uid: "user-1" });
    fakeFetch(200, { username: null, lists: [] });

    expect(await getLists()).toEqual({ username: null, lists: [] });
  });

  it("throws when the server fails", async () => {
    setCurrentUser({ uid: "user-1" });
    fakeFetch(503, { error: "publishing is not configured" });

    await expect(getLists()).rejects.toThrow("503");
  });
});

describe("createList", () => {
  const input = { name: "My Books", tags: ["books"], password: "abc", published: true };
  const created = { listPath: "my-books", name: "My Books", tags: ["books"], published: true };

  it("posts the List to POST /v1/lists and returns the server's List", async () => {
    setCurrentUser({ uid: "user-1" });
    const fetch = fakeFetch(201, created);

    expect(await createList(input)).toEqual(created);
    expect(fetch).toHaveBeenCalledWith("https://api.test/v1/lists", {
      method: "POST",
      headers: {
        Authorization: "Bearer id-token-user-1",
        "X-Firebase-AppCheck": "app-check-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });
  });

  it("resolves null when the user already has a List with that link", async () => {
    setCurrentUser({ uid: "user-1" });
    fakeFetch(409, { error: "you already have a list with this link" });

    expect(await createList(input)).toBeNull();
  });

  it("throws on any other refusal", async () => {
    setCurrentUser({ uid: "user-1" });
    fakeFetch(403, { error: "you already have 10 lists" });

    await expect(createList(input)).rejects.toThrow("403");
  });
});

describe("updateList", () => {
  const renamed = { listPath: "old-books", name: "Old Books", tags: ["books"], published: true };

  it("sends only the changed fields to PATCH /v1/lists/{listPath} and returns the server's List", async () => {
    setCurrentUser({ uid: "user-1" });
    const fetch = fakeFetch(200, renamed);

    expect(await updateList("my-books", { name: "Old Books" })).toEqual(renamed);
    expect(fetch).toHaveBeenCalledWith("https://api.test/v1/lists/my-books", {
      method: "PATCH",
      headers: {
        Authorization: "Bearer id-token-user-1",
        "X-Firebase-AppCheck": "app-check-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: "Old Books" }),
    });
  });

  it("resolves null when a rename clashes with another of the user's Lists", async () => {
    setCurrentUser({ uid: "user-1" });
    fakeFetch(409, { error: "you already have a list with this link" });

    expect(await updateList("my-books", { name: "Films" })).toBeNull();
  });

  it("throws on any other refusal", async () => {
    setCurrentUser({ uid: "user-1" });
    fakeFetch(404, { error: "no such list" });

    await expect(updateList("my-books", { published: false })).rejects.toThrow("404");
  });
});

describe("deleteList", () => {
  it("calls DELETE /v1/lists/{listPath}", async () => {
    setCurrentUser({ uid: "user-1" });
    const fetch = jest.spyOn(global, "fetch").mockResolvedValue(new Response(null, { status: 204 }));

    await deleteList("my-books");
    expect(fetch).toHaveBeenCalledWith("https://api.test/v1/lists/my-books", {
      method: "DELETE",
      headers: { Authorization: "Bearer id-token-user-1", "X-Firebase-AppCheck": "app-check-token" },
    });
  });

  it("throws when the server fails", async () => {
    setCurrentUser({ uid: "user-1" });
    fakeFetch(502, { error: "could not delete list" });

    await expect(deleteList("my-books")).rejects.toThrow("502");
  });
});

describe("toListPath", () => {
  it.each([
    ["My Books", "my-books"],
    ["  Weeknight recipes  ", "weeknight-recipes"],
    ["a - b  --  c", "a-b-c"],
    ["-Edge-", "edge"],
    ["", ""],
  ])("makes %j into %j, like the server", (name, path) => {
    expect(toListPath(name)).toBe(path);
  });
});

describe("isValidSlug", () => {
  it.each([
    ["ab", false],
    ["abc", true],
    ["my-books", true],
    ["-books", false],
    ["my--books", false],
    ["Books", false],
    ["a".repeat(31), false],
  ])("%s → %s", (slug, valid) => {
    expect(isValidSlug(slug)).toBe(valid);
  });
});

describe("isValidListPassword", () => {
  it("counts code points like the server", () => {
    expect(isValidListPassword("🔑🔑")).toBe(false);
    expect(isValidListPassword("🔑🔑🔑")).toBe(true);
    expect(isValidListPassword("🔑".repeat(128))).toBe(true);
    expect(isValidListPassword("🔑".repeat(129))).toBe(false);
  });
});
