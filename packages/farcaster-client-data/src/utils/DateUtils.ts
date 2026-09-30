export const formatDate = (input: number | Date) => {
  const date = typeof input === 'number' ? new Date(input) : input;
  return date.toLocaleDateString();
};
