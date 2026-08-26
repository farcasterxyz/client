const areSetsEqual = <T>(a: Set<T>, b: Set<T>) =>
  a.size === b.size && [...a].every((value) => b.has(value));

const getSetsDiff = <T>(a: Set<T>, b: Set<T>) => {
  const diff: T[] = [];

  a.forEach((value) => {
    if (!b.has(value)) {
      diff.push(value);
    }
  });

  b.forEach((value) => {
    if (!a.has(value)) {
      diff.push(value);
    }
  });

  return new Set(diff);
};

export { areSetsEqual, getSetsDiff };
