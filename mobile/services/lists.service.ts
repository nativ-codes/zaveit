import { ApiEndpoints } from "@/config/api";
import { getAppCheckToken } from "@/config/app-check";
import { getAuth, getIdToken } from "@react-native-firebase/auth";

// A List as the server returns it, never with the hash or salt.
export type List = { listPath: string; name: string; tags: string[]; published: boolean };
export type ListsResponse = { username: string | null; lists: List[] };
export type NewList = { name: string; tags: string[]; password: string; published: boolean };

// Mirrors the server limit; raise to 10 with subscriptions.
export const MAX_LISTS = 2;
export const HOST = "zaveit.nativ.codes/";

// What a List name field drops as it's typed: anything but letters, digits, spaces and hyphens.
export const LIST_NAME_DISALLOWED = /[^a-zA-Z0-9 -]/g;

// The server's List Path rule, used only as a live preview: the server's value wins.
export const toListPath = (name: string) =>
  name.toLowerCase().replace(/[ -]+/g, "-").replace(/^-+|-+$/g, "");

// The server's format for Usernames and List Paths: 3 to 30 of a-z, 0-9 and single hyphens, no hyphen at either end.
export const isValidSlug = (slug: string) =>
  slug.length >= 3 && slug.length <= 30 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);

// 3 to 128 characters, counted in code points as the server counts them.
export const isValidListPassword = (password: string) => {
  const length = [...password].length;
  return length >= 3 && length <= 128;
};

// Calls an owner endpoint on the Go server, which alone reads and writes Usernames and Lists.
const request = async (url: string, method: "GET" | "POST" | "PATCH" | "DELETE", body?: object): Promise<Response> => {
  const user = getAuth().currentUser;
  if (!user) {
    throw new Error("Publishing needs a signed-in user");
  }

  return fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${await getIdToken(user)}`,
      "X-Firebase-AppCheck": await getAppCheckToken(),
      ...(body && { "Content-Type": "application/json" }),
    },
    ...(body && { body: JSON.stringify(body) }),
  });
};

export const getLists = async (): Promise<ListsResponse> => {
  const response = await request(ApiEndpoints.lists, "GET");
  if (response.status !== 200) {
    throw new Error(`Lists answered ${response.status}`);
  }
  return response.json();
};

// Reserved names come back as taken.
export const isUsernameAvailable = async (username: string): Promise<boolean> => {
  const response = await request(`${ApiEndpoints.username}/${encodeURIComponent(username)}`, "GET");
  if (response.status !== 200) {
    throw new Error(`Username check answered ${response.status}`);
  }
  const { available } = await response.json();
  return available === true;
};

// Resolves false when someone else got the name first.
export const claimUsername = async (username: string): Promise<boolean> => {
  const response = await request(ApiEndpoints.username, "POST", { username });
  if (response.status === 409) {
    return false;
  }
  if (response.status !== 201) {
    throw new Error(`Username claim answered ${response.status}`);
  }
  return true;
};

// Resolves null when the user already has a List with that link.
export const createList = async (list: NewList): Promise<List | null> => {
  const response = await request(ApiEndpoints.lists, "POST", list);
  if (response.status === 409) {
    return null;
  }
  if (response.status !== 201) {
    throw new Error(`List create answered ${response.status}`);
  }
  return response.json();
};

// Sends only the changed fields. Resolves null when a rename clashes with another of the user's Lists.
export const updateList = async (
  listPath: string,
  changes: Partial<Omit<List, "listPath">> & { password?: string }
): Promise<List | null> => {
  const response = await request(`${ApiEndpoints.lists}/${listPath}`, "PATCH", changes);
  if (response.status === 409) {
    return null;
  }
  if (response.status !== 200) {
    throw new Error(`List update answered ${response.status}`);
  }
  return response.json();
};

export const deleteList = async (listPath: string): Promise<void> => {
  const response = await request(`${ApiEndpoints.lists}/${listPath}`, "DELETE");
  if (response.status !== 204) {
    throw new Error(`List delete answered ${response.status}`);
  }
};

// Takes every List offline and frees the Username; account deletion runs it first.
export const deleteUsername = async (): Promise<void> => {
  const response = await request(ApiEndpoints.username, "DELETE");
  if (response.status !== 204) {
    throw new Error(`Username delete answered ${response.status}`);
  }
};
