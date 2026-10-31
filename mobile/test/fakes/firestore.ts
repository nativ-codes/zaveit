import { isDeepStrictEqual } from "util";

type DocData = Record<string, any>;

const collections = new Map<string, Map<string, DocData>>();
let nextDocId = 0;
let failNextBatch = false;

class ArrayUnion {
  constructor(readonly items: unknown[]) {}
}

export const arrayUnion = (...items: unknown[]) => new ArrayUnion(items);
export const serverTimestamp = () => new Date();

export const resetFirestore = () => {
  collections.clear();
  nextDocId = 0;
  failNextBatch = false;
};

export const failNextBatchCommit = () => {
  failNextBatch = true;
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

const buildQuery = (
  collectionName: string,
  filters: Filter[] = [],
  max = Infinity
) => ({
  where: (field: string, operator: string, value: unknown) => {
    if (operator !== "==") {
      throw new Error(`Fake Firestore doesn't support "${operator}"`);
    }
    return buildQuery(collectionName, [...filters, { field, value }], max);
  },
  limit: (count: number) => buildQuery(collectionName, filters, count),
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

const batch = () => {
  const refs: { delete: () => Promise<void> }[] = [];
  return {
    delete: (ref: { delete: () => Promise<void> }) => {
      refs.push(ref);
    },
    commit: async () => {
      if (failNextBatch) {
        failNextBatch = false;
        throw Object.assign(new Error("Batch failed"), {
          code: "firestore/unavailable",
        });
      }
      await Promise.all(refs.map((ref) => ref.delete()));
    },
  };
};

export const getFirestore = () => ({
  batch,
  collection: (name: string) => ({
    ...buildQuery(name),
    doc: (id: string = `doc-${++nextDocId}`) => docRef(name, id),
  }),
});

// Modular API, which the typed Firestore instance requires.
type FakeFirestore = ReturnType<typeof getFirestore>;
type FakeQuery = ReturnType<typeof buildQuery>;

export const writeBatch = (firestore: FakeFirestore) => firestore.batch();
export const collection = (firestore: FakeFirestore, name: string) =>
  firestore.collection(name);
export const doc = (
  parent: FakeFirestore | ReturnType<FakeFirestore["collection"]>,
  name?: string,
  id?: string
) =>
  "collection" in parent ? parent.collection(name!).doc(id) : parent.doc();

type Constraint = (source: FakeQuery) => FakeQuery;

export const where =
  (field: string, operator: string, value: unknown): Constraint =>
  (source) =>
    source.where(field, operator, value);
export const limit =
  (count: number): Constraint =>
  (source) =>
    source.limit(count);
export const query = (source: FakeQuery, ...constraints: Constraint[]) =>
  constraints.reduce((current, apply) => apply(current), source);
export const getDocs = (source: FakeQuery) => source.get();
export const setDoc = (ref: ReturnType<typeof docRef>, data: DocData) =>
  ref.set(data);
export const updateDoc = (ref: ReturnType<typeof docRef>, changes: DocData) =>
  ref.update(changes);
