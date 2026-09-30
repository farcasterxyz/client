const removeOldTimestamps = ({
  threshold,
  sortedTimestamps,
}: {
  threshold: number;
  sortedTimestamps: number[];
}) => {
  const index = sortedTimestamps.findIndex(
    (timestamp) => timestamp >= threshold,
  );
  sortedTimestamps.splice(0, index === -1 ? sortedTimestamps.length : index);
};

export { removeOldTimestamps };
