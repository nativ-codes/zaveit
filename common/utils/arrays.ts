type GetUniqueByPropsType<T> = {
  array: T[];
  key: keyof T;
};

export const getUniqueBy = <T extends Record<string, any>>({
  array,
  key,
}: GetUniqueByPropsType<T>): T[] => {
  const mappedPosts = array.reduce<Record<string, T>>(
    (acc, item) => ({
      ...acc,
      [item[key]]: item,
    }),
    {} as Record<string, T>
  );

  return Object.values(mappedPosts);
};
