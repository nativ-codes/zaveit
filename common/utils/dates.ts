export const formatTimestampToDate = (
  timestamp: number
): { day: string; month: string; year: string } => {
  const date = new Date(timestamp);

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear().toString();

  return { day, month, year };
};

export const formatTimestampToDateString = (timestamp: number): string => {
  const { day, month, year } = formatTimestampToDate(timestamp);
  return `${day}/${month}/${year}`;
};
