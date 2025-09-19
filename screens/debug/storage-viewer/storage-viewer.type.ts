export type StorageItemType = {
  key: string;
  value: string | null;
  parsedValue?: any;
  type: 'string' | 'object' | 'unknown';
};
