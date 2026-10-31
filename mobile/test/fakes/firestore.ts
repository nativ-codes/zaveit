import { isDeepStrictEqual } from "util";

type DocData = Record<string, any>;

const collections = new Map<string, Map<string, DocData>>();
let nextDocId = 0;

class ArrayUnion {
  constructor(readonly items: unknown[]) {}
}

export const arrayUnion = (...items: unknown[]) => new ArrayUnion(items);
export const serverTimestamp = () => new Date();

export const resetFirestore = () => {
  collections.clear();
  nextDocId = 0;
};

const getCollection = (name: string) => {
  if (!collections.has(name)) collections.set(name, new Map());
  return collections.get(name)!;
};

const applyUpdate = (current: DocData, changes: DocData) => {
  const updated = { ...current };
  for (const [field, value] of Object.entries(changes)) {
    if (value instanceof ArrayUnion) {
      // Like the real arrayUnion, skip items the array already holds.
      const merged = [...(updated[field] ?? [])];
      for (const item of value.items) {
        if (!merged.some((existing) => isDeepStrictEqual(existing, item))) {
          merged.push(item);
        }
      }
      updated[field] = merged;
    } else {
      updated[field] = value;
    }
  }
  return updated;
};

const docRef = (collectionName: string, id: string) => {
  const docs = getCollection(collectionName);
  return {
    id,
    set: async (data: DocData) => {
      docs.set(id, structuredClone(data));
    },
    update: async (changes: DocData) => {
      if (!docs.has(id)) {
        throw Object.assign(new Error(`No document ${id}`), {
          code: "firestore/not-found",
        });
      }
      docs.set(id, structuredClone(applyUpdate(docs.get(id)!, changes)));
    },
    delete: async () => {
      docs.delete(id);
    },
    get: async () => docSnapshot(collectionName, id),
  };
};

const docSnapshot = (collectionName: string, id: string) => {
  const data = getCollection(collectionName).get(id);
  return {
    id,
    exists: () => data !== undefined,
    data: () => structuredClone(data),
    ref: docRef(collectionName, id),
  };
};

type Filter = { field: string; value: unknown };

const query = (
  collectionName: string,
  filters: Filter[] = [],
  max = Infinity
) => ({
  where: (field: string, operator: string, value: unknown) => {
    if (operator !== "==") {
      throw new Error(`Fake Firestore doesn't support "${operator}"`);
    }
    return query(collectionName, [...filters, { field, value }], max);
  },
  limit: (count: number) => query(collectionName, filters, count),
  get: async () => {
    const docs = [...getCollection(collectionName).entries()]
      .filter(([, data]) =>
        filters.every(({ field, value }) => data[field] === value)
      )
      .slice(0, max)
      .map(([id]) => docSnapshot(collectionName, id));
    return { docs, empty: docs.length === 0 };
  },
});

export const getFirestore = () => ({
  collection: (name: string) => ({
    ...query(name),
    doc: (id: string = `doc-${++nextDocId}`) => docRef(name, id),
  }),
});
