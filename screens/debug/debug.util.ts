import { storage } from "@/config/storage/storage";

export const getDefaultMappings = () => {
  return storage.getAllKeys().filter((key) => key.startsWith("mappings."));
};
