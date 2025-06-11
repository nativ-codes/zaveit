export const getDomainFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace("www.", "");
  } catch (error) {
    return url;
  }
};

export const toTitleCase = (str: string): string => {
  return str.replace(/_/g, " ").replace(/\b\w/g, char => char.toUpperCase());
};