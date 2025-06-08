export const getDomainFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace("www.", "");
  } catch (error) {
    return url;
  }
};
