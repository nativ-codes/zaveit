export const noop = () => {};

type ToggleTagType = {
  tags: string[];
  tag: string;
};

export const toggleTag = ({ tags, tag }: ToggleTagType) =>
  tags.includes(tag) ? tags.filter((t) => t !== tag) : [...(tags || []), tag];

export const safelyPrintError = (
  error: any,
  defaultMessage: string = ""
): string =>
  typeof error === "string"
    ? error
    : error?.message || defaultMessage || "An error occurred";
