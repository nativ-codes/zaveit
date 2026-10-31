const files = new Set<string>();

export const documentDirectory = "file:///documents/";

export const resetFileSystem = () => files.clear();

export const getInfoAsync = async (uri: string) => ({
  exists: uri === documentDirectory || files.has(uri),
});

export const makeDirectoryAsync = async () => {};

export const downloadAsync = async (_url: string, uri: string) => {
  files.add(uri);
  return { uri, status: 200 };
};

export const readDirectoryAsync = async (uri: string) =>
  [...files]
    .filter((file) => file.startsWith(uri))
    .map((file) => file.slice(uri.length));

export const deleteAsync = async (
  uri: string,
  options?: { idempotent?: boolean }
) => {
  if (!files.delete(uri) && !options?.idempotent) {
    throw new Error(`File ${uri} doesn't exist`);
  }
};
