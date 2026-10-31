export const safelyPrintError = (
  error: any,
  defaultMessage: string = ""
): string =>
  typeof error === "string"
    ? error
    : error?.message || defaultMessage || "An error occurred";
